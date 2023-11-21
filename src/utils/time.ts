import { flatten } from 'fp-ts/lib/Array';

export const parseDay = (day: string) => {
  if (day === '') {
    return {
      type: 'unknown' as const,
    };
  }
  if (day === '集中') {
    return {
      type: 'intensive' as const,
    };
  }
  return {
    type: 'fixed' as const,
    days: flatten(
      day
        .split(/[,、，]/g)
        .map((str) => str.trim())
        .map((str) => {
          if (str.match(/^([月火水木金土日])(\d)～(\d)$/)) {
            const date = '月火水木金土日'.indexOf(RegExp.$1);
            const h1 = Number(RegExp.$2);
            const h2 = Number(RegExp.$3);
            return new Array(h2 - h1 + 1).fill(0).map((_v, idx) => ({
              date,
              hour: h1 + idx,
            }));
          } else if (str.match(/^([月火水木金土日])(\d)$/)) {
            const date = '月火水木金土日'.indexOf(RegExp.$1);
            const hour = Number(RegExp.$2);
            return [
              {
                date,
                hour,
              },
            ];
          } else {
            throw new Error('unknown format of day');
          }
        }),
    ) as Array<{
      date: number;
      hour: number;
    }>,
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
