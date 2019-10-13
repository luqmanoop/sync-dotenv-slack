#!/usr/bin/env node
import pkgConf from 'pkg-conf';

import { alertChannel } from './lib';
import { Config } from './lib.model';

(async () => {
  const config: Config = (await pkgConf('envbot')) as any;
  alertChannel({ ...config }); 
})();
