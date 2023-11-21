import { fetchSubject } from './crawler/details';
import { fetchSubjects } from './crawler/list';
import { sleep } from './utils/sleep';
import { writeFile } from 'fs/promises';

(async () => {
  const set = new Set<number>();
  for await (const subject of fetchSubjects(1, '00')) {
    if (set.has(subject.ja.id)) continue;

    console.log('fetch', subject.ja.id, subject.ja.title);

    const subjectDetails = await fetchSubject(subject.ja.id);

    await writeFile(
      `./data/${subject.ja.id}.json`,
      JSON.stringify(subjectDetails, null, 2),
      { encoding: 'utf8' },
    );

    await sleep(1000);
  }
})();
