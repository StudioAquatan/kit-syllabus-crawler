import * as t from 'io-ts';

export const instructorEntityType = t.type({
  id: t.string,
  name: t.string,
});

export type InstructorEntity = t.TypeOf<typeof instructorEntityType>;

export const classPlanEntityType = t.intersection([
  t.type({
    topic: t.string,
  }),
  t.partial({
    content: t.string,
  }),
]);

export type ClassPlanEntity = t.TypeOf<typeof classPlanEntityType>;

export const goalEntityType = t.type({
  description: t.string,
  evaluation: t.array(
    t.type({
      label: t.string,
      description: t.string,
    }),
  ),
});

export type GoalEntity = t.TypeOf<typeof goalEntityType>;

export const subjectEntityType = t.exact(
  t.intersection([
    t.type({
      id: t.number,
      courseId: t.number,
      available: t.boolean,
      year: t.string,
      day: t.string,
      credits: t.number,
      type: t.string,
      title: t.string,
      instructors: t.array(instructorEntityType),
      flags: t.array(
        t.union([
          t.literal('internship'),
          t.literal('igp'),
          t.literal('al'),
          t.literal('pbl'),
          t.literal('pt'),
        ]),
      ),
      code: t.string,
      outline: t.string,
      purpose: t.string,
      plans: t.array(classPlanEntityType),
      requirements: t.string,
      point: t.string,
      textbooks: t.string,
      gradingPolicy: t.string,
      remarks: t.string,
    }),
    t.partial({
      faculty: t.string,
      field: t.string,
      program: t.string,
      category: t.string,
      semester: t.string,
      class: t.string,
      goal: goalEntityType,
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
      id: t.number,
      title: t.string,
      type: t.string,
      credits: t.number,
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
