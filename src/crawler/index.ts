import { Worker, DelayedError, Queue, WaitingChildrenError } from 'bullmq';
import { ELASTICSEARCH_EN_INDEX, ELASTICSEARCH_JA_INDEX } from '../config';
import { redis } from '../connection';
import { addDocument, createAlias, ensureIndex } from '../elasticsearch';
import { fetchSubject } from './details';
import { fetchSubjectList } from './list';

export const listQueue = new Queue<{ page: number; indexId: string }>('list', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const listWorker = new Worker<{ page: number; indexId: string }>(
  'list',
  async (job, token) => {
    await ensureIndex(ELASTICSEARCH_JA_INDEX, job.data.indexId);
    await ensureIndex(ELASTICSEARCH_EN_INDEX, job.data.indexId);

    console.log('fetching list page = ', job.data.page);

    const result = await fetchSubjectList(job.data.page, '99');
    for (const item of result.items) {
      await detailQueue.add(
        'detail',
        { primaryKey: item.ja.id, indexId: job.data.indexId },
        {
          parent: {
            id: job.id!,
            queue: job.queueQualifiedName,
          },
        },
      );
    }

    if (!result.hasNext) {
      const shouldWait = await job.moveToWaitingChildren(token!);
      if (!shouldWait) {
        // no more children
        await createAlias(ELASTICSEARCH_JA_INDEX, job.data.indexId);
        await createAlias(ELASTICSEARCH_EN_INDEX, job.data.indexId);
        await job.moveToCompleted({}, token!);
        return;
      } else {
        throw new WaitingChildrenError();
      }
    }

    await job.moveToDelayed(Date.now() + 1000, token);
    await job.updateData({
      page: job.data.page + 1,
      indexId: job.data.indexId,
    });
    throw new DelayedError();
  },
  {
    connection: redis,
    removeOnComplete: { count: 10 },
    removeOnFail: { age: 60 * 60 },
    concurrency: 1,
    limiter: {
      max: 1,
      duration: 5000,
    },
  },
);

export const detailQueue = new Queue<{ primaryKey: number; indexId: string }>(
  'detail',
  {
    connection: redis,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  },
);

export const detailWorker = new Worker<{ primaryKey: number; indexId: string }>(
  'detail',
  async (job) => {
    console.log('fetching detail pk = ', job.data.primaryKey);
    const subject = await fetchSubject(job.data.primaryKey);
    await addDocument(
      ELASTICSEARCH_JA_INDEX,
      job.data.indexId,
      String(subject.ja.id),
      subject.ja,
    );
    await addDocument(
      ELASTICSEARCH_EN_INDEX,
      job.data.indexId,
      String(subject.en.id),
      subject.en,
    );
    return;
  },
  {
    connection: redis,
    removeOnComplete: { count: 3000 },
    removeOnFail: { age: 60 * 60 },
    concurrency: 2,
    limiter: {
      max: 4,
      duration: 1000,
    },
  },
);
