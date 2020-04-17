import * as fs from 'fs';
import fetch from 'node-fetch';
import * as hash from 'object-hash';
import { resolve } from 'path';
import { config } from './config';
import { fetchSubject } from './crawler/details';
import { fetchSubjects } from './crawler/list';
import { sleep } from './utils/sleep';

const fetchAndNotify = async (
  gakubu: string,
  jaOutput: string,
  enOutput: string,
  hashOutput: string,
  notify?: string,
) => {
  console.log('==== start for ====', gakubu);

  if (fs.existsSync(jaOutput)) {
    await fs.promises.unlink(jaOutput);
  }
  if (fs.existsSync(enOutput)) {
    await fs.promises.unlink(enOutput);
  }

  let hashMap: Record<string, string> = {};
  if (fs.existsSync(hashOutput)) {
    try {
      hashMap = JSON.parse(
        await fs.promises.readFile(hashOutput, { encoding: 'utf8' }),
      );
    } catch (e) {
      console.error(e);
      hashMap = {};
    }
  }

  const duplicateCheck = new Set<number>();
  for await (const subject of fetchSubjects(1, gakubu)) {
    console.log('fetch', gakubu, subject.ja.id, subject.ja.title);

    if (duplicateCheck.has(subject.ja.id)) continue;

    const subjectDetails = await fetchSubject(subject.ja.id);
    await fs.promises.appendFile(
      jaOutput,
      JSON.stringify({
        ...subjectDetails.ja,
        category: subject.ja.category.slice(1),
      }) + '\n',
      {
        encoding: 'utf8',
      },
    );
    await fs.promises.appendFile(
      enOutput,
      JSON.stringify({
        ...subjectDetails.en,
        category: subject.en.category.slice(1),
      }) + '\n',
      {
        encoding: 'utf8',
      },
    );
    duplicateCheck.add(subject.ja.id);

    const hashVal = hash(subject);
    if (
      hashMap[subject.ja.id] &&
      hashMap[subject.ja.id] !== hashVal &&
      notify
    ) {
      await fetch(notify, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `シラバスが更新されました: [${subject.ja.title}](https://www.syllabus.kit.ac.jp/?c=detail&pk=${subject.ja.id})`,
        }),
      });
    }
    hashMap[subject.ja.id] = hashVal;

    await sleep(5000);
  }

  await fs.promises.writeFile(hashOutput, JSON.stringify(hashMap), {
    encoding: 'utf8',
  });
};

(async () => {
  await fetchAndNotify(
    '00',
    resolve(config.dataDir, 'gakubu_ja.json'),
    resolve(config.dataDir, 'gakubu_en.json'),
    resolve(config.dataDir, 'gakubu_hash'),
    config.notifyHook['00'],
  );
})();
