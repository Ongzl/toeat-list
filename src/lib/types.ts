export type Member = {
  email: string;
  display_name: string;
  is_admin: boolean;
  user_id: string | null;
  added_at: string;
};

export type Place = {
  id: string;
  name: string;
  area: string | null;
  address: string | null;
  maps_url: string | null;
  cuisine: string | null;
  price: number | null;
  dietary: string[];
  recommended_by: string | null;
  source_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PlaceListRow = Place & {
  created_by_name: string | null;
  avg_rating: number | null;
  rating_count: number;
  tried_count: number;
  tried_by_me: boolean;
};

export type Visit = {
  place_id: string;
  user_id: string;
  rating: number | null;
  comment: string | null;
  visited_at: string;
};

export const DIETARY_OPTIONS = ["halal", "vegetarian", "vegan", "no pork", "no beef"] as const;

export const priceLabel = (p: number | null) => (p ? "$".repeat(p) : "");
