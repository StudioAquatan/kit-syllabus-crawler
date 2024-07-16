import { config } from 'dotenv';

config();

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
export const ELASTICSEARCH_JA_INDEX =
  process.env.ELASTICSEARCH_JA_INDEX || 'subjects_ja';
export const ELASTICSEARCH_EN_INDEX =
  process.env.ELASTICSEARCH_EN_INDEX || 'subjects_en';
export const PORT = Number(process.env.PORT || 3000);
