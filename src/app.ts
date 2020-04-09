import * as fs from 'fs';
import { fetchSubject } from './crawler/details';
import { fetchSubjects } from './crawler/list';
// import { sleep } from './utils/sleep';

(async () => {
  for await (const subject of fetchSubjects(1, '00')) {
    console.log('fetch', subject.ja.id, subject.ja.title);
    const subjectDetails = await fetchSubject(subject.ja.id);
    await fs.promises.appendFile(
      'gakubu.json',
      JSON.stringify({
        ja: {
          ...subjectDetails.ja,
          category: subject.ja.category.slice(1),
        },
        en: {
          ...subjectDetails.en,
          category: subject.en.category.slice(1),
        },
      }) + '\n',
      {
        encoding: 'utf8',
      },
    );
  }
})();
