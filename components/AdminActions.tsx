"use client";

export function ClassAdminButton({ id, isClassAdmin, classId }: { id: string; isClassAdmin: boolean; classId?: string | null }) {
  async function toggle() {
    const res = await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: isClassAdmin ? "unset-class-admin" : "set-class-admin", classId })
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.message || "操作失败");
      return;
    }
    alert(isClassAdmin ? "已取消班级管理员权限。" : "已设置为班级管理员。");
    window.location.reload();
  }
  return <button className="compact secondary" onClick={toggle}>{isClassAdmin ? "取消管理员" : "设为管理员"}</button>;
}

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

async function updateReviewStatus(ids: string[], reviewStatus: ReviewStatus, reviewReason?: string) {
  const res = await fetch("/api/admin/registrations", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "review", ids, reviewStatus, reviewReason })
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    alert(json.message || "审核操作失败");
    return;
  }
  alert(`审核操作完成，共处理 ${json.data.count} 名考生。`);
  window.location.reload();
}

async function updatePaymentStatus(ids: string[], paymentStatus: "PAID" | "UNPAID", api = "/api/admin/registrations") {
  const res = await fetch(api, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: ids[0], action: "payment", ids, paymentStatus })
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    alert(json.message || "缴费状态更新失败");
    return;
  }
  const count = json.data?.count ?? ids.length;
  alert(`操作完成，共 ${count} 名考生标记为${paymentStatus === "PAID" ? "已缴费" : "未缴费"}。`);
  window.location.reload();
}

export function PaymentBulkActions() {
  function getSelectedIds() {
    return Array.from(document.querySelectorAll<HTMLInputElement>(".student-row-checkbox:not(:disabled)"))
      .filter((item) => item.checked)
      .map((item) => item.value);
  }

  async function mark(paymentStatus: "PAID" | "UNPAID") {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert("请先勾选需要更新缴费状态的考生。");
      return;
    }
    const label = paymentStatus === "PAID" ? "已缴费" : "未缴费";
    if (!confirm(`确认将选中的 ${ids.length} 名考生标记为${label}？`)) return;
    await updatePaymentStatus(ids, paymentStatus);
  }

  return (
    <div className="payment-bulk-actions">
      <button type="button" className="compact" onClick={() => mark("PAID")}>标记已缴费</button>
      <button type="button" className="compact secondary" onClick={() => mark("UNPAID")}>标记未缴费</button>
    </div>
  );
}

export function PaymentToggleButton({ id, paymentStatus, api = "/api/admin/registrations" }: { id: string; paymentStatus: string; api?: string }) {
  async function toggle() {
    const nextStatus = paymentStatus === "PAID" ? "UNPAID" : "PAID";
    const label = nextStatus === "PAID" ? "已缴费" : "未缴费";
    if (!confirm(`确认将该考生标记为${label}？`)) return;
    await updatePaymentStatus([id], nextStatus, api);
  }

  return <button type="button" className="compact secondary" onClick={toggle}>{paymentStatus === "PAID" ? "改未缴" : "改已缴"}</button>;
}

export function ReviewBulkActions() {
  function getBoxes() {
    return Array.from(document.querySelectorAll<HTMLInputElement>(".student-row-checkbox:not(:disabled)"));
  }

  function getSelectedIds() {
    return getBoxes().filter((item) => item.checked).map((item) => item.value);
  }

  function toggleAll(checked: boolean) {
    getBoxes().forEach((item) => {
      item.checked = checked;
    });
  }

  async function approveSelected() {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert("请先勾选需要审核通过的考生。");
      return;
    }
    await updateReviewStatus(ids, "APPROVED");
  }

  async function rejectSelected() {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert("请先勾选需要审核不通过的考生。");
      return;
    }
    const reason = prompt("请输入审核不通过原因，学生查询报名信息时会看到该原因：");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("审核不通过原因不能为空。");
      return;
    }
    await updateReviewStatus(ids, "REJECTED", reason.trim());
  }

  return (
    <div className="review-bulk-actions">
      <label className="review-select-all"><input type="checkbox" onChange={(event) => toggleAll(event.currentTarget.checked)} />全选</label>
      <button type="button" className="compact" onClick={approveSelected}>批量通过</button>
      <button type="button" className="compact danger" onClick={rejectSelected}>批量不通过</button>
    </div>
  );
}

export function ReviewButtons({ id, status, reviewStatus }: { id: string; status: string; reviewStatus: string }) {
  if (status !== "SUBMITTED") return <span className="small">草稿不可审核</span>;

  async function approve() {
    await updateReviewStatus([id], "APPROVED");
  }

  async function reject() {
    const reason = prompt("请输入审核不通过原因，学生查询报名信息时会看到该原因：");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("审核不通过原因不能为空。");
      return;
    }
    await updateReviewStatus([id], "REJECTED", reason.trim());
  }

  async function reset() {
    if (!confirm("确认将该考生打回待审核状态？")) return;
    await updateReviewStatus([id], "PENDING");
  }

  if (reviewStatus === "APPROVED" || reviewStatus === "REJECTED") {
    return <button type="button" className="compact secondary" onClick={reset}>退回重审</button>;
  }

  return (
    <>
      <button type="button" className="compact" onClick={approve}>通过</button>
      <button type="button" className="compact danger" onClick={reject}>不通过</button>
    </>
  );
}

export function SettingsSwitch({ open }: { open: boolean }) {
  async function toggle() {
    const res = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationOpen: !open }) });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.message || "操作失败");
      return;
    }
    alert(open ? "报名入口已关闭。" : "报名入口已开启。");
    window.location.reload();
  }
  return <button className={open ? "danger" : ""} onClick={toggle}>{open ? "关闭报名入口" : "开启报名入口"}</button>;
}

export function ClassEditButtons({ id, department, grade, name, count }: { id: string; department: string; grade: string; name: string; count: number }) {
  async function rename() {
    const nextDepartment = prompt("院系", department || "");
    if (nextDepartment === null) return;
    const nextGrade = prompt("所在年级", grade || "");
    if (nextGrade === null) return;
    const nextName = prompt("班级名称", name);
    if (!nextName) return;
    const res = await fetch("/api/admin/classes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, department: nextDepartment, grade: nextGrade, name: nextName }) });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.message || "修改失败");
      return;
    }
    alert("班级信息已修改。");
    window.location.reload();
  }
  async function remove() {
    if (count > 0) {
      alert("该班级已有报名数据，不能删除。");
      return;
    }
    if (!confirm(`确认删除班级“${department}-${grade}-${name}”？`)) return;
    const res = await fetch(`/api/admin/classes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.message || "删除失败");
      return;
    }
    alert("班级已删除。");
    window.location.reload();
  }
  return <span className="actions"><button type="button" onClick={rename}>编辑</button><button type="button" className="danger" onClick={remove}>删除</button></span>;
}

type ClassOption = { id: string; name: string; department?: string | null; grade?: string | null };

function classLabel(item: ClassOption) {
  return [item.department, item.grade, item.name].filter(Boolean).join("-");
}

export function StudentEditButton({ registration, classes, api = "/api/admin/registrations" }: { registration: Record<string, string | null>; classes: ClassOption[]; api?: string }) {
  async function edit() {
    const name = prompt("姓名", registration.name || "");
    if (name === null) return;
    const studentNumber = prompt("学号", registration.studentNumber || "");
    if (studentNumber === null) return;
    const phone = prompt("手机号", registration.phone || "");
    if (phone === null) return;
    const address = prompt("家庭地址", registration.address || "");
    if (address === null) return;
    const subject = prompt("报考科目", registration.subject || "");
    if (subject === null) return;
    const className = prompt("班级（可输入完整格式：院系-年级-班级）", registration.className || "");
    if (className === null) return;
    const selectedClass = classes.find((item) => classLabel(item) === className || item.name === className) || classes.find((item) => item.id === registration.classId);
    const res = await fetch(api, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...registration, action: "update-info", name, studentNumber, phone, address, subject, classId: selectedClass?.id || registration.classId })
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.message || "修改失败");
      return;
    }
    alert("考生信息已修改。");
    window.location.reload();
  }
  return <button type="button" className="compact secondary" onClick={edit}>编辑</button>;
}

export function DeleteRegistrationButton({ id, idNumber, name, isClassAdmin }: { id: string; idNumber: string; name?: string | null; isClassAdmin: boolean }) {
  async function remove() {
    const label = [name, idNumber].filter(Boolean).join(" / ");
    const warning = isClassAdmin ? "\n\n该考生当前也是班级管理员，删除后将一并取消其后台登录权限。" : "";
    if (!confirm(`确认删除考生“${label}”？删除后该学生账号、报名记录和已上传照片都会被移除，且不可恢复。${warning}`)) return;
    const res = await fetch(`/api/admin/registrations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.message || "删除失败");
      return;
    }
    alert("考生已删除。");
    window.location.reload();
  }
  return <button type="button" className="compact danger" onClick={remove}>删除</button>;
}

export function ClassCreateForm() {
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch("/api/admin/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.message || "创建失败");
      return;
    }
    alert("班级已创建。");
    window.location.reload();
  }
  return <form className="actions" onSubmit={submit}><input name="department" placeholder="院系" /><input name="grade" placeholder="所在年级" /><input name="name" placeholder="班级名称" required /><button>新增班级</button></form>;
}

export function ImportClassesForm() {
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const res = await fetch("/api/admin/import-classes", { method: "POST", body: new FormData(form) });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.message || "导入失败");
      return;
    }
    alert(`导入完成：${json.data.count} 个班级`);
    window.location.reload();
  }
  async function importStudentStatus() {
    const data = new FormData();
    data.set("mode", "student-status-dir");
    const res = await fetch("/api/admin/import-classes", { method: "POST", body: data });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.message || "导入失败");
      return;
    }
    alert(`已从附件/学籍信息导入：${json.data.count} 个班级`);
    window.location.reload();
  }
  return <div className="grid"><form className="actions" onSubmit={submit}><input name="file" type="file" accept=".xlsx" required /><button>Excel导入班级</button></form><div className="actions"><button type="button" onClick={importStudentStatus}>从附件/学籍信息一键生成班级</button></div></div>;
}
