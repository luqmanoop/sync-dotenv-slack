import { IFile, Channel } from '../models';

export const slackBotId = 'A899';
export const channels: Channel[] = [
  {
    id: '1',
    is_private: false,
    name: 'general'
  },
  {
    id: '1',
    is_private: true,
    name: 'backend-envs'
  }
];

export const files: IFile[] = [
  {
    title: Date.now.toString(),
    url_private: 'https://foo.io',
    user: slackBotId
  }
];

export const fileContents = `
DB_NAME=foo
DB_PASSWORD=mysecret
DB_USER=johndoe
`.trim();

export const envObj = {
  DB_NAME: 'foo',
  DB_PASSWORD: 'mysecret',
  DB_USER: 'johndoe'
};
