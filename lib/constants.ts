export const ADMIN_PATH = "/xxgcxy";
export const STUDENT_PATH = "/reg";
export const CLASS_ADMIN_PATH = "/classadmin";

export const APP_NAME = "专项职业能力考核在线报名系统";
export const DEFAULT_PORT = 8018;
export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "admin";
export const PAYMENT_AMOUNT = 130;

export const DEFAULT_SUBJECTS = [
  {
    name: "高级：AutoCAD计算机辅助专业设计",
    capacity: 320,
    quotaGroup: "cad",
    quotaGroupName: "CAD中级+高级"
  },
  {
    name: "中级：AutoCAD计算机辅助设计",
    capacity: 320,
    quotaGroup: "cad",
    quotaGroupName: "CAD中级+高级"
  },
  {
    name: "Protel计算机辅助设计",
    capacity: 160,
    quotaGroup: "",
    quotaGroupName: ""
  }
] as const;

export const SUBJECTS = DEFAULT_SUBJECTS.map((subject) => subject.name);

export const FIXED_EXPORT_VALUES = {
  documentType: "居民身份证",
  candidateSource: "院校学生-普通大专",
  workYears: "0",
  educationLevel: "大专",
  appraisalType: "初次鉴定",
  city: "福建省/三明市"
};
