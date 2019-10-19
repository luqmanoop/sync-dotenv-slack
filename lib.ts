import dotenv from 'dotenv';
import ora from 'ora';
import parseEnv from 'parse-dotenv';
import tempWrite from 'temp-write';
import SlackBot from './bot';
import { Config } from './lib.model';
import { getEnvContents, keys, exit, valuesSyncCheck } from './utils';

dotenv.config();
const { SLACK_BOT_TOKEN: botToken, SLACK_USER_TOKEN: userToken } = process.env;

export const alertChannel = async (options: Config) => {
  const spinner = ora('one moment').start();
  try {
    const { channel: channelName, include: patterns } = options;
    
    if (!channelName) exit(1, spinner, 'channel name is required');

    const bot = new SlackBot({ botToken, userToken });
    spinner.text = `looking up ${channelName} channel`;
    const channel = await bot.channel(channelName);

    if (!channel) {
      exit(
        1,
        spinner,
        `${channelName} channel not found. Perhaps you forgot to invite envbot to the private channel`
      );
    }

    spinner.text = `found ${channelName} channel`;
    const localEnv = parseEnv();
    const latestFileFromBot = await bot.latestFile(channel);

    if (latestFileFromBot && latestFileFromBot.url_private) {
      spinner.text = 'comparing envs';
      const fileContents = await bot.fileContents(latestFileFromBot);
      const slackEnv = parseEnv(tempWrite.sync(fileContents));
      const variables = keys(localEnv).every(key =>
        slackEnv.hasOwnProperty(key)
      );
      const keysInSync =
        variables && keys(localEnv).length === keys(slackEnv).length;

      const valuesInSync = valuesSyncCheck(localEnv, slackEnv, patterns);
      const inSync = keysInSync && valuesInSync;

      if (!inSync) {
        spinner.text = 'env not in sync';
        spinner.text = 'synchronizing env with slack channel';
        await bot.upload(getEnvContents(localEnv, patterns), channel);
        spinner.succeed('sync successful 🎉');
      } else spinner.info('env in sync');
    } else {
      spinner.text = 'synchronizing env with slack channel';
      await bot.upload(getEnvContents(localEnv, patterns), channel);
      spinner.succeed('sync successful 🎉');
      exit(0, spinner);
    }
    exit(0, spinner);
  } catch (error) {
    exit(1, spinner, 'failed to sync env');
  }
};
