import { describe, expect, it } from "vitest";
import { readFilters, searchPattern, toQuery } from "./filters";

describe("readFilters", () => {
  it("reads and trims known values", () => {
    expect(
      readFilters({
        q: "  ramen ",
        area: "SS15",
        cuisine: "Japanese",
        price: "2",
        tried: "notme",
        sort: "rating",
      }),
    ).toEqual({ q: "ramen", area: "SS15", cuisine: "Japanese", price: "2", tried: "notme", sort: "rating" });
  });

  it("defaults everything to empty", () => {
    expect(readFilters({})).toEqual({ q: "", area: "", cuisine: "", price: "", tried: "", sort: "" });
  });

  it("drops values that aren't on the allow-lists", () => {
    const f = readFilters({ price: "9", tried: "everyone", sort: "newest" });
    expect(f.price).toBe("");
    expect(f.tried).toBe("");
    expect(f.sort).toBe("");
  });

  it("takes the first value of repeated params", () => {
    expect(readFilters({ area: ["Bangsar", "SS15"] }).area).toBe("Bangsar");
  });

  it("caps free-text length", () => {
    expect(readFilters({ q: "x".repeat(500) }).q).toHaveLength(80);
  });
});

describe("toQuery", () => {
  it("is empty when nothing is set", () => {
    expect(toQuery({})).toBe("");
  });

  it("keeps only set values, in a stable order", () => {
    expect(toQuery({ sort: "name", q: "nasi lemak", price: "", area: "SS15" })).toBe(
      "?q=nasi+lemak&area=SS15&sort=name",
    );
  });

  it("round-trips through readFilters", () => {
    const f = readFilters({ q: "dim sum", cuisine: "Chinese", tried: "nobody" });
    const back = readFilters(Object.fromEntries(new URLSearchParams(toQuery(f))));
    expect(back).toEqual(f);
  });
});

describe("searchPattern", () => {
  it("wraps text in wildcards", () => {
    expect(searchPattern("laksa")).toBe("*laksa*");
  });

  it("returns null for empty or whitespace", () => {
    expect(searchPattern("")).toBeNull();
    expect(searchPattern("   ")).toBeNull();
  });

  it("strips characters that would break or widen the PostgREST filter", () => {
    expect(searchPattern('a,b(c)d"e\\f:g*h%i')).toBe("*a b c d e f g h i*");
    expect(searchPattern("name.eq.x),or(id.neq.0")).not.toMatch(/[,()]/);
  });
});
