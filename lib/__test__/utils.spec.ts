import fs from 'fs';
import { Buffer } from 'buffer';
import ora from 'ora';
import parseDotEnv from 'parse-dotenv';

import * as utils from '../utils';
import * as testData from './data';

jest.mock('fs');
const spinner = ora().start();

describe('Utils', () => {
  const env = testData.envObj;

  test('getEnv', () => {
    const file = Buffer.from(testData.fileContents);
    fs.readFileSync = jest.fn(() => file) as any;
    expect(utils.getEnv()).toEqual(file);
    expect(utils.getEnv('.env')).toEqual(file);
  });

  test('should get object keys', () => {
    const obj = { foo: 'foo', bar: 'bar' };
    expect(utils.keys(obj)).toEqual([obj.foo, obj.bar]);
  });

  test('should get object values', () => {
    const obj = { foo: 'foo', bar: 'bar' };
    expect(utils.values(obj)).toEqual([obj.foo, obj.bar]);
  });

  describe('exit process', () => {
    const successCode = 0;
    const failureCode = 1;

    beforeEach(() => {
      process.exit = jest.fn() as any;
      spinner.fail = jest.fn();
    });

    test('success exit', () => {
      utils.exit(successCode, spinner);
      expect(process.exit).toBeCalledWith(successCode);
    });

    test('failure exit', () => {
      utils.exit(failureCode, spinner, 'oops!');
      expect(spinner.fail).toBeCalledWith('oops!');
      expect(process.exit).toBeCalledWith(failureCode);
    });
  });

  describe('getFinalEnvObj', () => {
    test('returns all env with no values', () => {
      const finalEnv = utils.getFinalEnvObj(env, []);
      const finalEnvHasNoValue = utils
        .keys(finalEnv)
        .every(key => finalEnv[key] == '');

      expect(finalEnvHasNoValue).toBe(true);
    });

    test('exclude negated variable values', () => {
      const patterns = ['!DB_PASSWORD'];
      expect(utils.getFinalEnvObj(env, patterns)).toEqual({
        ...env,
        DB_PASSWORD: ''
      });
    });

    test('only included variables with values', () => {
      const patterns = ['DB_NAME'];
      expect(utils.getFinalEnvObj(env, patterns)).toEqual({
        DB_NAME: env.DB_NAME,
        DB_PASSWORD: '',
        DB_USER: ''
      });
    });

    test('convert env obj to string', () => {
      const parsed = utils.envToString(env);
      expect(parsed).toContain(env.DB_PASSWORD);
      expect(parsed).toContain(env.DB_NAME);
      expect(parsed).toContain(env.DB_USER);
    });

    test('get env contents', () => {
      const envContents = utils.getEnvContents(env, [
        '!DB_PASSWORD',
        'DB_USER'
      ]);
      expect(envContents).not.toContain(env.DB_PASSWORD);
      expect(envContents).not.toContain(env.DB_NAME);

      expect(envContents).toContain(env.DB_USER);
    });
  });

  describe('env values', () => {
    const patterns = ['!DB_NAME'];
    const slackEnv = utils.getFinalEnvObj(env, patterns);

    test('should not be in sync', () => {
      expect(
        utils.valuesSyncCheck(
          { ...env, DB_PASSWORD: 'SECRET' },
          slackEnv,
          patterns
        )
      ).toBe(false);
    });

    test('should be in sync', () => {
      expect(utils.valuesSyncCheck(env, slackEnv, ['!DB_NAME'])).toBe(true);
    });
  });
});
