import SlackBot from 'slackbots';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const bot = new SlackBot({
  token: process.env.SLACK_TOKEN,
  name: '.envBot'
})

const params = {
  icon_emoji: ':dog:'
}

const getEnv = (path: string = '.env') => {
  return fs.readFileSync(path, { encoding: 'utf-8' });
}

bot.on('start', () => {
  const env = getEnv();
  bot.postMessage('general', env, params)
})
