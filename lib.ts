import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';
import parseEnv from 'parse-dotenv';

dotenv.config();

const token = process.env.SLACK_TOKEN;
const web = new WebClient(token);

interface IChannel {
  name: string;
  id: string;
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

const getLatestFile = async (channel: IChannel): Promise<IFile> => {
  const { messages } = await web.channels.history({
    channel: channel.id,
    count: 1
  });
  return messages[0].files ? messages[0].files[0] : null;
};

const getFileContents = async (file: IFile) => {
  const { data } = await axios(file.url_private, {
    headers: {
      Authorization: `Bearer ${token}`
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

const getEnv = (path: string = '.env') => {
  return fs.readFileSync(path);
};

const keys = (obj: {}): string[] => Object.keys(obj);

const alertChannel = async (channelName: string, file: Buffer) => {
  try {
    const channel = await getChannel(channelName);
    if (!channel) {
      console.log(`${channelName} channel not found. Perhaps you forgot to add envbot to the private channel`);
      process.exit(1);
    }

    const latestFile = await getLatestFile(channel);
    if (latestFile && latestFile.url_private) {
      const contents = await getFileContents(latestFile);
      const filename = `.env.${Date.now().toString()}`;
      
      fs.writeFileSync(filename, contents);

      const localEnv = parseEnv();
      const slackEnv = parseEnv(filename);

      const variables = keys(localEnv).every(key =>
        slackEnv.hasOwnProperty(key)
      );
      const inSync =
        variables && keys(localEnv).length === keys(slackEnv).length;

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

alertChannel('frontend', getEnv());
