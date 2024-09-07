import { z } from '@hono/zod-openapi';

export const instructorEntityType = z.strictObject({
  id: z.string().nullable(),
  name: z.string(),
});

export type InstructorEntity = z.TypeOf<typeof instructorEntityType>;

export const classPlanObjectType = z.strictObject({
  topic: z.string(),
  content: z.string().nullable(),
});

export type ClassPlanObject = z.TypeOf<typeof classPlanObjectType>;

export const goalObjectType = z.strictObject({
  description: z.string(),
  evaluations: z.array(
    z.strictObject({
      label: z.string(),
      description: z.string(),
    }),
  ),
});

export type GoalObject = z.TypeOf<typeof goalObjectType>;

export const categoryObjectType = z.strictObject({
  faculty: z.string().optional(),
  field: z.string().optional(),
  program: z.string().optional(),
  category: z.string().optional(),
  semester: z.string(),
  available: z.boolean(),
  year: z.number().int().array(),
  schedule: z.strictObject({
    type: z.union([
      z.literal('intensive'),
      z.literal('fixed'),
      z.literal('unknown'),
    ]),
    days: z
      .strictObject({
        date: z.number().int(),
        hour: z.number().int(),
      })
      .array()
      .optional(),
  }),
});

export type CategoryObject = z.TypeOf<typeof categoryObjectType>;

export const attachmentObjectType = z.strictObject({
  name: z.string(),
  key: z.string(),
});

export type AttachmentObject = z.TypeOf<typeof attachmentObjectType>;

export const subjectEntityType = z.strictObject({
  id: z.number().int(),
  categories: categoryObjectType.array(),
  title: z.string(),
  instructors: instructorEntityType.array(),
  flags: z.array(
    z.union([
      z.literal('internship'),
      z.literal('igp'),
      z.literal('al'),
      z.literal('pbl'),
      z.literal('pt'),
      z.literal('univ3'),
      z.literal('kyoto'),
      z.literal('lottery'),
    ]),
  ),
  outline: z.string(),
  purpose: z.string(),
  plans: classPlanObjectType.array(),
  requirement: z.string(),
  point: z.string(),
  textbook: z.string(),
  gradingPolicy: z.string(),
  remark: z.string(),
  researchPlan: z.string(),
  // Optional fields
  timetableId: z.string().optional(),
  courseId: z.string().optional(),
  credits: z.number().int().optional(),
  type: z.string().optional(),
  code: z.string().optional(),
  class: z.string().optional(),
  goal: goalObjectType.optional(),
  attachments: attachmentObjectType.array().optional(),
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
  credits: z.number().int(),
  category: z.string().array(),
  class: z.string(),
});
export type SubjectSimpleEntity = z.TypeOf<typeof subjectSimpleEntityType>;

export const subjectL10nSimpleEntity = z.strictObject({
  ja: subjectSimpleEntityType,
  en: subjectSimpleEntityType,
});
export type SubjectL10nSimpleEntity = z.TypeOf<typeof subjectL10nSimpleEntity>;
