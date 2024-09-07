import { createRoute, z, RouteHandler } from '@hono/zod-openapi';
import { subjectEntityType } from '../crawler/subject-io';

const ParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: 'id',
      in: 'path',
    },
    description: '教科のPrimary Key。時間割番号などではありません',
    example: '176',
  }),
});

const HeadersSchema = z.object({
  'X-Lang': z
    .enum(['ja', 'en'])
    .default('ja')
    .openapi({
      param: {
        name: 'X-Lang',
        in: 'header',
      },
      description: '言語指定',
      example: 'ja',
    }),
});

const ResponseSchema = subjectEntityType;

const route = createRoute({
  method: 'get',
  path: '/subjects/{id}',
  request: {
    params: ParamsSchema,
    headers: HeadersSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ResponseSchema,
        },
      },
      description: '対応する教科情報を得る',
    },
    404: {
      description: '教科が見つからない',
    },
  },
});

const handler: RouteHandler<typeof route> = async (c) => {
  return c.notFound();
};

const getSubject = {
  route,
  handler,
};

export default getSubject;
