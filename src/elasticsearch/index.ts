import { elastic } from '../connection';
import { SubjectEntity } from '../crawler/subject-io';
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

export async function addDocument(
  prefix: string,
  indexId: string,
  id: string,
  body: SubjectEntity,
) {
  await elastic.index<SubjectEntity>({
    index: indexName(prefix, indexId),
    id,
    body,
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
