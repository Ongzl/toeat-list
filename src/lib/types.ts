import type { Database as Generated } from "@/lib/database.types";

// Regenerate database.types.ts after changing migrations:
//   npm run db:types
type PublicGen = Generated["public"];
type Tables = PublicGen["Tables"];

export type Place = Tables["places"]["Row"];
export type Member = Tables["members"]["Row"];
export type Visit = Tables["visits"]["Row"];

/** A row of the place_list view: a place plus group stats. */
export type PlaceListRow = Place & {
  created_by_name: string | null;
  avg_rating: number | null;
  rating_count: number;
  tried_count: number;
  tried_by_me: boolean;
};

export type MemberName = { user_id: string; display_name: string };
export type PlaceOption = { kind: "area" | "cuisine"; value: string };

type View<Row> = { Row: Row; Relationships: [] };

/**
 * Postgres reports every view column as nullable, so the generated view types are overridden
 * with their real shapes. Tables and functions come straight from the generated file.
 */
export type Database = Omit<Generated, "public"> & {
  public: Omit<PublicGen, "Views"> & {
    Views: {
      place_list: View<PlaceListRow>;
      member_names: View<MemberName>;
      place_options: View<PlaceOption>;
    };
  };
};

export const DIETARY_OPTIONS = ["halal", "vegetarian", "vegan", "no pork", "no beef"] as const;

export const priceLabel = (p: number | null) => (p ? "$".repeat(p) : "");
