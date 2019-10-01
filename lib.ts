import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const token = process.env.SLACK_TOKEN;
const web = new WebClient(token);

const params = {
  icon_emoji: ':dog:',
  username: '.envBot'
};
interface IChannel {
  name: string;
  id: string;
}

interface IMessage {
  text: string;
  username: string;
  bot_id: string;
}

const getChannels = async (): Promise<IChannel[]> => {
  const { channels } = await web.conversations.list({ exclude_archived: true, types: 'public_channel,private_channel' });
  return channels as IChannel[];
}

const getChannel = async (channelName: string): Promise<IChannel> => {
  const channels = await getChannels();
  return channels.filter(channel => channel.name === channelName)[0];
}

const getLatestMessage = async (channel: IChannel): Promise<IMessage> => {
  const { messages } = await web.channels.history({ channel: channel.id, count: 1 });
  return messages[0];
}

const getEnv = (path: string = '.env') => {
  return fs.readFileSync(path);
};

const alertChannel = async (channelName: string, text: Buffer) => {
  try {
    const channel = await getChannel(channelName);
    const oldEnvPost = await getLatestMessage(channel);
    await web.files.upload({ filename: Date.now().toString(), file: getEnv(), channels: channel.name })
    console.log(oldEnvPost);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};
