import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  dataDir: process.env.DATA_DIR || './data',
  notifyHook: {
    '00': process.env.DISCORD_HOOK_00,
    '05': process.env.DISCORD_HOOK_05,
    '06': process.env.DISCORD_HOOK_06,
  },
};
