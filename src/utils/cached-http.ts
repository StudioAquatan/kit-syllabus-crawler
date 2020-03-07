import { createHash } from 'crypto';
import { existsSync, promises as fs } from 'fs';
import fetch from 'node-fetch';
import { sleep } from './sleep';

export const fetchWithCache = async (url: string) => {
  const hash = createHash('sha256')
    .update(url)
    .digest()
    .toString('hex');
  const cacheFile = `./cache/${hash}`;

  if (existsSync(cacheFile)) {
    return await fs.readFile(cacheFile, { encoding: 'utf8' });
  }

  await sleep(2.5 * 1000);

  const res = await fetch(url, {
    headers: {
      Referer: 'https://www.syllabus.kit.ac.jp/?c=search_list&sk=99',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36',
      'Accept-Language': 'ja,en;q=0.9,en-US;q=0.8,ga;q=0.7',
    },
  });

  if (!res.ok) throw new Error('failed');

  const text = await res.text();

  await fs.writeFile(cacheFile, text, { encoding: 'utf8' });

  return text;
};
