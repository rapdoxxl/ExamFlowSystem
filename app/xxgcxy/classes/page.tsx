import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ClassCreateForm, ClassEditButtons, ImportClassesForm } from "@/components/AdminActions";
import { requireRole } from "@/lib/auth";

type ClassesPageProps = {
  searchParams?: Promise<{ dir?: string; sort?: string }>;
};

type ClassRow = Awaited<ReturnType<typeof getClasses>>[number];
type SortDirection = "asc" | "desc";
type SortField = "department" | "grade" | "name" | "registrations";

const SORT_LABELS: Record<SortField, string> = {
  department: "院系",
  grade: "所在年级",
  name: "班级",
  registrations: "报名人数"
};

async function getClasses() {
  return prisma.class.findMany({
    include: { _count: { select: { registrations: true } } }
  });
}

function isSortField(value: string): value is SortField {
  return ["department", "grade", "name", "registrations"].includes(value);
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, "zh-CN", { numeric: true, sensitivity: "base" });
}

function compareClassRows(a: ClassRow, b: ClassRow, sort: SortField, direction: SortDirection) {
  let result = 0;
  if (sort === "registrations") {
    result = a._count.registrations - b._count.registrations;
  } else {
    result = compareText(a[sort] || "", b[sort] || "");
  }

  if (result !== 0) return direction === "asc" ? result : -result;

  const fallback = compareText(a.department || "", b.department || "")
    || -compareText(a.grade || "", b.grade || "")
    || compareText(a.name || "", b.name || "");
  return fallback;
}

function nextSortHref(activeSort: SortField, activeDirection: SortDirection, field: SortField) {
  const nextDirection: SortDirection = activeSort === field && activeDirection === "asc" ? "desc" : "asc";
  return `/xxgcxy/classes?sort=${field}&dir=${nextDirection}`;
}

function SortHeader({ activeDirection, activeSort, field }: { activeDirection: SortDirection; activeSort: SortField; field: SortField }) {
  const active = activeSort === field;
  const nextDirection = active && activeDirection === "asc" ? "desc" : "asc";
  return (
    <th aria-sort={active ? (activeDirection === "asc" ? "ascending" : "descending") : "none"}>
      <Link className={`sort-link${active ? " active" : ""}`} href={nextSortHref(activeSort, activeDirection, field)} title={`按${SORT_LABELS[field]}${nextDirection === "asc" ? "升序" : "降序"}排序`}>
        <span>{SORT_LABELS[field]}</span>
        <span className="sort-indicator">{active ? (activeDirection === "asc" ? "↑" : "↓") : "↕"}</span>
      </Link>
    </th>
  );
}

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return <main className="container"><div className="error">无权限，请使用系统管理员账号登录。</div></main>;
  const params = await searchParams;
  const activeSort = isSortField(String(params?.sort || "")) ? String(params?.sort) as SortField : "department";
  const activeDirection: SortDirection = params?.dir === "desc" ? "desc" : "asc";
  const classes = (await getClasses()).sort((a, b) => compareClassRows(a, b, activeSort, activeDirection));
  return (
    <main className="container grid">
      <h1>班级管理</h1>
      <div className="card grid">
        <ClassCreateForm />
        <ImportClassesForm />
        <p className="small">学籍信息导入会读取 Excel 表头中的“院系 / 所在年级 / 班级”，生成学生端三级选择列表。</p>
      </div>
      <div className="card">
        <table><thead><tr><SortHeader activeDirection={activeDirection} activeSort={activeSort} field="department" /><SortHeader activeDirection={activeDirection} activeSort={activeSort} field="grade" /><SortHeader activeDirection={activeDirection} activeSort={activeSort} field="name" /><SortHeader activeDirection={activeDirection} activeSort={activeSort} field="registrations" /><th>操作</th></tr></thead><tbody>{classes.map((item) => <tr key={item.id}><td>{item.department}</td><td>{item.grade}</td><td>{item.name}</td><td>{item._count.registrations}</td><td><ClassEditButtons id={item.id} department={item.department} grade={item.grade} name={item.name} count={item._count.registrations} /></td></tr>)}</tbody></table>
      </div>
    </main>
  );
}
