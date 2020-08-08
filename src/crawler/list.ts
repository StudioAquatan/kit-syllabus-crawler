import { flatten } from 'fp-ts/lib/Array';
import { isLeft, isRight } from 'fp-ts/lib/Either';
import { JSDOM } from 'jsdom';
import {
  subjectL10nSimpleEntity,
  SubjectL10nSimpleEntity,
} from '../types/subject-io';
import { fetchWithCache } from '../utils/cached-http';

const replaceEmptyText = (str: string) => (str === '-' ? '' : str);

export const fetchSubjectList = async (page: number, sk: string) => {
  const res = await fetchWithCache(
    `https://www.syllabus.kit.ac.jp/?c=search_list&sk=${sk}&page=${page}`,
  );

  const dom = new JSDOM(res);

  const hasPrevious = !!dom.window.document.querySelector(
    `[href*="&page=${page - 1}"]`,
  );
  const hasNext = !!dom.window.document.querySelector(
    `[href*="&page=${page + 1}"]`,
  );

  const dataLists: Element[] = [].slice.apply(
    dom.window.document.querySelectorAll('.data_list_tbl > tbody') ?? [],
  );
  const categories = [].slice
    .apply<NodeList | unknown[], Element[]>(
      dom.window.document.querySelectorAll('.data_list_header') || [],
    )
    .map(elem => ({
      ja:
        elem.firstChild?.textContent?.replace(/[\r\n\t]/g, '').split('＞') ??
        [],
      en:
        elem.lastChild?.textContent?.replace(/[\r\n\t]/g, '').split('＞') ?? [],
    }));

  if (categories.length !== dataLists.length) throw new Error('invalid page');

  const items = dataLists
    .map(elem =>
      [].slice.apply<NodeList | unknown[], Element[]>(
        elem.querySelectorAll('tr:not(:first-child)'),
      ),
    )
    .map((listItems, index) => {
      const items = listItems
        .filter(tr => !!tr.querySelector('td'))
        .map(tr => {
          const base = {
            id: Number(
              tr.children
                .item(1)
                ?.querySelector('form')
                ?.getAttribute('action')
                ?.match(/pk=(\d+)/)
                ? RegExp.$1
                : -1,
            ),
            timetableId: Number(
              replaceEmptyText(tr.children.item(0)?.textContent || '') || -1,
            ),
            title: tr.children.item(1)?.querySelector('a')?.firstChild
              ?.textContent,
            class: tr.children.item(2)?.firstChild?.textContent,
            type: tr.children.item(3)?.firstChild?.textContent,
            credits: Number(tr.children.item(4)?.textContent),
            category: categories[index].ja,
          };
          return {
            ja: base,
            en: {
              ...base,
              title: tr.children.item(1)?.querySelector('a')?.lastChild
                ?.textContent,
              class: tr.children.item(2)?.lastChild?.textContent,
              category: categories[index].en,
              type: tr.children.item(3)?.lastChild?.textContent,
            },
          };
        })
        .map(item => subjectL10nSimpleEntity.decode(item));
      if (items.some(item => isLeft(item))) throw new Error('invalid page');
      return {
        items: items.map(
          item => (isRight(item) ? item.right : null), // it must be right
        ) as SubjectL10nSimpleEntity[],
        category: categories[index],
      };
    });

  return {
    hasNext,
    hasPrevious,
    items: flatten(items.map(({ items }) => items)),
  };
};

export const fetchSubjects = async function*(begin = 1, sk = '99') {
  for (let page = begin; ; page++) {
    const result = await fetchSubjectList(page, sk);
    for (const item of result.items) {
      yield item;
    }

    if (!result.hasNext) break;
  }
};
