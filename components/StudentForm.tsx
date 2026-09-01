"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusDialog } from "@/components/StatusDialog";
import { isValidChineseIdNumber } from "@/lib/validation";

type ClassItem = { id: string; name: string; department?: string | null; grade?: string | null };
type SubjectItem = { id: string; name: string };
type Registration = {
  idNumber?: string;
  name?: string | null;
  studentNumber?: string | null;
  classId?: string | null;
  phone?: string | null;
  address?: string | null;
  subject?: string | null;
  status?: string;
  photoPath?: string | null;
};

type DialogState = {
  actionLabel?: string;
  message: string;
  queryPassword?: string;
  redirectTo?: string;
  title: string;
  warning?: string;
};

type FieldKey = "name" | "idNumber" | "studentNumber" | "department" | "grade" | "classId" | "phone" | "subject" | "address" | "photo";
type FieldErrors = Partial<Record<FieldKey, string>>;

const FIELD_LABELS: Record<FieldKey, string> = {
  name: "姓名",
  idNumber: "身份证号",
  studentNumber: "学号",
  department: "院系",
  grade: "所在年级",
  classId: "班级",
  phone: "手机号码",
  subject: "报考科目",
  address: "家庭地址",
  photo: "电子照片"
};

const FIELD_ORDER: FieldKey[] = ["name", "idNumber", "studentNumber", "department", "grade", "classId", "phone", "subject", "address", "photo"];

function formText(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) || "").trim();
}

function normalizeApiField(field: unknown): FieldKey | undefined {
  if (typeof field !== "string") return undefined;
  if (field === "queryPassword") return "idNumber";
  return FIELD_ORDER.includes(field as FieldKey) ? (field as FieldKey) : undefined;
}

function inferFieldFromMessage(message: string): FieldKey | undefined {
  if (message.includes("姓名")) return "name";
  if (message.includes("身份证") || message.includes("查询密码")) return "idNumber";
  if (message.includes("学号")) return "studentNumber";
  if (message.includes("院系")) return "department";
  if (message.includes("年级")) return "grade";
  if (message.includes("班级")) return "classId";
  if (message.includes("手机号") || message.includes("手机号码")) return "phone";
  if (message.includes("科目") || message.includes("容量") || message.includes("名额")) return "subject";
  if (message.includes("地址")) return "address";
  if (message.includes("照片") || message.includes("JPG") || message.includes("像素")) return "photo";
  return undefined;
}

export function StudentForm({ classes, initial, registrationOpen, subjects }: { classes: ClassItem[]; initial?: Registration; registrationOpen: boolean; subjects: SubjectItem[] }) {
  const initialClass = classes.find((item) => item.id === initial?.classId);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [queryPassword, setQueryPassword] = useState("");
  const [idNumber, setIdNumber] = useState(initial?.idNumber || "");
  const [department, setDepartment] = useState(initialClass?.department || "");
  const [grade, setGrade] = useState(initialClass?.grade || "");
  const [classId, setClassId] = useState(initial?.classId || "");
  const [derived, setDerived] = useState({ gender: "", birthDate: "" });
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const departments = useMemo(() => Array.from(new Set(classes.map((item) => item.department?.trim()).filter(Boolean) as string[])).sort(), [classes]);
  const grades = useMemo(() => Array.from(new Set(classes.filter((item) => item.department?.trim() === department).map((item) => item.grade?.trim() || "未分年级"))).sort((a, b) => b.localeCompare(a, "zh-CN")), [classes, department]);
  const filteredClasses = useMemo(() => classes.filter((item) => item.department?.trim() === department && (item.grade?.trim() || "未分年级") === grade), [classes, department, grade]);

  const classConfigMessage = useMemo(() => {
    if (departments.length === 0) return "管理员尚未配置院系和班级，请联系管理员先导入或创建完整班级信息。";
    if (department && grades.length === 0) return "当前院系尚未配置年级，请联系管理员完善班级信息。";
    if (department && grade && filteredClasses.length === 0) return "当前院系和年级下尚未配置班级，请联系管理员完善班级信息。";
    return "";
  }, [department, departments.length, filteredClasses.length, grade, grades.length]);

  useEffect(() => {
    const value = idNumber.toUpperCase();
    if (/^\d{17}[\dX]$/.test(value)) {
      const year = value.slice(6, 10);
      const month = value.slice(10, 12);
      const day = value.slice(12, 14);
      const gender = Number(value[16]) % 2 === 1 ? "男" : "女";
      setDerived({ gender, birthDate: `${year}-${month}-${day}` });
    } else {
      setDerived({ gender: "", birthDate: "" });
    }
  }, [idNumber]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(""), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  function getClassSelectionError(): { field: FieldKey; message: string } | null {
    if (departments.length === 0) return { field: "department", message: "管理员尚未配置院系和班级，请联系管理员先导入或创建完整班级信息。" };
    if (!department) return { field: "department", message: "请先选择院系。" };
    if (grades.length === 0) return { field: "grade", message: "当前院系尚未配置年级，请联系管理员完善班级信息。" };
    if (!grade) return { field: "grade", message: "请选择所在年级。" };
    if (filteredClasses.length === 0) return { field: "classId", message: "当前院系和年级下尚未配置班级，请联系管理员完善班级信息。" };
    if (!classId) return { field: "classId", message: "请选择班级。" };
    return null;
  }

  function focusField(field: FieldKey) {
    window.requestAnimationFrame(() => {
      const fieldBox = document.querySelector<HTMLElement>(`[data-registration-field="${field}"]`);
      fieldBox?.scrollIntoView({ behavior: "smooth", block: "center" });
      const control = fieldBox?.querySelector<HTMLElement>("input:not([type='hidden']), select, textarea");
      control?.focus({ preventScroll: true });
    });
  }

  function clearFieldErrors(fields: FieldKey[]) {
    setFieldErrors((current) => {
      const next = { ...current };
      fields.forEach((field) => {
        delete next[field];
      });
      return next;
    });
    setError("");
  }

  function showFieldErrors(errors: FieldErrors, summary?: string) {
    const orderedFields = FIELD_ORDER.filter((field) => errors[field]);
    setFieldErrors(errors);
    if (orderedFields.length === 0) {
      setError(summary || "提交失败");
      return;
    }
    const firstField = orderedFields[0];
    const labels = orderedFields.map((field) => FIELD_LABELS[field]).join("、");
    setError(summary || (orderedFields.length === 1 ? `${FIELD_LABELS[firstField]}：${errors[firstField]}` : `请先修正标红字段：${labels}。`));
    focusField(firstField);
  }

  function showApiError(json: { field?: unknown; issues?: { field?: unknown; message?: string }[]; message?: string }) {
    const message = json.message || "提交失败";
    const apiErrors: FieldErrors = {};
    if (Array.isArray(json.issues)) {
      json.issues.forEach((issue) => {
        const field = normalizeApiField(issue.field);
        if (field && issue.message) apiErrors[field] = issue.message;
      });
    }
    const directField = normalizeApiField(json.field) || inferFieldFromMessage(message);
    if (Object.keys(apiErrors).length > 0) {
      showFieldErrors(apiErrors, `请按标红字段修改后再提交：${message}`);
      return;
    }
    if (directField) {
      showFieldErrors({ [directField]: message });
      return;
    }
    setFieldErrors({});
    setError(message);
  }

  function validateBeforeSubmit(form: HTMLFormElement, intent: "draft" | "submit") {
    const errors: FieldErrors = {};
    const mustComplete = intent === "submit";
    const name = formText(form, "name");
    const idNumberValue = idNumber.trim().toUpperCase();
    const studentNumber = formText(form, "studentNumber");
    const phone = formText(form, "phone");
    const subject = formText(form, "subject");
    const address = formText(form, "address");
    const photoInput = form.elements.namedItem("photo") as HTMLInputElement | null;
    const photo = photoInput?.files?.[0];

    if (!idNumberValue) errors.idNumber = "请输入身份证号。";
    else if (!isValidChineseIdNumber(idNumberValue)) errors.idNumber = "请输入合法的18位大陆居民身份证号。";

    if (!phone) errors.phone = "请输入手机号码。";
    else if (!/^1[3-9]\d{9}$/.test(phone)) errors.phone = "请输入合法的11位手机号。";

    if (mustComplete) {
      if (!name) errors.name = "请输入姓名。";
      else if (name.length < 2) errors.name = "姓名至少2个字符。";
      else if (name.length > 30) errors.name = "姓名过长。";
    }
    if (mustComplete) {
      if (!studentNumber) errors.studentNumber = "请输入学号。";
      else if (studentNumber.length > 30) errors.studentNumber = "学号过长。";
    }
    if (mustComplete) {
      const classSelectionError = getClassSelectionError();
      if (classSelectionError) errors[classSelectionError.field] = classSelectionError.message;
    }
    if (mustComplete) {
      if (subjects.length === 0) errors.subject = "管理员尚未启用报考科目，暂不能提交报名。";
      else if (!subject) errors.subject = "请选择报考科目。";
      else if (!subjects.some((item) => item.name === subject)) errors.subject = "请选择系统提供的报考科目。";
    }
    if (mustComplete) {
      if (!address) errors.address = "请输入家庭地址。";
      else if (address.length < 5) errors.address = "家庭地址至少5个字符。";
      else if (address.length > 200) errors.address = "家庭地址过长。";
    }
    if (mustComplete && photo) {
      if (photo.size > 20 * 1024) errors.photo = "照片文件大小不能超过20KB。";
      else if (!/\.jpe?g$/i.test(photo.name) && photo.type !== "image/jpeg") errors.photo = "电子照片仅允许JPG格式。";
    }
    if (mustComplete && !initial?.photoPath && !photo) errors.photo = "正式提交前必须上传符合要求的电子照片。";
    return errors;
  }

  function fieldClass(field: FieldKey) {
    return `form-field${fieldErrors[field] ? " has-error" : ""}`;
  }

  function fieldAria(field: FieldKey) {
    return {
      "aria-describedby": fieldErrors[field] ? `${field}-field-error` : undefined,
      "aria-invalid": Boolean(fieldErrors[field])
    };
  }

  function fieldError(field: FieldKey) {
    if (!fieldErrors[field]) return null;
    return <span className="field-error" id={`${field}-field-error`}>{fieldErrors[field]}</span>;
  }

  async function submitForm(form: HTMLFormElement, intent: "draft" | "submit") {
    if (!registrationOpen) {
      setError("报名入口已关闭，不能新增或修改报名信息。");
      return;
    }
    const clientErrors = validateBeforeSubmit(form, intent);
    if (Object.keys(clientErrors).length > 0) {
      showFieldErrors(clientErrors);
      return;
    }
    setBusy(true);
    setError("");
    setFieldErrors({});
    setMessage("");
    const data = new FormData(form);
    data.set("intent", intent);
    data.set("classId", classId);
    const res = await fetch("/api/student/register", { method: "POST", body: data });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      showApiError(json);
      return;
    }
    const warning = typeof json.data.warning === "string" ? json.data.warning : "";
    if (json.data.queryPassword) {
      setQueryPassword(json.data.queryPassword);
      setMessage(`${json.data.message}。请务必保存查询密码：${json.data.queryPassword}${warning ? ` ${warning}` : ""}`);
      setDialog({
        title: json.data.message || "保存成功",
        message: "请务必保存查询密码，后续查询或修改报名信息需要使用它。",
        queryPassword: json.data.queryPassword,
        warning
      });
    } else if (intent === "submit") {
      setDialog({
        actionLabel: "查看报名信息",
        title: "报名信息已提交，待审核",
        message: "报名信息已提交，请后续通过查询入口留意审核结果。审核通过后状态会显示为“报名成功”；如审核不通过，系统会显示不通过原因。",
        redirectTo: "/reg/info/result"
      });
    } else {
      setMessage(`${json.data.message || "保存成功"}${warning ? `。${warning}` : ""}`);
      setDialog({
        title: "保存成功",
        message: "报名信息已保存为草稿，正式提交前仍可继续修改。",
        warning
      });
    }
  }

  function closeDialog() {
    const redirectTo = dialog?.redirectTo;
    setDialog(null);
    if (redirectTo) window.location.href = redirectTo;
  }

  return (
    <>
      <form className="card grid registration-form" noValidate onSubmit={(event) => { event.preventDefault(); submitForm(event.currentTarget, "draft"); }}>
        {message && <div className="success">{message}</div>}
        {queryPassword && <div className="notice"><b>查询密码：{queryPassword}</b><br />后续查询或修改报名信息需要使用“身份证号 + 查询密码”。</div>}
        {!registrationOpen && <div className="notice">报名入口已关闭，当前页面仅供查看，不能保存或提交。</div>}
        {subjects.length === 0 && <div className="error">管理员尚未启用报考科目，暂不能提交报名。</div>}
        {classConfigMessage && <div className="notice">{classConfigMessage}</div>}
        <input type="hidden" name="classId" value={classId} readOnly />
        <div className="grid grid-2">
          <label className={fieldClass("name")} data-registration-field="name"><span>姓名</span><input name="name" defaultValue={initial?.name || ""} onInput={() => clearFieldErrors(["name"])} {...fieldAria("name")} />{fieldError("name")}</label>
          <label className={fieldClass("idNumber")} data-registration-field="idNumber"><span>身份证号</span><input name="idNumber" value={idNumber} onChange={(e) => { clearFieldErrors(["idNumber"]); setIdNumber(e.target.value); }} maxLength={18} readOnly={Boolean(initial?.idNumber)} {...fieldAria("idNumber")} />{fieldError("idNumber")}</label>
          <label className="form-field readonly-field"><span>性别</span><input value={derived.gender} readOnly /></label>
          <label className="form-field readonly-field"><span>出生日期</span><input value={derived.birthDate} readOnly /></label>
          <label className={fieldClass("studentNumber")} data-registration-field="studentNumber"><span className="field-label">学号<span className="small">必填</span></span><input name="studentNumber" defaultValue={initial?.studentNumber || ""} placeholder="请输入学号" onInput={() => clearFieldErrors(["studentNumber"])} {...fieldAria("studentNumber")} />{fieldError("studentNumber")}</label>
          <label className={fieldClass("department")} data-registration-field="department"><span>院系</span><select name="department" value={department} onChange={(event) => { clearFieldErrors(["department", "grade", "classId"]); setDepartment(event.target.value); setGrade(""); setClassId(""); }} {...fieldAria("department")}><option value="">请选择院系</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select>{fieldError("department")}</label>
          <label className={fieldClass("grade")} data-registration-field="grade"><span>所在年级</span><select name="grade" value={grade} onChange={(event) => { clearFieldErrors(["grade", "classId"]); setGrade(event.target.value); setClassId(""); }} disabled={!department} {...fieldAria("grade")}><option value="">请选择年级</option>{grades.map((item) => <option key={item} value={item}>{item}</option>)}</select>{fieldError("grade")}</label>
          <label className={fieldClass("classId")} data-registration-field="classId"><span>班级</span><select value={classId} onChange={(event) => { clearFieldErrors(["classId"]); setClassId(event.target.value); }} disabled={!department || !grade} {...fieldAria("classId")}><option value="">请选择班级</option>{filteredClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{fieldError("classId")}</label>
          <label className={fieldClass("phone")} data-registration-field="phone"><span>手机号码</span><input name="phone" defaultValue={initial?.phone || ""} maxLength={11} onInput={() => clearFieldErrors(["phone"])} {...fieldAria("phone")} />{fieldError("phone")}</label>
          <label className={fieldClass("subject")} data-registration-field="subject"><span>报考科目</span><select name="subject" defaultValue={initial?.subject || ""} onChange={() => clearFieldErrors(["subject"])} {...fieldAria("subject")}><option value="">请选择报考科目</option>{subjects.map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}</select>{fieldError("subject")}</label>
        </div>
        <label className={fieldClass("address")} data-registration-field="address"><span>家庭地址</span><textarea name="address" defaultValue={initial?.address || ""} onInput={() => clearFieldErrors(["address"])} {...fieldAria("address")} />{fieldError("address")}</label>
        <div className="photo-warning">
          <b>电子照片要求</b>
          <ul>
            <li>必须上传后才能正式提交。</li>
            <li>白底不着白衣。</li>
            <li>仅允许 JPG 格式。</li>
            <li>像素必须严格为 90px × 110px。</li>
            <li>文件大小不能超过 20KB。</li>
          </ul>
        </div>
        <label className={fieldClass("photo")} data-registration-field="photo"><span>电子照片</span><input name="photo" type="file" accept=".jpg,image/jpeg" onChange={() => clearFieldErrors(["photo"])} {...fieldAria("photo")} />{fieldError("photo")}</label>
        <div className="notice">正式提交后报名状态为“待审核”，请后续通过查询入口留意审核结果和审核意见。</div>
        <div className="actions">
          <button disabled={busy || !registrationOpen} type="submit">保存草稿</button>
          <button disabled={busy || !registrationOpen} type="button" onClick={(event) => event.currentTarget.form && submitForm(event.currentTarget.form, "submit")}>正式提交</button>
        </div>
      </form>
      <StatusDialog actionLabel={dialog?.actionLabel} onClose={closeDialog} open={Boolean(dialog)} title={dialog?.title || ""}>
        <p>{dialog?.message}</p>
        {dialog?.queryPassword && <div className="notice"><b>查询密码：{dialog.queryPassword}</b></div>}
        {dialog?.warning && <div className="notice">{dialog.warning}</div>}
      </StatusDialog>
      {error && (
        <div className="form-error-toast" role="alert" onClick={() => setError("")} title="点击关闭">
          <div>
            <b>{Object.keys(fieldErrors).length > 0 ? "请检查标红项" : "提交失败"}</b>
            <span>{error}</span>
          </div>
          <button type="button" aria-label="关闭错误提示" onClick={() => setError("")}>&times;</button>
        </div>
      )}
    </>
  );
}
