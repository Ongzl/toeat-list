// Tests for the route handlers: /random, /auth/callback and /auth/signout.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Call, Respond } from "@/test/fake-supabase";

type AuthResult = Promise<{ error: { message: string } | null }>;

const ctx = vi.hoisted(() => ({
  respond: (() => undefined) as Respond,
  calls: [] as Call[],
  exchange: vi.fn<(code: string) => AuthResult>(),
  signOut: vi.fn<() => AuthResult>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", async () => {
  const { fakeSupabase } = await import("@/test/fake-supabase");
  return {
    createClient: vi.fn(async () => {
      const { client, calls } = fakeSupabase((c) => ctx.respond(c));
      ctx.calls = calls;
      client.auth.exchangeCodeForSession = ctx.exchange;
      client.auth.signOut = ctx.signOut;
      return client;
    }),
  };
});

const random = await import("./(app)/random/route");
const callback = await import("./auth/callback/route");
const signout = await import("./auth/signout/route");

const BASE = "http://localhost:3000";
const location = (res: Response) => res.headers.get("location");

beforeEach(() => {
  ctx.respond = () => undefined;
  ctx.calls = [];
  ctx.exchange.mockReset().mockResolvedValue({ error: null });
  ctx.signOut.mockReset().mockResolvedValue({ error: null });
});

describe("GET /random", () => {
  /** Respond to the count query (range 0..0) and the pick query (range n..n). */
  const places =
    (ids: string[]): Respond =>
    (c) => {
      const range = c.filters.find((f) => f[0] === "range") as [string, number, number] | undefined;
      const i = range?.[1] ?? 0;
      return { data: ids[i] ? [{ id: ids[i] }] : [], count: c.selectOptions ? ids.length : null };
    };

  it("redirects to a random matching place and remembers the filters", async () => {
    ctx.respond = places(["a", "b", "c"]);
    vi.spyOn(Math, "random").mockReturnValue(0.5); // index 1 → "b"
    const res = await random.GET(new Request(`${BASE}/random?cuisine=Japanese`));
    vi.mocked(Math.random).mockRestore();
    expect(location(res)).toBe(`${BASE}/places/b?picked=%3Fcuisine%3DJapanese`);
    // Filter went to the database, and only two single-row queries were made.
    expect(ctx.calls.every((c) => c.filters.some((f) => f[0] === "range"))).toBe(true);
    expect(ctx.calls[0].filters).toContainEqual(["eq", "cuisine", "Japanese"]);
  });

  it("uses the counted row directly when the pick is the first one", async () => {
    ctx.respond = places(["only"]);
    const res = await random.GET(new Request(`${BASE}/random`));
    expect(location(res)).toBe(`${BASE}/places/only?picked=%3F`);
    expect(ctx.calls).toHaveLength(1);
  });

  it("goes back to the filtered list when nothing matches", async () => {
    ctx.respond = places([]);
    const res = await random.GET(new Request(`${BASE}/random?q=zzz`));
    expect(location(res)).toBe(`${BASE}/?q=zzz`);
  });

  it("goes back to the list when the query fails", async () => {
    ctx.respond = () => ({ error: { message: "boom" } });
    expect(location(await random.GET(new Request(`${BASE}/random`)))).toBe(`${BASE}/`);
  });

  it("goes back to the list if the picked row vanished between the two queries", async () => {
    ctx.respond = (c) => {
      const range = c.filters.find((f) => f[0] === "range") as [string, number, number];
      return range[1] === 0 ? { data: [{ id: "a" }], count: 2 } : { data: [] };
    };
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const res = await random.GET(new Request(`${BASE}/random`));
    vi.mocked(Math.random).mockRestore();
    expect(location(res)).toBe(`${BASE}/`);
  });
});

describe("GET /auth/callback", () => {
  it("exchanges the code and goes home", async () => {
    const res = await callback.GET(new Request(`${BASE}/auth/callback?code=abc`));
    expect(ctx.exchange).toHaveBeenCalledWith("abc");
    expect(location(res)).toBe(`${BASE}/`);
  });

  it("sends a failed exchange to /login with an error", async () => {
    ctx.exchange.mockResolvedValue({ error: { message: "bad code" } });
    const res = await callback.GET(new Request(`${BASE}/auth/callback?code=abc`));
    expect(location(res)).toBe(`${BASE}/login?error=auth`);
  });

  it("sends a missing code (e.g. the person cancelled Google) to /login with an error", async () => {
    const res = await callback.GET(new Request(`${BASE}/auth/callback?error=access_denied`));
    expect(ctx.exchange).not.toHaveBeenCalled();
    expect(location(res)).toBe(`${BASE}/login?error=auth`);
  });
});

describe("POST /auth/signout", () => {
  it("signs out and redirects to /login with 303 so the browser follows with GET", async () => {
    const res = await signout.POST(new Request(`${BASE}/auth/signout`, { method: "POST" }));
    expect(ctx.signOut).toHaveBeenCalled();
    expect(res.status).toBe(303);
    expect(location(res)).toBe(`${BASE}/login`);
  });
});
