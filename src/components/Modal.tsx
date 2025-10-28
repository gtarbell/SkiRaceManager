import React from "react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  showDefaultFooter?: boolean; // 👈 new prop
};

export default function Modal({
  open,
  title = "Notice",
  onClose,
  children,
  primaryActionText = "OK",
  onPrimaryAction,
  showDefaultFooter = true, // 👈 default is true
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
         {showDefaultFooter && (
          <div className="modal-footer">
            <button onClick={doPrimary}>{primaryActionText}</button>
          </div>
        )}
      </div>
    </div>
  );
}
