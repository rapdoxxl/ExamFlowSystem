export type RegistrationHealthInput = {
  address?: string | null;
  class?: { name?: string | null } | null;
  classId?: string | null;
  name?: string | null;
  phone?: string | null;
  photoPath?: string | null;
  reviewReason?: string | null;
  reviewStatus?: string | null;
  status?: string | null;
  studentNumber?: string | null;
  subject?: string | null;
};

export type RegistrationHealthLevel = "ready" | "pending" | "blocked";

export type RegistrationHealthCheck = {
  detail: string;
  key: string;
  status: "pass" | "todo" | "warn";
  title: string;
};

function hasText(value?: string | null) {
  return Boolean(value && value.trim());
}

function phoneReady(value?: string | null) {
  return Boolean(value && /^1[3-9]\d{9}$/.test(value.trim()));
}

export function getRegistrationHealth(registration: RegistrationHealthInput) {
  const missingFields = [
    ["姓名", registration.name],
    ["学号", registration.studentNumber],
    ["班级", registration.classId || registration.class?.name],
    ["手机号", registration.phone],
    ["家庭地址", registration.address],
    ["报考科目", registration.subject]
  ]
    .filter(([, value]) => !hasText(value))
    .map(([label]) => label);

  const checks: RegistrationHealthCheck[] = [];
  checks.push({
    key: "fields",
    title: "报名字段",
    status: missingFields.length === 0 && phoneReady(registration.phone) ? "pass" : "todo",
    detail: missingFields.length > 0
      ? `还缺少：${missingFields.join("、")}`
      : phoneReady(registration.phone)
        ? "姓名、学号、班级、手机号、地址和科目已填写。"
        : "手机号格式需要为 11 位大陆手机号。"
  });

  checks.push({
    key: "photo",
    title: "电子照片",
    status: hasText(registration.photoPath) ? "pass" : "todo",
    detail: hasText(registration.photoPath) ? "照片已通过上传校验并按身份证号保存。" : "正式提交和导出前必须上传合格照片。"
  });

  checks.push({
    key: "submit",
    title: "正式提交",
    status: registration.status === "SUBMITTED" ? "pass" : "todo",
    detail: registration.status === "SUBMITTED" ? "已正式提交，进入审核流程。" : "当前仍是草稿，不会进入正式报名材料。"
  });

  let reviewStatus: RegistrationHealthCheck["status"] = "todo";
  let reviewDetail = "提交后等待系统管理员审核。";
  if (registration.status === "SUBMITTED" && registration.reviewStatus === "APPROVED") {
    reviewStatus = "pass";
    reviewDetail = "管理员已审核通过。";
  } else if (registration.status === "SUBMITTED" && registration.reviewStatus === "REJECTED") {
    reviewStatus = "warn";
    reviewDetail = `审核不通过：${registration.reviewReason || "未填写原因，请联系管理员。"}`;
  } else if (registration.status === "SUBMITTED") {
    reviewDetail = "已提交，等待系统管理员审核。";
  }
  checks.push({
    key: "review",
    title: "审核结果",
    status: reviewStatus,
    detail: reviewDetail
  });

  const score = checks.filter((item) => item.status === "pass").length;
  const exportReady = checks.every((item) => item.status === "pass");
  const blockingChecks = checks.filter((item) => item.status !== "pass");
  const waitingReviewOnly = blockingChecks.length === 1 && blockingChecks[0].key === "review" && registration.status === "SUBMITTED" && registration.reviewStatus === "PENDING";
  const level: RegistrationHealthLevel = exportReady ? "ready" : waitingReviewOnly ? "pending" : "blocked";
  const firstBlocking = checks.find((item) => item.status !== "pass");

  return {
    action: exportReady ? "已满足正式导出条件，可进入考生导入模板、申报表和照片包。" : firstBlocking?.detail || "请继续完善报名材料。",
    checks,
    exportReady,
    level,
    score,
    summary: exportReady ? "材料已达正式导出条件" : level === "pending" ? "材料已提交，等待审核完成" : "材料暂不能进入正式导出",
    total: checks.length
  };
}
