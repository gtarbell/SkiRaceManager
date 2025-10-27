import React from "react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
};

export default function Modal({
  open,
  title = "Notice",
  onClose,
  children,
  primaryActionText = "OK",
  onPrimaryAction,
}: Props) {
  if (!open) return null;
  const doPrimary = () => {
    onPrimaryAction?.();
    onClose();
  };
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button onClick={doPrimary}>{primaryActionText}</button>
        </div>
      </div>
    </div>
  );
}
