import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import axios from 'axios';
import parseEnv from 'parse-dotenv';
import ora from 'ora';
import tempWrite from 'temp-write';

dotenv.config();
const spinner = ora('one moment').start();

const botToken = process.env.SLACK_BOT_TOKEN;
const userToken = process.env.SLACK_USER_TOKEN;

const web = new WebClient(botToken);

interface IChannel {
  name: string;
  id: string;
  is_private: boolean;
}

interface IFile {
  title: string;
  user: string;
  url_private: string;
}

interface IOptions {
  channel: string;
  include?: string[];
}

interface EnvObject {
  [key: string]: string;
}

export const envToString = (envObj: EnvObject) =>
  keys(envObj)
    .map(key => `${key}=${envObj[key] || ''}`)
    .join('\r\n')
    .replace(/(__\w+_\d+__=)/g, '');

const getChannels = async (): Promise<IChannel[]> => {
  const { channels } = await web.conversations.list({
    exclude_archived: true,
    types: 'public_channel,private_channel'
  });
  return channels as IChannel[];
};

const getChannel = async (channelName: string): Promise<IChannel> => {
  const channels = await getChannels();
  return channels.filter(channel => channel.name === channelName)[0];
};

const getLatestFileFromBot = async (channel: IChannel) => {
  const { user_id: SLACK_BOT_ID } = await web.auth.test();
  const { files } = await web.files.list({
    channel: channel.id,
    user: `${SLACK_BOT_ID}`,
    count: 1,
    token: userToken
  });
  return files[0] || null;
};

const getFileContents = async (file: IFile) => {
  const { data } = await axios(file.url_private, {
    headers: {
      Authorization: `Bearer ${botToken}`
    }
  });
  return data;
};

const uploadEnv = async (envObj: EnvObject, channel: IChannel) => {
  return tempWrite(envToString(envObj)).then(filePath => {
    const file = readFileSync(filePath);
    return web.files.upload({
      filename: Date.now().toString(),
      file,
      channels: channel.name
    });
  });
};

export const getEnv = (path: string = '.env') => {
  return readFileSync(path);
};

const keys = (obj: {}): string[] => Object.keys(obj);
const values = (obj: {}): string[] => Object.values(obj);

const getFinalEnvObj = (
  env: { [key: string]: string },
  patterns: string[]
): EnvObject => {
  const envObj = { ...env };
  const blacklist = [];
  const whitelist = [];

  if (!patterns || !patterns.length) {
    keys(envObj).forEach(key => {
      envObj[key] = '';
    });
    return envObj;
  }

  patterns.forEach(pattern => {
    if (pattern.startsWith('!')) blacklist.push(pattern.slice(1));
    else whitelist.push(pattern);
  });

  const envToIncludeWithValues = keys(envObj).filter((key: string) => {
    return !whitelist.length || whitelist.includes('*')
      ? !blacklist.includes(key)
      : !blacklist.includes(key) && whitelist.includes(key);
  });

  keys(envObj).forEach(key => {
    if (!envToIncludeWithValues.includes(key)) {
      envObj[key] = '';
    }
  });

  return envObj;
};

const exit = (code: number, msg?: string) => {
  if (code > 0 && msg) spinner.fail(msg);
  spinner.stop();
  process.exit(code);
};

export const alertChannel = async (options: IOptions, file: Buffer) => {
  try {
    const { channel: channelName, include: patterns } = options;
    if (!channelName) {
      exit(1, 'channel name is required');
    }

    spinner.text = `looking up ${channelName} channel`;
    const channel = await getChannel(channelName);

    if (!channel) {
      exit(
        1,
        `${channelName} channel not found. Perhaps you forgot to invite envbot to the private channel`
      );
    }

    spinner.text = `found ${channelName} channel`;

    const localEnv = parseEnv();
    const latestFile = await getLatestFileFromBot(channel);
    if (latestFile && latestFile.url_private) {
      spinner.text = 'comparing envs';

      const contents = await getFileContents(latestFile);
      const slackEnv = parseEnv(tempWrite.sync(contents));
      const variables = keys(localEnv).every(key =>
        slackEnv.hasOwnProperty(key)
      );
      const keysInSync =
        variables && keys(localEnv).length === keys(slackEnv).length;

      // const valuesInSync =
      //   new Set([...values(localEnv), ...values(slackEnv)]).size ===
      //   values(localEnv).length;

      const inSync = keysInSync;

      if (!inSync) {
        spinner.text = 'env not in sync';
        spinner.text = 'synchronizing env with slack channel';
        await uploadEnv(getFinalEnvObj(localEnv, patterns), channel);
        spinner.succeed('sync successful 🎉');
      } else spinner.info('env in sync');
    } else {
      spinner.text = 'synchronizing env with slack channel';
      await uploadEnv(getFinalEnvObj(localEnv, patterns), channel);
      spinner.succeed('sync successful 🎉');
    }
    exit(0);
  } catch (error) {
    exit(1, 'failed to sync env');
  }
};
