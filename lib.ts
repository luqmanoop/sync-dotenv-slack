import { WebClient, WebAPICallResult } from '@slack/web-api';
import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';
import parseEnv from 'parse-dotenv';
import ora from 'ora';

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

const uploadEnv = (file: Buffer, channel: IChannel) => {
  return web.files.upload({
    filename: Date.now().toString(),
    file,
    channels: channel.name
  });
};

export const getEnv = (path: string = '.env') => {
  return fs.readFileSync(path);
};

const keys = (obj: {}): string[] => Object.keys(obj);
const values = (obj: {}): string[] => Object.values(obj);

export const alertChannel = async (channelName: string, file: Buffer) => {
  if (!channelName) {
    spinner.warn('channel name is required');
    process.exit(1);
  }
  try {
    spinner.text = `finding ${channelName} channel`;
    const channel = await getChannel(channelName);
    if (!channel) {
      spinner.warn(`${channelName} channel not found. Perhaps you forgot to add envbot to the private channel`);
      process.exit(1);
    }

    const latestFile = await getLatestFileFromBot(channel);
    if (latestFile && latestFile.url_private) {
      spinner.text = 'comparing envs';
      const contents = await getFileContents(latestFile);
      const filename = `.env.${Date.now().toString()}`;

      fs.writeFileSync(filename, contents);

      const localEnv = parseEnv();
      const slackEnv = parseEnv(filename);

      const variables = keys(localEnv).every(key =>
        slackEnv.hasOwnProperty(key)
      );
      const keysInSync =
        variables && keys(localEnv).length === keys(slackEnv).length;

      const valuesInSync =
        new Set([...values(localEnv), ...values(slackEnv)]).size ===
        values(localEnv).length;

      const inSync = keysInSync && valuesInSync;

      fs.unlinkSync(filename);

      if (!inSync) {
        spinner.text = 'env is out of sync. performing sync';
        await uploadEnv(file, channel);
        spinner.succeed('sync successful 🎉');
      } else spinner.info('env in sync');
    } else {
      await uploadEnv(file, channel);
    }
    spinner.stop();
    process.exit(0);
  } catch (error) {
    spinner.fail(error.message);
    spinner.stop();
    process.exit(1);
  }
};
