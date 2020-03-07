import * as fs from 'fs';
import { fetchSubject } from './crawler/details';
import { fetchSubjects } from './crawler/list';

(async () => {
  for await (const subject of fetchSubjects(1)) {
    console.log('fetch', subject.ja.id, subject.ja.title);
    const subjectDetails = await fetchSubject(subject.ja.id);
    await fs.promises.appendFile(
      'data.json',
      JSON.stringify(subjectDetails) + '\n',
      {
        encoding: 'utf8',
      },
    );
  }
})();
