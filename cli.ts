#!/usr/bin/env node
import { alertChannel, getEnv } from './lib';
import pkgConf from 'pkg-conf';

interface IConfig {
  channel: string;
  include: string[];
}

(async () => {
  const config: IConfig = (await pkgConf('envbot')) as any;
  alertChannel({ ...config }, getEnv()); 
})();
