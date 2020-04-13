import { flatten } from 'fp-ts/lib/Array';

export const parseDay = (day: string) => {
  if (day === '') {
    return {
      type: 'noset' as const,
    };
  }
  if (day === '集中') {
    return {
      type: 'inten' as const,
    };
  }
  return {
    type: 'fixed' as const,
    days: flatten(
      day
        .split(/[,、，]/g)
        .map(str => str.trim())
        .map(str => {
          if (str.match(/^([月火水木金土])(\d)～(\d)$/)) {
            const d = '月火水木金土'.indexOf(RegExp.$1);
            const h1 = Number(RegExp.$2);
            const h2 = Number(RegExp.$3);
            return new Array(h2 - h1 + 1)
              .fill(0)
              .map((_v, idx) => [d, h1 + idx]);
          } else if (str.match(/^([月火水木金土])(\d)$/)) {
            const d = '月火水木金土'.indexOf(RegExp.$1);
            const h = Number(RegExp.$2);
            return [[d, h]];
          } else {
            throw new Error('unknown format of day');
          }
        }),
    ) as Array<[number, number]>,
  };
};

export const parseYear = (year: string) => {
  if (year.match(/^([１２３４])～([１２３４])年次$/)) {
    const y1 = '１２３４'.indexOf(RegExp.$1) + 1;
    const y2 = '１２３４'.indexOf(RegExp.$2) + 1;

    if (y1 < 1) throw new Error('unknown format of year');
    if (y2 < 1) throw new Error('unknown format of year');

    return new Array(y2 - y1 + 1).fill(0).map((_v, idx) => y1 + idx);
  } else if (year.match(/^([１２３４])年次$/)) {
    const y = '１２３４'.indexOf(RegExp.$1) + 1;

    if (y < 1) throw new Error('unknown format of year');

    return [y];
  } else {
    throw new Error('unknown format of year');
  }
};
