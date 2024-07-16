import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { PORT } from './config';
import { elastic } from './connection';
import { detailQueue, listQueue } from './crawler';

(async () => {
  const info = await elastic.info();
  console.log('Elasticsearch version', info.version.number);

  const app = new Hono();

  app.get('/', (c) => c.text('Hello Hono!'));

  const serverAdapter = new HonoAdapter(serveStatic);
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(listQueue), new BullMQAdapter(detailQueue)],
    serverAdapter,
  });

  app.route('/admin/queues', serverAdapter.registerPlugin());

  serve({
    fetch: app.fetch,
    port: PORT,
  });
})();
