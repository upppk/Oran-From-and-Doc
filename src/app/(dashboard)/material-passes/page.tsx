import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MaterialPassClient from "@/components/material-passes/MaterialPassClient";

export default async function MaterialPassesPage() {
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
    .from("material_passes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <MaterialPassClient
      initialRows={(rows ?? []) as any[]}
      currentUserId={user.id}
      currentUserName={profile?.full_name ?? user.email ?? ""}
      role={role}
    />
  );
}
