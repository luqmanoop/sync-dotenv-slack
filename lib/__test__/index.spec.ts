import ora from 'ora';
import parseDotEnv from 'parse-dotenv';

import SlackBot from '../bot';
import { alertChannel } from '..';
import { Config } from '../models';
import * as utils from '../utils';
import * as testData from './data';

jest.mock('ora');
jest.mock('parse-dotenv');
// jest.mock('../utils');
jest.mock('../bot');

const spinnerMock = {
  stop: jest.fn(),
  succeed: jest.fn(),
  fail: jest.fn(),
  info: jest.fn(),
  text: ''
};

// @ts-ignore
ora.mockImplementation(() => ({
  start: () => spinnerMock
}));
// @ts-ignore
parseDotEnv.mockImplementation(() => testData.envObj);

process.exit = jest.fn() as any;

describe('Alert Slack Channel', () => {
  const channel = 'secret';
  const options: Config = {
    channel: null
  };
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(utils, 'exit');
  });

  afterEach(jest.clearAllMocks);

  test('channel is required', async () => {
    await alertChannel(options);
    expect(exitSpy).toHaveBeenCalledWith(
      1,
      spinnerMock,
      'channel name is required'
    );
  });

  test('channel is private/not found', async () => {
    jest.spyOn(SlackBot, 'channel').mockImplementation(() => null);
    await alertChannel({ ...options, channel });
    expect(exitSpy).toHaveBeenCalledWith(
      1,
      spinnerMock,
      `${channel} channel not found. Perhaps you forgot to invite envbot to the private channel`
    );
  });

  test('throws error', async () => {
    jest.spyOn(SlackBot, 'channel').mockImplementation(() => {
      throw new Error('oops!');
    });

    try {
      await alertChannel({ ...options, channel });
    } catch (error) {
      expect(exitSpy).toHaveBeenCalledWith(
        1,
        spinnerMock,
        'failed to sync env'
      );
    }
  });

  describe('sync', () => {
    beforeEach(() => {
      jest
        .spyOn(SlackBot, 'channel')
        .mockImplementation(() => Promise.resolve(testData.channels[1]));
      jest
        .spyOn(SlackBot, 'latestFile')
        .mockImplementation(() => Promise.resolve(testData.files[0]));

      jest
        .spyOn(utils, 'getEnvContents')
        .mockImplementation(() => testData.fileContents);
      jest.spyOn(SlackBot, 'upload').mockImplementation(() => null);
    });

    test('sync first time - no latest file', async () => {
      jest
        .spyOn(SlackBot, 'channel')
        .mockImplementation(() => Promise.resolve(testData.channels[1]));
      jest.spyOn(SlackBot, 'latestFile').mockImplementation(() => null);
      jest.spyOn(utils, 'getEnvContents').mockImplementation(() => null);
      jest.spyOn(SlackBot, 'upload').mockImplementation(() => null);

      await alertChannel({ ...options, channel });

      expect(exitSpy).toHaveBeenCalledWith(0, spinnerMock);
    });

    test('sync when envs are not in sync', async () => {
      jest.spyOn(utils, 'valuesSyncCheck').mockImplementation(() => false);

      await alertChannel({ ...options, channel });

      expect(spinnerMock.text).toEqual('synchronizing env with slack channel');
      expect(SlackBot.upload).toHaveBeenCalledWith(
        testData.fileContents,
        testData.channels[1]
      );
      expect(exitSpy).toHaveBeenCalledWith(0, spinnerMock);
    });

    test('skip sync', async () => {
      jest.spyOn(utils, 'valuesSyncCheck').mockImplementation(() => true);

      await alertChannel({ ...options, channel });

      expect(spinnerMock.info).lastCalledWith('env in sync');
      expect(SlackBot.upload).not.toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0, spinnerMock);
    });
  });
});
