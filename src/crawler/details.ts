import { isRight } from 'fp-ts/lib/Either';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import {
  ClassPlanEntity,
  GoalEntity,
  SubjectEntity,
  SubjectL10nEntity,
  subjectL10nEntity,
} from '../entities/subject';

const flagNameTable: Record<string, SubjectEntity['flags'][0]> = {
  Internship: 'internship',
  IGP: 'igp',
  'Active Learning': 'al',
  'Project Based Learning': 'pbl',
  'Practical Teacher': 'pt',
};

const replaceEmptyText = (str: string) => (str === '-' ? '' : str);
const getText = (elem: Element) => {
  return replaceEmptyText(
    ([].slice.apply(elem.childNodes) as Node[])
      .map(node => {
        if (node.nodeType === 3 /* TEXT_NODE */) {
          return node.textContent?.replace(/[\r\n]/g, '');
        }
        if (
          node.nodeType === 1 /* ELEMENT_NODE */ &&
          (node as Element).tagName === 'BR'
        ) {
          return '\n';
        }
        return '';
      })
      .join(''),
  );
};
const getTwoLangTable = (elem: Element | null) => {
  if (!elem) return ['', ''];

  const items = ([].slice.apply(elem.querySelectorAll('td')) as Element[])
    .map(td => getText(td))
    .map(text => (text === '-' ? '' : text));
  if (items.length !== 2) throw new Error('not two lang table');

  return items;
};

const getBaseInfo = (elem: Element | null) => {
  const baseInfoElems = [].slice.apply(
    elem?.querySelectorAll('th') || [],
  ) as Element[];
  const baseInfoItems = baseInfoElems
    .filter(
      item =>
        item.textContent?.length &&
        !item.textContent?.match(/(担当教員名|その他)/) &&
        item.nextElementSibling?.tagName === 'TD' &&
        item.nextElementSibling.textContent?.length,
    )
    .reduce<Record<string, string[]>>((obj, item) => {
      return {
        ...obj,
        [item.textContent!.trim()]: item
          .nextElementSibling!.textContent!.split('/')
          .map(str => replaceEmptyText(str.trim()))
          .filter(str => str.length > 0),
      };
    }, {});

  const instructorsElem = baseInfoElems.find(item =>
    item.textContent?.includes('担当教員名'),
  )?.nextElementSibling; // 担当教員のtd
  const instructorsJA =
    instructorsElem?.childElementCount === 0
      ? [
          {
            id: 'not-set',
            name: instructorsElem.textContent || 'unknown',
          },
        ] // 「某/undecided」のとき
      : ([].slice.apply(
          instructorsElem?.querySelectorAll('a') || [],
        ) as HTMLAnchorElement[]).map(item => ({
          id: item.href.match(/ja\.([a-f0-9]+)\.html/) ? RegExp.$1 : 'unknown',
          name: item.textContent || 'unknown',
        })); // その他はすべてリンク(?)
  const instructorNamesEN =
    instructorsElem?.parentElement?.nextElementSibling
      ?.querySelector('td')
      ?.textContent?.split(/、/g) || []; // 担当教員のtdの親のtrの次のtr

  if (instructorsJA.length !== instructorNamesEN.length)
    throw new Error('error while parsing instructors');

  const instructorsEN = instructorNamesEN.map((name, idx) => ({
    ...instructorsJA[idx],
    name,
  }));

  const flagsElem = baseInfoElems.find(item =>
    item.textContent?.includes('その他'),
  )?.parentElement; // 「その他」thの親tr
  if (!flagsElem) throw new Error('error while parsing flags (no elem)');

  const flagsMap = ([].slice.apply(
    flagsElem.querySelectorAll('th.txt_center'),
  ) as Element[]).map(item => item.lastChild?.textContent);

  if (flagsMap.some(flag => !flag))
    throw new Error('error while parsing flags (flagMap item = null)');

  const flags = ([].slice.apply(
    flagsElem.nextElementSibling?.children,
  ) as Element[])
    .map((item, idx) =>
      item.textContent?.trim() !== '-' ? flagNameTable[flagsMap[idx]!] : null,
    )
    .filter((flag): flag is SubjectEntity['flags'][0] => !!flag); // 親trの次のtr = (-/〇が入っているところ)

  return {
    baseInfoItems,
    instructorsEN,
    instructorsJA,
    flags,
  };
};

const getPlans = (elem: Element | null) => {
  if (!elem) return { ja: [], en: [] };

  const trList = [].slice
    .apply(elem.querySelector('tbody')?.querySelectorAll('tr'))
    .slice(2) as Element[];

  if (trList.length % 2 !== 0)
    throw new Error('error while parsing plan (count % 2)');

  const ja: ClassPlanEntity[] = [];
  const en: ClassPlanEntity[] = [];
  for (let i = 0; i < trList.length; i += 2) {
    const elemsJA = [].slice.apply(
      trList[i].querySelectorAll('td'),
    ) as Element[];
    ja.push({
      topic: replaceEmptyText(elemsJA[0].textContent || ''),
      content: replaceEmptyText(elemsJA[1].textContent || ''),
    });
    const elemsEN = [].slice.apply(
      trList[i + 1].querySelectorAll('td'),
    ) as Element[];
    en.push({
      topic:
        replaceEmptyText(elemsEN[0].textContent || '') ||
        replaceEmptyText(elemsJA[0].textContent || ''),
      content:
        replaceEmptyText(elemsEN[1].textContent || '') ||
        replaceEmptyText(elemsJA[1].textContent || ''),
    });
  }

  return {
    ja,
    en,
  };
};

const getGoals = (elem: Element | null) => {
  if (!elem) return { ja: null, en: null };

  const tbody = elem.querySelector('tbody');

  if (!tbody) throw new Error('error while parsing goal (no elem)');
  const jaGoalElem = tbody.children.item(2)?.firstElementChild;
  const enGoalElem = tbody.children.item(3)?.firstElementChild;

  if (!jaGoalElem || !enGoalElem)
    throw new Error('error while parsing goal (no elem)');

  const jaGoal = getText(jaGoalElem);
  const enGoal = getText(enGoalElem) || jaGoal;

  const trList = [].slice.apply(tbody.children).slice(5) as Element[];

  if (trList.length % 2 !== 0)
    throw new Error('error while parsing goals (evaluation count % 2)');

  const ja: GoalEntity['evaluation'] = [];
  const en: GoalEntity['evaluation'] = [];
  for (let i = 0; i < trList.length; i += 2) {
    const labelJA = trList[i].querySelector('th:nth-child(2)')?.firstChild
      ?.textContent;
    const resultElemJA = trList[i].querySelector('td');
    ja.push({
      label: replaceEmptyText(labelJA || ''),
      description: replaceEmptyText(resultElemJA?.textContent || ''),
    });
    const labelEN = trList[i].querySelector('th:nth-child(2)')?.lastChild
      ?.textContent;
    const resultElemEN = trList[i + 1].querySelector('td');
    en.push({
      label: replaceEmptyText(labelEN || ''),
      description: replaceEmptyText(resultElemEN?.textContent || ''),
    });
  }

  return {
    ja: {
      description: jaGoal,
      evaluation: ja,
    } as GoalEntity,
    en: {
      description: enGoal,
      evaluation: en,
    } as GoalEntity,
  };
};

export const fetchSubject = async (subjectCode: number) => {
  const res = await fetch(
    `https://www.syllabus.kit.ac.jp/?c=detail&schedule_code=${subjectCode}`,
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

  const classificationItems = ([].slice.apply(
    dom.window.document
      .querySelector('#classification_tbl')
      ?.querySelectorAll('th') || [],
  ) as Element[])
    .filter(
      item =>
        item.textContent?.length &&
        item.nextElementSibling?.tagName === 'TD' &&
        item.nextElementSibling.textContent?.length,
    )
    .reduce<Record<string, string[]>>((obj, item) => {
      return {
        ...obj,
        [item.textContent!.trim()]: item
          .nextElementSibling!.textContent!.split('/')
          .map(str => str.trim())
          .filter(str => str !== '-'),
      };
    }, {});

  const { baseInfoItems, flags, instructorsEN, instructorsJA } = getBaseInfo(
    dom.window.document.querySelector('#base_info_tbl'),
  );

  const outline = getTwoLangTable(
    dom.window.document.querySelector('#outline_tbl'),
  );
  const purpose = getTwoLangTable(
    dom.window.document.querySelector('#objective_tbl'),
  );
  const require = getTwoLangTable(
    dom.window.document.querySelector('#take_reserve_tbl'),
  );
  const point = getTwoLangTable(
    dom.window.document.querySelector('#heed_points_tbl'),
  );
  const textbook = getTwoLangTable(
    dom.window.document.querySelector('#text_col_tbl'),
  );
  const policy = getTwoLangTable(
    dom.window.document.querySelector('#report_card_tbl'),
  );
  const remark = getTwoLangTable(
    dom.window.document.querySelector('#recital_tbl'),
  );
  const plans = getPlans(dom.window.document.querySelector('#plan_tbl'));
  const goals = getGoals(dom.window.document.querySelector('#evaluation_tbl'));

  const jaEntity: SubjectEntity = {
    // common
    id: subjectCode,
    courseId: Number(baseInfoItems['科目番号 / Course Number'][0]),
    credits: Number(baseInfoItems['単位数 / Credits'][0]),
    available: classificationItems['今年度開講 / Availability'][0].includes(
      '有',
    ),
    code: baseInfoItems['科目ナンバリング / Numbering Code'][0],
    flags,
    // dep on lang
    year: classificationItems['年次 / Year'][0],
    semester: classificationItems['学期 / Semester'][0],
    faculty: classificationItems['学部等 / Faculty'][0],
    field: classificationItems['学域等 / Field'][0],
    program: classificationItems['課程等 / Program'][0],
    category: classificationItems['分類 / Category'][0],
    day: classificationItems['曜日時限 / Day & Period'][0],
    type: baseInfoItems['授業形態 / Course Type'][0],
    class: baseInfoItems['クラス / Class'][0],
    title: baseInfoItems['授業科目名 / Course Title'][0],
    instructors: instructorsJA,
    outline: outline[0],
    purpose: purpose[0],
    requirements: require[0],
    point: point[0],
    textbooks: textbook[0],
    gradingPolicy: policy[0],
    remarks: remark[0],
    plans: plans.ja,
    goal: goals.ja || undefined,
  };

  const entity: SubjectL10nEntity = {
    ja: jaEntity,
    en: {
      ...jaEntity,
      year: classificationItems['年次 / Year'][1],
      semester: classificationItems['学期 / Semester'][1],
      faculty: classificationItems['学部等 / Faculty'][1],
      field: classificationItems['学域等 / Field'][1],
      program: classificationItems['課程等 / Program'][1],
      category: classificationItems['分類 / Category'][1],
      day: classificationItems['曜日時限 / Day & Period'][1],
      type: baseInfoItems['授業形態 / Course Type'][1],
      class: baseInfoItems['クラス / Class'][1],
      title: baseInfoItems['授業科目名 / Course Title'][1],
      instructors: instructorsEN,
      outline: outline[1].length === 0 ? outline[0] : outline[1],
      purpose: purpose[1].length === 0 ? purpose[0] : purpose[1],
      requirements: require[1].length === 0 ? require[0] : require[1],
      point: point[1].length === 0 ? point[0] : point[1],
      textbooks: textbook[1].length === 0 ? textbook[0] : textbook[1],
      gradingPolicy: policy[1].length === 0 ? policy[0] : policy[1],
      remarks: remark[1].length === 0 ? remark[0] : remark[1],
      plans: plans.en,
      goal: goals.en || undefined,
    },
  };

  const decoded = subjectL10nEntity.decode(entity);

  if (isRight(decoded)) return decoded.right;
  else throw decoded.left;
};
