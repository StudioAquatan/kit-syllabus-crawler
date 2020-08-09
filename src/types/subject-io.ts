import * as t from 'io-ts';
import { NonNaNNumber } from '../utils/io-types';

export const instructorEntityType = t.type({
  id: t.union([t.string, t.null]),
  name: t.string,
});

export type InstructorEntity = t.TypeOf<typeof instructorEntityType>;

export const classPlanObjectType = t.intersection([
  t.type({
    topic: t.string,
  }),
  t.partial({
    content: t.string,
  }),
]);

export type ClassPlanObject = t.TypeOf<typeof classPlanObjectType>;

export const goalObjectType = t.type({
  description: t.string,
  evaluations: t.array(
    t.type({
      label: t.string,
      description: t.string,
    }),
  ),
});

export type GoalObject = t.TypeOf<typeof goalObjectType>;

export const categoryObjectType = t.intersection([
  t.partial({
    faculty: t.string,
    field: t.string,
    program: t.string,
    category: t.string,
  }),
  t.type({
    semester: t.string,
    available: t.boolean,
    year: t.array(t.number),
    schedule: t.intersection([
      t.type({
        type: t.union([
          t.literal('intensive'),
          t.literal('fixed'),
          t.literal('unknown'),
        ]),
      }),
      t.partial({
        days: t.array(
          t.type({
            date: t.number,
            hour: t.number,
          }),
        ),
      }),
    ]),
  }),
]);

export type CategoryObject = t.TypeOf<typeof categoryObjectType>;

export const attachmentObjectType = t.strict({
  name: t.string,
  key: t.string,
});

export type AttachmentObject = t.TypeOf<typeof attachmentObjectType>;

export const subjectEntityType = t.exact(
  t.intersection([
    t.type({
      id: NonNaNNumber,
      categories: t.array(categoryObjectType),
      title: t.string,
      instructors: t.array(instructorEntityType),
      flags: t.array(
        t.union([
          t.literal('internship'),
          t.literal('igp'),
          t.literal('al'),
          t.literal('pbl'),
          t.literal('pt'),
          t.literal('univ3'),
          t.literal('kyoto'),
          t.literal('lottery'),
        ]),
      ),
      outline: t.string,
      purpose: t.string,
      plans: t.array(classPlanObjectType),
      requirement: t.string,
      point: t.string,
      textbook: t.string,
      gradingPolicy: t.string,
      remark: t.string,
      researchPlan: t.string,
    }),
    t.partial({
      timetableId: NonNaNNumber,
      courseId: NonNaNNumber,
      credits: NonNaNNumber,
      type: t.string,
      code: t.string,
      class: t.string,
      goal: goalObjectType,
      attachments: t.array(attachmentObjectType),
    }),
  ]),
);

export type SubjectEntity = t.TypeOf<typeof subjectEntityType>;

export const subjectL10nEntity = t.strict({
  ja: subjectEntityType,
  en: subjectEntityType,
});
export type SubjectL10nEntity = t.TypeOf<typeof subjectL10nEntity>;

export const subjectSimpleEntityType = t.exact(
  t.intersection([
    t.type({
      id: NonNaNNumber,
      timetableId: NonNaNNumber,
      title: t.string,
      type: t.string,
      credits: NonNaNNumber,
      category: t.array(t.string),
    }),
    t.partial({
      class: t.string,
    }),
  ]),
);
export type SubjectSimpleEntity = t.TypeOf<typeof subjectSimpleEntityType>;

export const subjectL10nSimpleEntity = t.strict({
  ja: subjectSimpleEntityType,
  en: subjectSimpleEntityType,
});
export type SubjectL10nSimpleEntity = t.TypeOf<typeof subjectL10nSimpleEntity>;
