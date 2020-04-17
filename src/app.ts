import * as fs from 'fs';
import { fetchSubject } from './crawler/details';
import { fetchSubjects } from './crawler/list';
import { sleep } from './utils/sleep';

(async () => {
  const set = new Set<number>();
  for await (const subject of fetchSubjects(1, '00')) {
    console.log('fetch', subject.ja.id, subject.ja.title);
    if (set.has(subject.ja.id)) continue;
    const subjectDetails = await fetchSubject(subject.ja.id);
    await fs.promises.appendFile(
      'gakubu_ja.json',
      JSON.stringify({
        ...subjectDetails.ja,
        category: subject.ja.category.slice(1),
      }) + '\n',
      {
        encoding: 'utf8',
      },
    );
    await fs.promises.appendFile(
      'gakubu_en.json',
      JSON.stringify({
        ...subjectDetails.en,
        category: subject.en.category.slice(1),
      }) + '\n',
      {
        encoding: 'utf8',
      },
    );
    set.add(subject.ja.id);

    await sleep(500);
  }
})();
