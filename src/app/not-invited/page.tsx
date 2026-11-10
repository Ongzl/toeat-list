import { createClient } from "@/lib/supabase/server";

export default async function NotInvited() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4 text-center">
      <div className="text-5xl">🔒</div>
      <h1 className="text-xl font-bold">You&apos;re not on the list yet</h1>
      <p className="text-sm text-muted">
        <strong>{user?.email}</strong> hasn&apos;t been added to the group. Ask the admin to add this email,
        then sign in again.
      </p>
      <form action="/auth/signout" method="post">
        <button className="btn-secondary w-full">Sign out</button>
      </form>
    </main>
  );
}
