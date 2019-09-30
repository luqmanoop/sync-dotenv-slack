import SlackBot from 'slackbots';
import dotenv from 'dotenv';

dotenv.config();

const bot = new SlackBot({
  token: process.env.SLACK_TOKEN,
  name: '.envBot'
})

const params = {
  icon_emoji: ':dog:'
}

bot.on('start', () => {
  bot.postMessage('general', 'Hello, world', params)
})
