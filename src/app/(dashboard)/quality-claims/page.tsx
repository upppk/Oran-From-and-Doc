import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QualityClaimClient from "@/components/quality-claims/QualityClaimClient";

export default async function QualityClaimsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "viewer";

  const [rowsRes, userProfilesRes] = await Promise.all([
    supabase.from("quality_claims").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("user_profiles").select("id, full_name"),
  ]);

  const userNames: Record<string, string> = {};
  (userProfilesRes.data ?? []).forEach(u => { if (u.full_name) userNames[u.id] = u.full_name; });

  return (
    <QualityClaimClient
      initialRows={(rowsRes.data ?? []) as any[]}
      currentUserId={user.id}
      currentUserName={profile?.full_name ?? user.email ?? ""}
      role={role}
      userNames={userNames}
    />
  );
}
