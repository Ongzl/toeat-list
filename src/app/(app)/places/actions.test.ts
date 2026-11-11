import { beforeEach, describe, expect, it, vi } from "vitest";
import { formData, RedirectSignal, type Call, type Respond } from "@/test/fake-supabase";

const ctx = vi.hoisted(() => ({ respond: (() => undefined) as Respond, calls: [] as Call[] }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", async () => {
  const { RedirectSignal } = await import("@/test/fake-supabase");
  return {
    redirect: vi.fn((url: string) => {
      throw new RedirectSignal(url);
    }),
  };
});
vi.mock("@/lib/auth", async () => {
  const { fakeSupabase } = await import("@/test/fake-supabase");
  return {
    requireMember: vi.fn(async () => {
      const { client, calls } = fakeSupabase((c) => ctx.respond(c));
      ctx.calls = calls;
      return { supabase: client, user: { id: "user-1" }, member: { display_name: "Tester" } };
    }),
  };
});

const { createPlace, updatePlace, deletePlace, restorePlace, saveVisit, removeVisit } = await import(
  "./actions"
);
const { revalidatePath } = await import("next/cache");

/** Run an action that's expected to redirect; return the URL. */
async function redirectOf(p: Promise<unknown>) {
  const err = await p.catch((e) => e);
  expect(err).toBeInstanceOf(RedirectSignal);
  return (err as RedirectSignal).url;
}

const writes = () => ctx.calls.filter((c) => c.op !== "select");

beforeEach(() => {
  ctx.respond = () => undefined;
  ctx.calls = [];
  vi.mocked(revalidatePath).mockClear();
});

describe("createPlace", () => {
  it("inserts trimmed fields, normalises links and redirects to the new place", async () => {
    ctx.respond = (c) => (c.op === "insert" ? { data: { id: "new-1" } } : undefined);
    const url = await redirectOf(
      createPlace(
        null,
        formData({
          name: "  Ramen Ichiban ",
          area: "Bangsar",
          cuisine: " ",
          price: "2",
          dietary: ["halal", "not-a-diet"],
          source_url: "tiktok.com/@x/1",
          maps_url: "HTTPS://maps.app.goo.gl/abc",
          notes: "",
        }),
      ),
    );
    expect(url).toBe("/places/new-1");
    expect(ctx.calls[0]).toMatchObject({
      table: "places",
      op: "insert",
      payload: {
        name: "Ramen Ichiban",
        area: "Bangsar",
        cuisine: null,
        price: 2,
        dietary: ["halal"],
        source_url: "https://tiktok.com/@x/1",
        maps_url: "HTTPS://maps.app.goo.gl/abc",
        notes: null,
        address: null,
        recommended_by: null,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("rejects a blank name without touching the database", async () => {
    expect(await createPlace(null, formData({ name: "   " }))).toEqual({ error: "Give the place a name." });
    expect(ctx.calls).toHaveLength(0);
  });

  it("ignores out-of-range prices", async () => {
    ctx.respond = () => ({ data: { id: "p" } });
    await redirectOf(createPlace(null, formData({ name: "A", price: "7" })));
    expect(ctx.calls[0].payload).toMatchObject({ price: null });
  });

  it("reports database errors in plain words", async () => {
    ctx.respond = () => ({ error: { code: "23514", message: "check violation" } });
    const res = await createPlace(null, formData({ name: "A" }));
    expect(res?.error).toMatch(/too long|valid web address/);
  });
});

describe("updatePlace", () => {
  it("updates only a non-deleted place and redirects back to it", async () => {
    ctx.respond = () => ({ data: [{ id: "p1" }] });
    const url = await redirectOf(updatePlace("p1", null, formData({ name: "New name" })));
    expect(url).toBe("/places/p1");
    expect(ctx.calls[0].op).toBe("update");
    expect(ctx.calls[0].filters).toContainEqual(["eq", "id", "p1"]);
    expect(ctx.calls[0].filters).toContainEqual(["is", "deleted_at", null]);
  });

  it("says so when the place was deleted meanwhile", async () => {
    ctx.respond = () => ({ data: [] });
    const res = await updatePlace("p1", null, formData({ name: "x" }));
    expect(res?.error).toMatch(/deleted/);
  });

  it("rejects a blank name", async () => {
    expect((await updatePlace("p1", null, formData({ name: "" })))?.error).toMatch(/name/);
  });

  it("reports database errors", async () => {
    ctx.respond = () => ({ error: { code: "42501", message: "denied" } });
    expect((await updatePlace("p1", null, formData({ name: "x" })))?.error).toMatch(/permission/);
  });
});

describe("deletePlace / restorePlace", () => {
  it("soft-deletes and goes home", async () => {
    ctx.respond = () => ({ data: [{ id: "p1" }] });
    expect(await redirectOf(deletePlace("p1"))).toBe("/");
    expect(ctx.calls[0]).toMatchObject({ op: "update", payload: { deleted_at: expect.any(String) } });
  });

  it("reports a failed delete", async () => {
    ctx.respond = () => ({ error: { message: "network" } });
    expect((await deletePlace("p1"))?.error).toMatch(/connection/);
  });

  it("restores by clearing deleted_at", async () => {
    ctx.respond = () => ({ data: [{ id: "p1" }] });
    expect(await restorePlace("p1")).toEqual({ ok: true });
    expect(ctx.calls[0]).toMatchObject({ op: "update", payload: { deleted_at: null } });
  });

  it("reports a failed restore", async () => {
    ctx.respond = () => ({ error: { message: "x" } });
    expect((await restorePlace("p1"))?.error).toBeTruthy();
  });
});

describe("saveVisit", () => {
  const activePlace: Respond = (c) =>
    c.op === "select" ? { data: { id: "p1" } } : { data: null, error: null };

  it("upserts your visit with a whole-star rating and trimmed comment", async () => {
    ctx.respond = activePlace;
    expect(await saveVisit("p1", null, formData({ rating: "4", comment: " Great " }))).toEqual({ ok: true });
    expect(writes()[0]).toMatchObject({
      table: "visits",
      op: "upsert",
      payload: { place_id: "p1", user_id: "user-1", rating: 4, comment: "Great" },
    });
  });

  it("treats 'No rating' as null", async () => {
    ctx.respond = activePlace;
    await saveVisit("p1", null, formData({ rating: "" }));
    expect(writes()[0].payload).toMatchObject({ rating: null, comment: null });
  });

  it("refuses a visit to a deleted place", async () => {
    ctx.respond = () => ({ data: null });
    expect((await saveVisit("p1", null, formData({ rating: "5" })))?.error).toMatch(/deleted/);
    expect(writes()).toHaveLength(0);
  });

  it("reports a failed save", async () => {
    ctx.respond = (c) => (c.op === "select" ? { data: { id: "p1" } } : { error: { message: "x" } });
    expect((await saveVisit("p1", null, formData({ rating: "3" })))?.error).toBeTruthy();
  });
});

describe("removeVisit", () => {
  it("deletes only your own visit", async () => {
    expect(await removeVisit("p1")).toEqual({ ok: true });
    expect(ctx.calls[0]).toMatchObject({ table: "visits", op: "delete" });
    expect(ctx.calls[0].filters).toContainEqual(["eq", "user_id", "user-1"]);
  });

  it("reports a failed removal", async () => {
    ctx.respond = () => ({ error: { message: "x" } });
    expect((await removeVisit("p1"))?.error).toBeTruthy();
  });
});

// A crafted rating=4.5 / price=1.5 used to reach Postgres (smallint), fail there, and surface as
// "Couldn't save. Check your connection" — a misleading message, and nothing saved.
describe("whole-number validation", () => {
  it.each(["4.5", "0", "6", "abc", "1e0x"])("treats rating %j as no rating", async (rating) => {
    ctx.respond = (c) => (c.op === "select" ? { data: { id: "p1" } } : {});
    await saveVisit("p1", null, formData({ rating }));
    expect(writes()[0].payload).toMatchObject({ rating: null });
  });

  it.each(["1.5", "0", "4", "-1"])("treats price %j as not sure", async (price) => {
    ctx.respond = () => ({ data: { id: "p" } });
    await redirectOf(createPlace(null, formData({ name: "A", price })));
    expect(ctx.calls[0].payload).toMatchObject({ price: null });
  });

  it("keeps valid whole numbers", async () => {
    ctx.respond = (c) => (c.op === "select" ? { data: { id: "p1" } } : {});
    await saveVisit("p1", null, formData({ rating: "5" }));
    expect(writes()[0].payload).toMatchObject({ rating: 5 });
  });
});
