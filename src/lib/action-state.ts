/** What a form's server action reports back. `null` = nothing submitted yet. */
export type ActionState = { error?: string; ok?: boolean } | null;

type DbError = { code?: string; message: string };

/** Turn a Supabase/Postgres error into something a person can act on. */
export function friendlyError(error: DbError, duplicate = "That's already on the list."): string {
  switch (error.code) {
    case "23505":
      return duplicate;
    case "23514":
      return "Something is too long, or a link isn't a valid web address (it should start with http).";
    case "42501":
    case "PGRST301":
      return "You don't have permission to do that. Try signing out and in again.";
    default:
      return "Couldn't save. Check your connection and try again.";
  }
}
