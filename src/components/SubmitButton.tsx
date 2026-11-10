"use client";

import { useContext } from "react";
import { useFormStatus } from "react-dom";
import { PendingContext } from "@/components/ActionForm";

/** Submit button that shows progress, with an optional "are you sure?" prompt. */
export default function SubmitButton({
  children,
  className,
  pendingText = "Saving…",
  confirm: confirmMessage,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  confirm?: string;
}) {
  const inActionForm = useContext(PendingContext);
  const { pending: formPending } = useFormStatus();
  const pending = inActionForm || formPending;

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
