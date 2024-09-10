import { createRoute, z, type RouteHandler } from '@hono/zod-openapi';
import { ELASTICSEARCH_EN_INDEX, ELASTICSEARCH_JA_INDEX } from '../config';
import { subjectEntityType } from '../crawler/subject-io';
import { getDocument } from '../elasticsearch';

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
  'X-Revision': z
    .string()
    .default('latest')
    .openapi({
      param: {
        name: 'X-Revision',
        in: 'header',
      },
      description: 'リビジョン指定',
      default: 'latest',
      example: '20220101',
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
  const lang = c.req.header('X-Lang') ?? 'ja';
  const revision = c.req.header('X-Revision') ?? 'latest';
  const primaryKey = z.coerce.number().parse(c.req.param('id'));

  const prefix =
    lang === 'ja' ? ELASTICSEARCH_JA_INDEX : ELASTICSEARCH_EN_INDEX;
  const document = await getDocument(prefix, revision, primaryKey);

  if (document.found && document._source) {
    return c.json(document._source);
  }

  return c.notFound();
};

const getSubject = {
  route,
  handler,
};

export default getSubject;
