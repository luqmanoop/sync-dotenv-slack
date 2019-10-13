export interface Channel {
  name: string;
  id: string;
  is_private: boolean;
}

export interface IFile {
  title: string;
  user: string;
  url_private: string;
}

export interface Config {
  channel: string;
  include?: string[];
}

export interface Env {
  [key: string]: string;
}

export interface Token {
  botToken: string;
  userToken: string;
}
