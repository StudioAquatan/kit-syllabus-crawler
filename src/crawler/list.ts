import { isLeft, isRight } from 'fp-ts/lib/Either';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import {
  subjectL10nSimpleEntity,
  SubjectL10nSimpleEntity,
} from '../entities/subject';

export const fetchSubjectList = async (page: number) => {
  const res = await fetch(
    `https://www.syllabus.kit.ac.jp/?c=search_list&sk=99&page=${page}`,
    {
      headers: {
        Referer: 'https://www.syllabus.kit.ac.jp/?c=search_list&sk=99',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9,en-US;q=0.8,ga;q=0.7',
      },
    },
  );
  if (!res.ok) throw new Error('failed');

  const dom = new JSDOM(await res.text());

  const hasPrevious = !!dom.window.document.querySelector(
    `[href="?c=search_list&sk=99&page=${page - 1}"]`,
  );
  const hasNext = !!dom.window.document.querySelector(
    `[href="?c=search_list&sk=99&page=${page + 1}"]`,
  );

  const dataListTbl = dom.window.document.querySelector(
    '#search_result_area .data_list_tbl > tbody',
  );
  if (!dataListTbl) throw new Error('no data');

  const dataListItems: Element[] = [].slice.apply(
    dataListTbl.querySelectorAll('tr:not(:first-child)'),
  );

  const items = dataListItems
    .filter(tr => !!tr.querySelector('td'))
    .map(tr => ({
      ja: {
        id: Number(tr.children.item(0)?.textContent),
        title: tr.children.item(1)?.querySelector('a')?.firstChild?.textContent,
        class: tr.children.item(2)?.firstChild?.textContent,
        type: tr.children.item(3)?.firstChild?.textContent,
        credits: Number(tr.children.item(4)?.textContent),
      },
      en: {
        id: Number(tr.children.item(0)?.textContent),
        title: tr.children.item(1)?.querySelector('a')?.lastChild?.textContent,
        class: tr.children.item(2)?.lastChild?.textContent,
        type: tr.children.item(3)?.lastChild?.textContent,
        credits: Number(tr.children.item(4)?.textContent),
      },
    }))
    .map(item => subjectL10nSimpleEntity.decode(item));

  if (items.some(item => isLeft(item))) throw new Error('invalid page');

  return {
    hasNext,
    hasPrevious,
    items: items.map(
      item => (isRight(item) ? item.right : null), // it must be right
    ) as SubjectL10nSimpleEntity[],
  };
};

export const fetchSubjects = async function*() {
  for (let page = 1; ; page++) {
    const result = await fetchSubjectList(page);
    for (const item of result.items) {
      yield item;
    }

    if (!result.hasNext) break;
  }
};
