"use client";

import { createContext, startTransition, useActionState, useEffect, useRef } from "react";
import type { ActionState } from "@/lib/action-state";

export const PendingContext = createContext(false);

type Props = Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  /** Clear the inputs after a successful save that stays on the page (e.g. adding a member). */
  resetOnSuccess?: boolean;
};

/**
 * Form wired to a server action that reports errors inline instead of crashing.
 * Submits via onSubmit (not the `action` prop) so React doesn't reset the inputs: if the save fails,
 * everything the person typed is still there.
 */
export default function ActionForm({ action, resetOnSuccess, children, ...rest }: Props) {
  const [state, dispatch, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      {...rest}
      ref={ref}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => dispatch(fd));
      }}
    >
      <PendingContext.Provider value={pending}>
        {state?.error && (
          <p role="alert" className="rounded-lg border border-danger p-3 text-sm text-danger">
            {state.error}
          </p>
        )}
        {children}
      </PendingContext.Provider>
    </form>
  );
}
