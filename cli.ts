#!/usr/bin/env node
import pkgConf from 'pkg-conf';

import { alertChannel } from './lib';
import { Config } from './lib.model';

const defaultConfig: Config = {
  include: [],
  channel: null
};

(async () => {
  const config: Config = (await pkgConf('envbot')) as any;
  alertChannel({ ...defaultConfig, ...config });
})();
