import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShirtRequestClient from "@/components/shirt-requests/ShirtRequestClient";

export default async function ShirtRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "viewer";

  const { data: rows } = await supabase
    .from("shirt_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <ShirtRequestClient
      initialRows={(rows ?? []) as any[]}
      currentUserId={user.id}
      currentUserName={profile?.full_name ?? user.email ?? ""}
      role={role}
    />
  );
}
