import { Client } from '@elastic/elasticsearch';
import IORedis from 'ioredis';
import { ELASTICSEARCH_URL, REDIS_URL } from './config';

export const redis = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const elastic = new Client({ node: ELASTICSEARCH_URL });
