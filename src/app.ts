import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';

import getSubject from './api/get-subject';

import { PORT } from './config';
import { elastic } from './connection';
import { detailQueue, listQueue } from './crawler';

import load from './seed/load';
import save from './seed/save';

(async () => {
  const info = await elastic.info();
  console.log('Elasticsearch version', info.version.number);

  const app = new OpenAPIHono();

  app.get('/', (c) => c.text('Hello Hono!'));

  const serverAdapter = new HonoAdapter(serveStatic);
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(listQueue), new BullMQAdapter(detailQueue)],
    serverAdapter,
  });

  app.route('/admin/queues', serverAdapter.registerPlugin());

  app.openapi(getSubject.route, getSubject.handler);

  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'KIT Syllabus API',
    },
  });

  app.get('/ui', swaggerUI({ url: '/doc' }));

  if (process.env.NODE_ENV === 'development') {
    app.post('/seed/save', async (c) => {
      await save('ja', './data/ja.json');
      await save('en', './data/en.json');
      return c.text('Saved');
    });

    app.post('/seed/load', async (c) => {
      await load('ja', './data/ja.json');
      await load('en', './data/en.json');
      return c.text('Loaded');
    });
  }

  serve({
    fetch: app.fetch,
    port: PORT,
  });
})();
