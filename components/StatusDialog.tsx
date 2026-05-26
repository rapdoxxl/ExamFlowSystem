"use client";

type StatusDialogProps = {
  actionLabel?: string;
  children?: React.ReactNode;
  message?: string;
  onClose: () => void;
  open: boolean;
  title: string;
  tone?: "success" | "error" | "notice";
};

export function StatusDialog({ actionLabel = "知道了", children, message, onClose, open, title, tone = "success" }: StatusDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <section className={`modal-panel tone-${tone}`} role="dialog" aria-modal="true" aria-labelledby="status-dialog-title">
        <h2 id="status-dialog-title">{title}</h2>
        {message && <p>{message}</p>}
        {children}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>{actionLabel}</button>
        </div>
      </section>
    </div>
  );
}
