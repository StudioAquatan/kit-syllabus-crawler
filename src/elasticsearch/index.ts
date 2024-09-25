import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { elastic } from '../connection';
import type { SubjectEntity } from '../crawler/subject-io';
import { createCreateIndexRequest } from './mapping';

const indexName = (prefix: string, indexId: string) => `${prefix}-${indexId}`;

export async function ensureIndex(prefix: string, indexId: string) {
  const hasIndex = await elastic.indices.exists({
    index: indexName(prefix, indexId),
  });
  if (hasIndex) {
    return;
  }

  await elastic.indices.create(
    createCreateIndexRequest(indexName(prefix, indexId)),
  );
}

type SubjectEntityWithCompletion = SubjectEntity & {
  completion: {
    input: string[];
  };
};

export async function addDocument(
  prefix: string,
  indexId: string,
  id: string,
  body: SubjectEntity,
) {
  const bodyWithCompletion: SubjectEntityWithCompletion = {
    ...body,
    completion: {
      input: [body.title, ...body.instructors.map(({ name }) => name)],
    },
  };
  await elastic.index<SubjectEntityWithCompletion>({
    index: indexName(prefix, indexId),
    id,
    body: bodyWithCompletion,
  });
}

export async function getDocument(
  prefix: string,
  indexId: string,
  id: string | number,
) {
  return elastic.get<SubjectEntityWithCompletion>({
    index: indexName(prefix, indexId),
    id: id.toString(),
  });
}

export async function search(
  prefix: string,
  indexId: string,
  body: SearchRequest,
) {
  const index = indexName(prefix, indexId);

  return elastic.search<SubjectEntityWithCompletion>({
    ...body,
    index,
  });
}

export async function scroll(scrollId: string) {
  return elastic.scroll<SubjectEntityWithCompletion>({
    scroll: '1m',
    scroll_id: scrollId,
  });
}

export async function createAlias(prefix: string, indexId: string) {
  const alias = `${prefix}-latest`;
  const index = indexName(prefix, indexId);

  await elastic.indices.updateAliases({
    body: {
      actions: [
        {
          remove: {
            index: '*',
            alias,
          },
        },
        {
          add: {
            index,
            alias,
          },
        },
      ],
    },
  });
}
