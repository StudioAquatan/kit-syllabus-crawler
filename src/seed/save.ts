import { writeFile } from 'node:fs/promises';
import { ELASTICSEARCH_EN_INDEX, ELASTICSEARCH_JA_INDEX } from '../config';
import { subjectEntityType } from '../crawler/subject-io';
import { scroll, search } from '../elasticsearch';

export default async function save(type: 'ja' | 'en', fileName: string) {
  const prefix =
    type === 'ja' ? ELASTICSEARCH_JA_INDEX : ELASTICSEARCH_EN_INDEX;
  const indexId = 'latest';

  const jsonLines = [];
  const searchResponse = await search(prefix, indexId, {
    scroll: '1m',
    size: 1000,
  });
  jsonLines.push(
    searchResponse.hits.hits.map((hit) => {
      const strippedDocument = subjectEntityType.strip().parse(hit._source);
      return JSON.stringify(strippedDocument);
    }),
  );

  let scrollId = searchResponse._scroll_id;
  while (scrollId) {
    const scrollResponse = await scroll(scrollId);
    jsonLines.push(
      scrollResponse.hits.hits.map((hit) => {
        const strippedDocument = subjectEntityType.strip().parse(hit._source);
        return JSON.stringify(strippedDocument);
      }),
    );
    scrollId = searchResponse._scroll_id;
  }

  const json = jsonLines.join('\n');
  await writeFile(fileName, json, { encoding: 'utf-8' });
}
