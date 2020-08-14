import { Client } from '@elastic/elasticsearch';
import { Update } from '@elastic/elasticsearch/api/requestParams';
import { fetchSubject } from './crawler/details';
import { fetchSubjects } from './crawler/list';
import { esIndexDef } from './es-defs';
import { sleep } from './utils/sleep';

(async () => {
  const es = new Client({
    node: process.env.ES_HOST,
  });
  const index = process.env.ES_INDEX || 'kitsyllabus';

  const existsResult = await es.indices.exists({
    index,
  });

  if (existsResult.statusCode !== 200) {
    await es.indices.create({
      index,
      body: esIndexDef,
    });
  }

  const set = new Set<number>();
  for await (const subject of fetchSubjects(1, '00')) {
    if (set.has(subject.ja.id)) continue;

    console.log('fetch', subject.ja.id, subject.ja.title);

    const subjectDetails = await fetchSubject(subject.ja.id);
    const options: Update = {
      index,
      id: `${subjectDetails.ja.id}`,
      body: {
        doc: subjectDetails.ja,
        doc_as_upsert: true,
      },
    };
    const result = await es.update(options);
    if (result.statusCode !== 200 && result.statusCode !== 201) {
      console.log(
        'update failed',
        subject.ja.id,
        subject.ja.title,
        result.statusCode,
        result.warnings,
      );
    }

    if (result.body.result !== 'noop' && result.body.result !== 'created') {
      console.log(
        'updated',
        subject.ja.id,
        subject.ja.title,
        result.body.result,
      );
    }

    await sleep(5000);
  }
})();
