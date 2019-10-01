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

const alertChannel = async (channel: string, text: string) => {
  try {
    await web.chat.postMessage({ channel, text, token, ...params });
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

const getEnv = (path: string = '.env') => {
  return fs.readFileSync(path, { encoding: 'utf-8' });
};

alertChannel('bot', getEnv());
