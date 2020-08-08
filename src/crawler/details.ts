import { isRight } from 'fp-ts/lib/Either';
import { JSDOM } from 'jsdom';
import {
  CategoryObject,
  ClassPlanObject,
  GoalObject,
  SubjectEntity,
  SubjectL10nEntity,
  subjectL10nEntity,
} from '../types/subject-io';
import { fetchWithCache } from '../utils/cached-http';
import { parseDay, parseYear } from '../utils/time';

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
            id: null,
            name: instructorsElem.textContent || 'unknown',
          },
        ] // 「某/undecided」のとき
      : ([].slice.apply(
          instructorsElem?.querySelectorAll('a') || [],
        ) as HTMLAnchorElement[])
          .map(item => ({
            id: item.href.match(/ja\.([a-f0-9]+)\.html/) ? RegExp.$1 : null,
            name: item.textContent || 'unknown',
          }))
          .filter(item => item.name !== '他'); // その他はすべてリンク(?)
  const instructorNamesEN =
    instructorsElem?.parentElement?.nextElementSibling
      ?.querySelector('td')
      ?.textContent?.split(/、/g) || []; // 担当教員のtdの親のtrの次のtr

  const instructorsEN = instructorNamesEN.map((name, idx) =>
    instructorsJA[idx]
      ? {
          ...instructorsJA[idx],
          name,
        }
      : {
          id: null,
          name,
        },
  );

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

  const ja: ClassPlanObject[] = [];
  const en: ClassPlanObject[] = [];
  for (let i = 0; i < trList.length; i += 2) {
    const elemsJA = [].slice.apply(
      trList[i].querySelectorAll('td'),
    ) as Element[];
    const elemsEN = [].slice.apply(
      trList[i + 1].querySelectorAll('td'),
    ) as Element[];
    ja.push({
      topic:
        replaceEmptyText(elemsJA[0].textContent || '') ||
        replaceEmptyText(elemsEN[0].textContent || ''),
      content:
        replaceEmptyText(elemsJA[1].textContent || '') ||
        replaceEmptyText(elemsEN[1].textContent || ''),
    });
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
    ja: ja.filter(({ topic, content }) => topic && content),
    en: en.filter(({ topic, content }) => topic && content),
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

  const ja: GoalObject['evaluation'] = [];
  const en: GoalObject['evaluation'] = [];
  for (let i = 0; i < trList.length; i += 2) {
    const labelJA = trList[i].querySelector('th:nth-child(2)')?.firstChild
      ?.textContent;
    const resultElemJA = trList[i].querySelector('td');
    ja.push({
      label: replaceEmptyText(labelJA || ''),
      description: replaceEmptyText(resultElemJA?.textContent || '') || null,
    });
    const labelEN = trList[i].querySelector('th:nth-child(2)')?.lastChild
      ?.textContent;
    const resultElemEN = trList[i + 1].querySelector('td');
    en.push({
      label: replaceEmptyText(labelEN || ''),
      description: replaceEmptyText(resultElemEN?.textContent || '') || null,
    });
  }

  return {
    ja: {
      description: jaGoal,
      evaluation: ja,
    } as GoalObject,
    en: {
      description: enGoal,
      evaluation: en,
    } as GoalObject,
  };
};

export const getClassInfo = (elem: Element | null) => {
  if (!elem) throw new Error('no class info');

  const flags: SubjectEntity['flags'] = [];
  if (
    !!elem.querySelector(
      'img[src="https://www.syllabus.kit.ac.jp/img/notes_icon1.png"]',
    )
  ) {
    flags.push('univ3');
  }
  if (
    !!elem.querySelector(
      'img[src="https://www.syllabus.kit.ac.jp/img/notes_icon2.png"]',
    )
  ) {
    flags.push('kyoto');
  }
  if (
    !!elem.querySelector(
      'img[src="https://www.syllabus.kit.ac.jp/img/notes_icon3.png"]',
    )
  ) {
    flags.push('lottery');
  }

  const classificationItems = ([].slice.apply(
    elem.querySelectorAll('th') || [],
  ) as Element[])
    .filter(
      item =>
        item.textContent?.length &&
        item.nextElementSibling?.tagName === 'TD' &&
        item.nextElementSibling.textContent?.length,
    )
    .reduce<Record<string, Array<{ ja: string; en: string }>>>((obj, item) => {
      const [ja, en] = item
        .nextElementSibling!.textContent!.split('/')
        .map(str => replaceEmptyText(str.trim()));

      return {
        ...obj,
        [item.textContent!.trim()]: [
          ...(obj[item.textContent!.trim()] || []),
          { ja, en: en || ja },
        ],
      };
    }, {});

  const lens = Object.values(classificationItems)
    .map(arr => arr.length)
    .reduce<number[]>(
      (arr, len) => (arr.includes(len) ? arr : [...arr, len]),
      [],
    );
  if (lens.length !== 1)
    throw new Error('error while parsing class info (no class)');

  const categories: CategoryObject[] = new Array(lens[0])
    .fill(0)
    .map((_v, idx) => ({
      available: classificationItems['今年度開講 / Availability'][
        idx
      ].ja.includes('有'),
      year: classificationItems['年次 / Year'][idx].ja
        ? parseYear(classificationItems['年次 / Year'][idx].ja)
        : [],
      semester: classificationItems['学期 / Semester'][idx].ja,
      faculty: classificationItems['学部等 / Faculty'][idx].ja,
      field: classificationItems['学域等 / Field'][idx].ja,
      program: classificationItems['課程等 / Program'][idx].ja,
      category: classificationItems['分類 / Category'][idx].ja,
      day: parseDay(classificationItems['曜日時限 / Day & Period'][idx].ja),
    }));

  const categoriesEN = categories.map((item, idx) => ({
    ...item,
    ...categories[idx],
    semester: classificationItems['学期 / Semester'][idx].en,
    faculty: classificationItems['学部等 / Faculty'][idx].en,
    field: classificationItems['学域等 / Field'][idx].en,
    program: classificationItems['課程等 / Program'][idx].en,
    category: classificationItems['分類 / Category'][idx].en,
  }));

  return {
    flags,
    categoriesEN,
    categories,
  };
};

const getAttachments = (elem: Element | null) => {
  if (!elem) return;

  return ([].slice.apply(elem.querySelectorAll('tr')) as Element[])
    .filter(item => !!item.querySelector('span'))
    .map(item => ({
      filename: item.querySelector('span')?.textContent || '',
      fileKey: item.querySelector('button')?.value || '',
    }))
    .filter(item => item.filename && item.fileKey);
};

export const fetchSubject = async (primaryKey: number) => {
  const res = await fetchWithCache(
    `https://www.syllabus.kit.ac.jp/?c=detail&pk=${primaryKey}`,
  );

  const dom = new JSDOM(res);

  const { baseInfoItems, flags, instructorsEN, instructorsJA } = getBaseInfo(
    dom.window.document.querySelector('#base_info_tbl'),
  );

  const { flags: additionalFlags, categories, categoriesEN } = getClassInfo(
    dom.window.document.querySelector('#classification_tbl'),
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
  const researchPlan = getTwoLangTable(
    dom.window.document.querySelector('#investigation_aegis_tbl'),
  );
  const plans = getPlans(dom.window.document.querySelector('#plan_tbl'));
  const goals = getGoals(dom.window.document.querySelector('#evaluation_tbl'));
  const attachments = getAttachments(
    dom.window.document.querySelector('#tempfile_tbl'),
  );

  const jaEntity: SubjectEntity = {
    // common
    id: primaryKey,
    timetableId: baseInfoItems['時間割番号 / Timetable Number']
      ? Number(baseInfoItems['時間割番号 / Timetable Number'][0] || 0) ||
        undefined
      : undefined,
    courseId: baseInfoItems['科目番号 / Course Number']
      ? Number(baseInfoItems['科目番号 / Course Number'][0] || 0) || undefined
      : undefined,
    credits: baseInfoItems['単位数 / Credits']
      ? Number(baseInfoItems['単位数 / Credits'][0] || 0) || undefined
      : undefined,
    code: baseInfoItems['科目ナンバリング / Numbering Code'][0] || undefined,
    flags: [...flags, ...additionalFlags],
    // dep on lang
    categories,
    type: baseInfoItems['授業形態 / Course Type']
      ? baseInfoItems['授業形態 / Course Type'][0] || undefined
      : undefined,
    class: baseInfoItems['クラス / Class']
      ? baseInfoItems['クラス / Class'][0] || undefined
      : undefined,
    title:
      baseInfoItems['授業科目名 / Course Title'][0] ||
      baseInfoItems['授業科目名 / Course Title'][1],
    instructors: instructorsJA,
    outline: outline[0].length === 0 ? outline[1] : outline[0],
    purpose: purpose[0].length === 0 ? purpose[1] : purpose[0],
    requirements: require[0].length === 0 ? require[1] : require[0],
    point: point[0].length === 0 ? point[1] : point[0],
    textbooks: textbook[0].length === 0 ? textbook[1] : textbook[0],
    gradingPolicy: policy[0].length === 0 ? policy[1] : policy[0],
    remarks: remark[0].length === 0 ? remark[1] : remark[0],
    researchPlan:
      researchPlan[0].length === 0 ? researchPlan[1] : researchPlan[0],
    plans: plans.ja,
    goal: goals.ja || undefined,
    attachments,
  };

  const entity: SubjectL10nEntity = {
    ja: jaEntity,
    en: {
      ...jaEntity,
      categories: categoriesEN,
      type: baseInfoItems['授業形態 / Course Type']
        ? baseInfoItems['授業形態 / Course Type'][1] || undefined
        : undefined,
      class: baseInfoItems['クラス / Class']
        ? baseInfoItems['クラス / Class'][1] || undefined
        : undefined,
      title:
        baseInfoItems['授業科目名 / Course Title'][1] ||
        baseInfoItems['授業科目名 / Course Title'][0],
      instructors: instructorsEN,
      outline: outline[1].length === 0 ? outline[0] : outline[1],
      purpose: purpose[1].length === 0 ? purpose[0] : purpose[1],
      requirements: require[1].length === 0 ? require[0] : require[1],
      point: point[1].length === 0 ? point[0] : point[1],
      textbooks: textbook[1].length === 0 ? textbook[0] : textbook[1],
      gradingPolicy: policy[1].length === 0 ? policy[0] : policy[1],
      remarks: remark[1].length === 0 ? remark[0] : remark[1],
      researchPlan:
        researchPlan[1].length === 0 ? researchPlan[0] : researchPlan[1],
      plans: plans.en,
      goal: goals.en || undefined,
    },
  };

  const decoded = subjectL10nEntity.decode(entity);

  if (isRight(decoded)) return decoded.right;
  else throw decoded.left;
};
