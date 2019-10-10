#!/usr/bin/env node
import { alertChannel, getEnv } from './lib';
import pkgConf from 'pkg-conf';

interface IConfig {
  channel: string;
  include: string[]|boolean;
}

(async () => {
  const config: IConfig = (await pkgConf('envbot')) as any;
  const { channel, include } = config;
  alertChannel(channel, getEnv());
})();
