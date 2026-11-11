import { beforeEach, describe, expect, it, vi } from "vitest";
import { formData, type Call, type Respond } from "@/test/fake-supabase";

const ctx = vi.hoisted(() => ({ respond: (() => undefined) as Respond, calls: [] as Call[] }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", async () => {
  const { fakeSupabase } = await import("@/test/fake-supabase");
  return {
    requireAdmin: vi.fn(async () => {
      const { client, calls } = fakeSupabase((c) => ctx.respond(c));
      ctx.calls = calls;
      return { supabase: client, user: { id: "admin-1" }, member: { email: "admin@example.test" } };
    }),
  };
});

const { addMember, removeMember } = await import("./actions");
const { revalidatePath } = await import("next/cache");

beforeEach(() => {
  ctx.respond = () => undefined;
  ctx.calls = [];
  vi.mocked(revalidatePath).mockClear();
});

describe("addMember", () => {
  it("adds a member with a trimmed name and lower-cased email", async () => {
    expect(
      await addMember(null, formData({ display_name: " Aunty May ", email: " May@Example.TEST " })),
    ).toEqual({ ok: true });
    expect(ctx.calls[0]).toMatchObject({
      table: "members",
      op: "insert",
      payload: { email: "may@example.test", display_name: "Aunty May" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/members");
  });

  it("needs both a name and an email", async () => {
    expect((await addMember(null, formData({ display_name: "May", email: " " })))?.error).toMatch(/both/);
    expect((await addMember(null, formData({ email: "may@example.test" })))?.error).toMatch(/both/);
    expect(ctx.calls).toHaveLength(0);
  });

  it("names the email when it's already on the list", async () => {
    ctx.respond = () => ({ error: { code: "23505", message: "duplicate key" } });
    const res = await addMember(null, formData({ display_name: "Sam", email: "sam@example.test" }));
    expect(res?.error).toBe("sam@example.test is already on the list.");
  });

  it("reports other database errors", async () => {
    ctx.respond = () => ({ error: { message: "network" } });
    const res = await addMember(null, formData({ display_name: "Sam", email: "sam@example.test" }));
    expect(res?.error).toMatch(/connection/);
  });

  // The form uses type="email", but the action can be called directly and used to accept anything,
  // creating members who could never sign in.
  it.each(["not-an-email", "sam@", "@example.test", "two@@example.test", "sp ace@example.test", "a@b"])(
    "rejects %j as an email address",
    async (email) => {
      const res = await addMember(null, formData({ display_name: "X", email }));
      expect(res?.error).toMatch(/doesn't look like an email/);
      expect(ctx.calls).toHaveLength(0);
    },
  );

  it.each(["a.b+food@gmail.com", "aunty.may@example.co.uk"])("accepts %j", async (email) => {
    expect(await addMember(null, formData({ display_name: "X", email }))).toEqual({ ok: true });
  });
});

describe("removeMember", () => {
  it("removes the member by email", async () => {
    ctx.respond = () => ({ data: [{ email: "sam@example.test" }] });
    expect(await removeMember("sam@example.test")).toEqual({ ok: true });
    expect(ctx.calls[0]).toMatchObject({ table: "members", op: "delete" });
    expect(ctx.calls[0].filters).toContainEqual(["eq", "email", "sam@example.test"]);
  });

  it("reports database errors", async () => {
    ctx.respond = () => ({ error: { code: "42501", message: "denied" } });
    expect((await removeMember("sam@example.test"))?.error).toMatch(/permission/);
  });
});
