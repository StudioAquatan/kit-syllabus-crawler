import { readFile } from 'node:fs/promises';
import { ELASTICSEARCH_JA_INDEX, ELASTICSEARCH_EN_INDEX } from '../config';
import { subjectEntityType } from '../crawler/subject-io';
import { addDocument, createAlias, ensureIndex } from '../elasticsearch';

export default async function load(
  type: 'ja' | 'en',
  fileName: string,
  indexId = `${Date.now()}`,
) {
  const prefix =
    type === 'ja' ? ELASTICSEARCH_JA_INDEX : ELASTICSEARCH_EN_INDEX;
  await ensureIndex(prefix, indexId);

  console.log(`Loading documents from ${fileName}`);
  const json = await readFile(fileName, { encoding: 'utf-8' });
  const jsonLines = json.split('\n');

  for (const line of jsonLines) {
    const document = JSON.parse(line);
    const validatedDocument = subjectEntityType.parse(document);
    await addDocument(
      prefix,
      indexId,
      validatedDocument.id.toString(),
      validatedDocument,
    );
  }

  console.log(`Loaded ${jsonLines.length} documents`);

  await createAlias(prefix, indexId);
}
