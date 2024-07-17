import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;

enum SubjectScheduleType {
  Intensive: "intensive",
  Fixed: "fixed",
  Unknown: "unknown",
}

model SubjectScheduleFixed {
  type: SubjectScheduleType.Fixed;
  days: Array<{
    date: int8;
    hour: int8;
  }>;
}

alias SubjectSchedule = SubjectScheduleFixed | {
  type: SubjectScheduleType.Intensive | SubjectScheduleType.Unknown;
};

model SubjectCategory {
  available: boolean;
  year: string;
  semester: string;
  faculty: string;
  field: string;
  program: string;
  category: string;
  schedule: SubjectSchedule;
}

alias SubjectFlags =
  | "internship"
  | "igp"
  | "al"
  | "pbl"
  | "pt"
  | "univ3"
  | "kyoto"
  | "lottery";

model Subject {
  id: uint32;
  timetableId: string | null;
  courseId: string | null;
  credits: int8;
  code: string | null;
  class: string | null;
  type: string;
  flags: Array<SubjectFlags>;
  title: string;
  categories: Array<SubjectCategory>;
  outline: string;
  purpose: string;
  requirement: string;
  point: string;
  textbook: string;
  gradingPolicy: string;
  remark: string;
  researchPlan: string;
}
