import { WebClient, WebAPICallResult } from '@slack/web-api';
import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';
import parseEnv from 'parse-dotenv';

dotenv.config();

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

interface IMessageRes extends WebAPICallResult {
  messages?: [{ type: string; user: string; ts: string; files: any }];
}

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

const getChannelHistory = (channel: IChannel) => {
  return web[channel.is_private ? 'groups' : 'conversations'].history({
    channel: channel.id,
    count: 20,
    token: userToken
  });
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

const uploadEnv = (file: Buffer, channel: IChannel) => {
  return web.files.upload({
    filename: Date.now().toString(),
    file,
    channels: channel.name
  });
};

const isPrivateKey = (key: string): boolean => {
  return /#ignore|#private|#local/gi.test(key);
};

const excludeIgnored = (path: string = '.env') => {
  const env = parseEnv(path);
  return Object.keys(env).reduce((acc, cur) => {
    const currentValue: string = env[cur];
    const val = isPrivateKey(currentValue) ? '' : currentValue;
    return { ...acc, [cur]: val };
  }, {});
};

const objToText = (obj: object) =>
  Object.keys(obj)
    .reduce((acc, cur) => [...acc, `${cur}='${obj[cur]}'`], [])
    .join('\n');

export const getEnv = (path: string = '.env') => {
  return Buffer.from(objToText(excludeIgnored(path)));
};

const keys = (obj: {}): string[] => Object.keys(obj);
const values = (obj: {}): string[] => Object.values(obj);

export const alertChannel = async (channelName: string, file: Buffer) => {
  try {
    const channel = await getChannel(channelName);
    if (!channel) {
      console.log(
        `${channelName} channel not found. Perhaps you forgot to add envbot to the private channel`
      );
      process.exit(1);
    }

    const latestFile = await getLatestFileFromBot(channel);
    if (latestFile && latestFile.url_private) {
      const contents = await getFileContents(latestFile);
      const filename = `.env.${Date.now().toString()}`;

      fs.writeFileSync(filename, contents);

      const localEnv = excludeIgnored();
      const slackEnv = parseEnv(filename);

      const variables = keys(localEnv).every(key =>
        slackEnv.hasOwnProperty(key)
      );
      const keysInSync =
        variables && keys(localEnv).length === keys(slackEnv).length;

      const fCombinedVals = Array.from(
        new Set([...values(localEnv), ...values(slackEnv)])
      ).filter(val => val !== '');

      const fSlackVals = values(slackEnv).filter(val => val !== '');
      const fLocalVals = values(localEnv).filter(val => val !== '');
      const valSyncChecks = [
        fCombinedVals.length === fSlackVals.length,
        fCombinedVals.length === fLocalVals.length
      ];
      const valuesInSync = !valSyncChecks.includes(false);

      const inSync = keysInSync && valuesInSync;

      fs.unlinkSync(filename);

      if (!inSync) {
        await uploadEnv(file, channel);
      }
    } else {
      await uploadEnv(file, channel);
    }
    process.exit(0);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
