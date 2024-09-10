import { z } from '@hono/zod-openapi';

export const instructorEntityType = z
  .strictObject({
    id: z.string().nullable().openapi({
      description: '研究者DBでの教員ID(正規教員のみ)',
    }),
    name: z.string().openapi({
      description: '教員名',
    }),
  })
  .openapi('Instructor', {
    description: '教員情報',
  });

export type InstructorEntity = z.TypeOf<typeof instructorEntityType>;

export const classPlanObjectType = z
  .strictObject({
    // 項目
    topic: z.string(),
    // 内容
    content: z.string().nullable(),
    // オンライン授業
    isOnline: z.boolean().optional().openapi({
      description: 'オンライン授業',
    }),
  })
  .openapi('ClassPlan', {
    description: '授業計画項目',
  });

export type ClassPlanObject = z.TypeOf<typeof classPlanObjectType>;

export const goalObjectType = z
  .strictObject({
    description: z.string(),
    evaluations: z.array(
      z.strictObject({
        label: z.string(),
        description: z.string(),
      }),
    ),
  })
  .openapi('Goal', {
    description: '目標の達成度の評価基準',
  });

export type GoalObject = z.TypeOf<typeof goalObjectType>;

export const categoryObjectType = z
  .strictObject({
    faculty: z.string().optional().openapi({
      description: '学部等',
    }),
    field: z.string().optional().openapi({
      description: '学域等',
    }),
    // 課程等
    program: z.string().optional().openapi({
      description: '課程等',
    }),
    // 分類
    category: z.string().optional().openapi({
      description: '分類',
    }),
    // 学期
    semester: z.string().openapi({
      description: '学期',
    }),
    // 今年度開講
    available: z.boolean().openapi({
      description: '今年度開講',
    }),
    // 年次
    year: z.number().int().array().openapi({
      description: '年次',
    }),
    // 曜日時限
    schedule: z
      .strictObject({
        type: z
          .enum(['intensive', 'fixed', 'unknown'])
          .default('fixed')
          .openapi({
            description: `授業スケジュールの種類。
- intensive: 集中
- fixed: 曜日時限
- unknown: 不明`,
          }),
        days: z
          .strictObject({
            date: z.number().int(),
            hour: z.number().int(),
          })
          .array()
          .optional(),
      })
      .openapi({
        description: '曜日時限',
      }),
  })
  .openapi('Category', {
    description: '科目分類',
  });

export type CategoryObject = z.TypeOf<typeof categoryObjectType>;

export const attachmentObjectType = z.strictObject({
  name: z.string(),
  key: z.string(),
});

export type AttachmentObject = z.TypeOf<typeof attachmentObjectType>;

export const subjectEntityType = z
  .strictObject({
    id: z.number().int(),
    // 科目分類
    categories: categoryObjectType.array().openapi('Category', {
      description: '科目分類',
    }),
    // 授業科目名
    title: z.string().openapi({
      description: '授業科目名',
    }),
    // 担当教員名
    instructors: instructorEntityType.array().openapi('Instructor', {
      description: '担当教員名',
    }),
    flags: z
      .enum([
        'internship',
        'igp',
        'al',
        'pbl',
        'pt',
        'univ3',
        'kyoto',
        'lottery',
      ])
      .array(),
    // 授業の目的・概要
    outline: z.string().openapi({
      description: '授業の目的・概要',
    }),
    // 学習の到達目標
    purpose: z.string().openapi({
      description: '学習の到達目標',
    }),
    // 授業計画項目
    plans: classPlanObjectType.array().openapi('ClassPlan', {
      description: '授業計画項目',
    }),
    // 履修条件
    requirement: z.string().openapi({
      description: '履修条件',
    }),
    // 授業時間外学習（予習・復習等）
    point: z.string().openapi({
      description: '授業時間外学習（予習・復習等）',
    }),
    // 教科書／参考書
    textbook: z.string().openapi({
      description: '教科書／参考書',
    }),
    // 成績評価の方法及び基準
    gradingPolicy: z.string().openapi({
      description: '成績評価の方法及び基準',
    }),
    // 留意事項等
    remark: z.string().openapi({
      description: '留意事項等',
    }),
    // 研究計画
    researchPlan: z.string().openapi({
      description: '研究計画',
    }),
    // 時間割番号
    timetableId: z.string().optional().openapi({
      description: '時間割番号',
    }),
    // 科目番号
    courseId: z.string().optional().openapi({
      description: '科目番号',
    }),
    // 単位数
    credits: z.number().optional().openapi({
      description: '単位数',
    }),
    // 授業形態
    type: z.string().optional().openapi({
      description: '授業形態',
    }),
    // 科目ナンバリング
    code: z.string().optional().openapi({
      description: '科目ナンバリング',
    }),
    // クラス
    class: z.string().optional().openapi({
      description: 'クラス',
    }),
    // 目標の達成度の評価基準
    goal: goalObjectType.optional().openapi('Goal', {
      description: '目標の達成度の評価基準',
    }),
    attachments: attachmentObjectType.array().optional().openapi('Attachment', {
      description: '添付ファイル',
    }),
  })
  .openapi('Subject', {
    description: '教科情報',
  });

export type SubjectEntity = z.TypeOf<typeof subjectEntityType>;

export const subjectL10nEntity = z.strictObject({
  ja: subjectEntityType,
  en: subjectEntityType,
});
export type SubjectL10nEntity = z.TypeOf<typeof subjectL10nEntity>;

export const subjectSimpleEntityType = z.strictObject({
  id: z.number().int(),
  timetableId: z.string(),
  title: z.string(),
  type: z.string(),
  credits: z.number(),
  category: z.string().array(),
  class: z.string(),
});
export type SubjectSimpleEntity = z.TypeOf<typeof subjectSimpleEntityType>;

export const subjectL10nSimpleEntity = z.strictObject({
  ja: subjectSimpleEntityType,
  en: subjectSimpleEntityType,
});
export type SubjectL10nSimpleEntity = z.TypeOf<typeof subjectL10nSimpleEntity>;
