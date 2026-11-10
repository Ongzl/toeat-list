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
 * Once hydrated it submits via onSubmit, so React doesn't reset the inputs: if the save fails,
 * everything the person typed is still there. The `action` prop is the fallback for a submit that
 * happens before the page's JavaScript has loaded (it posts to the server action instead of
 * turning into a GET with the fields in the URL).
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
      action={dispatch}
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
