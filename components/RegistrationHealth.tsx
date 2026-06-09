import { getRegistrationHealth, type RegistrationHealthInput } from "@/lib/registrationHealth";

const statusLabels = {
  pass: "通过",
  todo: "待处理",
  warn: "需处理"
};

export function RegistrationHealthCard({ registration }: { registration: RegistrationHealthInput }) {
  const health = getRegistrationHealth(registration);
  return (
    <section className={`health-card health-${health.level}`}>
      <div className="health-head">
        <div>
          <p className="small">报名材料体检卡</p>
          <h2>{health.summary}</h2>
        </div>
        <span className="health-score">{health.score}/{health.total}</span>
      </div>
      <div className="health-next">{health.action}</div>
      <div className="health-checks">
        {health.checks.map((check) => (
          <div className={`health-check ${check.status}`} key={check.key}>
            <span>{statusLabels[check.status]}</span>
            <div>
              <strong>{check.title}</strong>
              <small>{check.detail}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RegistrationHealthInline({ registration }: { registration: RegistrationHealthInput }) {
  const health = getRegistrationHealth(registration);
  return (
    <div className={`health-inline health-${health.level}`} title={health.action}>
      <span>材料体检</span>
      <b>{health.score}/{health.total}</b>
      <small>{health.summary}</small>
    </div>
  );
}
