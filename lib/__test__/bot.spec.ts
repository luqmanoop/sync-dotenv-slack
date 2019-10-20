import Axios from 'axios';
import { Buffer } from 'buffer';
import fs from 'fs';
import tempWrite from 'temp-write';
import SlackBot from '../bot';
import * as testData from './data';

jest.mock('temp-write');
jest.mock('fs');

describe('SlackBot', () => {
  describe('channel(s)', () => {
    beforeEach(() => {
      SlackBot.web.conversations.list = jest.fn(() =>
        Promise.resolve({ channels: testData.channels })
      ) as any;
    });

    test('get channels', async () => {
      expect(await SlackBot.channels()).toEqual(testData.channels);
    });

    test('get channel', async () => {
      const channel = testData.channels[0];
      expect(await SlackBot.channel(channel.name)).toEqual(channel);
    });
  });

  describe('file(s)', () => {
    beforeEach(() => {
      SlackBot.web.auth.test = jest.fn(() =>
        Promise.resolve({ user_id: testData.slackBotId })
      ) as any;
    });

    test('get latest file', async () => {
      SlackBot.web.files.list = jest.fn(() =>
        Promise.resolve({ files: testData.files })
      ) as any;
      const channel = testData.channels[1];
      const latestFile = await SlackBot.latestFile(channel);
      expect(latestFile).toEqual(testData.files[0]);
    });

    test('no latest file', async () => {
      SlackBot.web.files.list = jest.fn(() =>
        Promise.resolve({ files: [] })
      ) as any;
      const channel = testData.channels[1];
      const latestFile = await SlackBot.latestFile(channel);
      expect(latestFile).toEqual(null);
    });

    test('get file contents', async () => {
      Axios.get = jest.fn(() =>
        Promise.resolve({ data: testData.fileContents })
      ) as any;
      const contents = await SlackBot.fileContents(testData.files[0]);
      expect(contents).toEqual(testData.fileContents);
    });

    test('should upload file', async () => {
      const channel = testData.channels[0];
      SlackBot.web.files.upload = jest.fn();

      const mockFilePath = '/private/tmp/z/mockfile';
      const file = Buffer.from(testData.fileContents);
      // @ts-ignore
      tempWrite.mockImplementation(() => Promise.resolve(mockFilePath));
      fs.readFileSync = jest.fn(() => file) as any;

      await SlackBot.upload(testData.fileContents, channel);
      expect(SlackBot.web.files.upload).toHaveBeenCalledWith({
        file,
        channels: channel.name,
        filename: expect.any(String)
      });
    });
  });
});
