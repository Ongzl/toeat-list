// A tiny stand-in for the Supabase client used by route handlers and server actions in tests.
// Every `from(table)…` chain is recorded as a Call; the test's `respond` function decides what
// each call returns. No network, no database.

export type Call = {
  table: string;
  op: "select" | "insert" | "update" | "upsert" | "delete";
  payload?: unknown;
  /** Filter / modifier calls in order, e.g. ["eq", "id", "p1"], ["is", "deleted_at", null]. */
  filters: unknown[][];
  selectColumns?: string;
  selectOptions?: unknown;
  terminal?: "single" | "maybeSingle";
};

export type Result = {
  data?: unknown;
  error?: { code?: string; message: string } | null;
  count?: number | null;
};
export type Respond = (call: Call) => Result | undefined;

const MODIFIERS = ["eq", "is", "not", "or", "order", "range", "limit", "ilike", "in", "neq", "gt", "lt"];

function builder(table: string, respond: Respond, calls: Call[]) {
  const call: Call = { table, op: "select", filters: [] };
  calls.push(call);

  const run = () => {
    const r = respond(call) ?? {};
    return { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
  };

  const b: Record<string, unknown> = {
    select(columns?: string, options?: unknown) {
      // .insert(...).select("id") keeps the write op; a bare .select() is a read.
      call.selectColumns = columns;
      call.selectOptions = options;
      return b;
    },
    insert(payload: unknown) {
      call.op = "insert";
      call.payload = payload;
      return b;
    },
    update(payload: unknown) {
      call.op = "update";
      call.payload = payload;
      return b;
    },
    upsert(payload: unknown) {
      call.op = "upsert";
      call.payload = payload;
      return b;
    },
    delete() {
      call.op = "delete";
      return b;
    },
    single() {
      call.terminal = "single";
      return Promise.resolve(run());
    },
    maybeSingle() {
      call.terminal = "maybeSingle";
      return Promise.resolve(run());
    },
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      return Promise.resolve(run()).then(resolve, reject);
    },
  };
  for (const m of MODIFIERS) {
    b[m] = (...args: unknown[]) => {
      call.filters.push([m, ...args]);
      return b;
    };
  }
  return b;
}

export function fakeSupabase(respond: Respond = () => undefined) {
  const calls: Call[] = [];
  type AuthError = { message: string } | null;
  // Tests replace these with vi.fn() as needed.
  const auth: {
    exchangeCodeForSession: (code: string) => Promise<{ error: AuthError }>;
    signOut: () => Promise<{ error: AuthError }>;
  } = {
    exchangeCodeForSession: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
  };
  const client = {
    from: (table: string) => builder(table, respond, calls),
    auth,
  };
  return { client, calls, auth };
}

/** Thrown by the mocked next/navigation redirect(), like Next's own NEXT_REDIRECT error. */
export class RedirectSignal extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT ${url}`);
  }
}

export function formData(entries: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    for (const item of Array.isArray(v) ? v : [v]) fd.append(k, item);
  }
  return fd;
}
