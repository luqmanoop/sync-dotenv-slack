import dotenv from 'dotenv';
import ora from 'ora';
import parseEnv from 'parse-dotenv';
import tempWrite from 'temp-write';
import bot from './bot';
import { Config } from './models';
import { getEnvContents, keys, exit, valuesSyncCheck } from './utils';

dotenv.config();

export const alertChannel = async (options: Config) => {
  const spinner = ora('one moment').start();
  try {
    const { channel: channelName, include: patterns } = options;

    if (!channelName) return exit(1, spinner, 'channel name is required');

    spinner.text = `looking up ${channelName} channel`;
    const channel = await bot.channel(channelName);

    if (!channel) {
      return exit(
        1,
        spinner,
        `${channelName} channel not found. Perhaps you forgot to invite envbot to the private channel`
      );
    }

    spinner.text = `found ${channelName} channel`;
    const localEnv = parseEnv('.env.local');
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
    }
    exit(0, spinner);
  } catch (error) {
    console.log(error)
    exit(1, spinner, 'failed to sync env');
  }
};
