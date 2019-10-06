import dotenv from 'dotenv';
import { alertChannel, getEnv } from './lib';

dotenv.config();

const { ENV_CHANNEL = 'general' } = process.env;

alertChannel(ENV_CHANNEL, getEnv());
