"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusDialog } from "@/components/StatusDialog";

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
};

type DialogState = {
  actionLabel?: string;
  message: string;
  queryPassword?: string;
  redirectTo?: string;
  title: string;
};

export function StudentForm({ classes, initial, registrationOpen, subjects }: { classes: ClassItem[]; initial?: Registration; registrationOpen: boolean; subjects: SubjectItem[] }) {
  const initialClass = classes.find((item) => item.id === initial?.classId);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [queryPassword, setQueryPassword] = useState("");
  const [idNumber, setIdNumber] = useState(initial?.idNumber || "");
  const [department, setDepartment] = useState(initialClass?.department || "");
  const [grade, setGrade] = useState(initialClass?.grade || "");
  const [classId, setClassId] = useState(initial?.classId || "");
  const [derived, setDerived] = useState({ gender: "", birthDate: "" });
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const departments = useMemo(() => Array.from(new Set(classes.map((item) => item.department || "未分院系"))).sort(), [classes]);
  const grades = useMemo(() => Array.from(new Set(classes.filter((item) => (item.department || "未分院系") === department).map((item) => item.grade || "未分年级"))).sort((a, b) => b.localeCompare(a, "zh-CN")), [classes, department]);
  const filteredClasses = useMemo(() => classes.filter((item) => (item.department || "未分院系") === department && (item.grade || "未分年级") === grade), [classes, department, grade]);

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

  async function submitForm(form: HTMLFormElement, intent: "draft" | "submit") {
    if (!registrationOpen) {
      setError("报名入口已关闭，不能新增或修改报名信息。");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const data = new FormData(form);
    data.set("intent", intent);
    data.set("classId", classId);
    const res = await fetch("/api/student/register", { method: "POST", body: data });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      const errorMessage = json.message || "提交失败";
      setError(errorMessage);
      return;
    }
    if (json.data.queryPassword) {
      setQueryPassword(json.data.queryPassword);
      setMessage(`${json.data.message}。请务必保存查询密码：${json.data.queryPassword}`);
      setDialog({
        title: json.data.message || "保存成功",
        message: "请务必保存查询密码，后续查询或修改报名信息需要使用它。",
        queryPassword: json.data.queryPassword
      });
    } else if (intent === "submit") {
      setDialog({
        actionLabel: "查看报名信息",
        title: "报名信息已提交，待审核",
        message: "报名信息已提交，请后续通过查询入口留意审核结果。审核通过后状态会显示为“报名成功”；如审核不通过，系统会显示不通过原因。",
        redirectTo: "/reg/info/result"
      });
    } else {
      setMessage(json.data.message || "保存成功");
      setDialog({
        title: "保存成功",
        message: "报名信息已保存为草稿，正式提交前仍可继续修改。"
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
      <form className="card grid" onSubmit={(event) => { event.preventDefault(); submitForm(event.currentTarget, "draft"); }}>
        {message && <div className="success">{message}</div>}
        {queryPassword && <div className="notice"><b>查询密码：{queryPassword}</b><br />后续查询或修改报名信息需要使用“身份证号 + 查询密码”。</div>}
        {!registrationOpen && <div className="notice">报名入口已关闭，当前页面仅供查看，不能保存或提交。</div>}
        {subjects.length === 0 && <div className="error">管理员尚未启用报考科目，暂不能提交报名。</div>}
        <input type="hidden" name="classId" value={classId} readOnly />
        <div className="grid grid-2">
          <label>姓名<input name="name" defaultValue={initial?.name || ""} /></label>
          <label>身份证号<input name="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} maxLength={18} readOnly={Boolean(initial?.idNumber)} /></label>
          <label>性别<input value={derived.gender} readOnly /></label>
          <label>出生日期<input value={derived.birthDate} readOnly /></label>
          <label>学号<span className="small">必填</span><input name="studentNumber" defaultValue={initial?.studentNumber || ""} placeholder="请输入学号" /></label>
          <label>院系<select value={department} onChange={(event) => { setDepartment(event.target.value); setGrade(""); setClassId(""); }}><option value="">请选择院系</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>所在年级<select value={grade} onChange={(event) => { setGrade(event.target.value); setClassId(""); }} disabled={!department}><option value="">请选择年级</option>{grades.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>班级<select value={classId} onChange={(event) => setClassId(event.target.value)} disabled={!department || !grade}><option value="">请选择班级</option>{filteredClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>手机号码<input name="phone" defaultValue={initial?.phone || ""} maxLength={11} /></label>
          <label>报考科目<select name="subject" defaultValue={initial?.subject || ""}><option value="">请选择报考科目</option>{subjects.map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}</select></label>
        </div>
        <label>家庭地址<textarea name="address" defaultValue={initial?.address || ""} /></label>
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
        <label>电子照片<input name="photo" type="file" accept=".jpg,image/jpeg" /></label>
        <div className="notice">正式提交后报名状态为“待审核”，请后续通过查询入口留意审核结果和审核意见。</div>
        <div className="actions">
          <button disabled={busy || !registrationOpen} type="submit">保存草稿</button>
          <button disabled={busy || !registrationOpen} type="button" onClick={(event) => event.currentTarget.form && submitForm(event.currentTarget.form, "submit")}>正式提交</button>
        </div>
      </form>
      <StatusDialog actionLabel={dialog?.actionLabel} onClose={closeDialog} open={Boolean(dialog)} title={dialog?.title || ""}>
        <p>{dialog?.message}</p>
        {dialog?.queryPassword && <div className="notice"><b>查询密码：{dialog.queryPassword}</b></div>}
      </StatusDialog>
      {error && (
        <div className="form-error-toast" role="alert">
          <div>
            <b>提交失败</b>
            <span>{error}</span>
          </div>
          <button type="button" aria-label="关闭错误提示" onClick={() => setError("")}>&times;</button>
        </div>
      )}
    </>
  );
}
