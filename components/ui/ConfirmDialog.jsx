"use client";

import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="space-y-4 text-sm">
        {description && <p className="text-foreground/70">{description}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}



