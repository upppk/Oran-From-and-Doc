import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminClient from "@/components/admin/AdminClient";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_approved, created_at")
    .order("created_at", { ascending: false });

  const { data: roleData } = await supabase
    .from("user_profiles")
    .select("id, role");

  const roleMap = Object.fromEntries((roleData ?? []).map(r => [r.id, r.role]));
  const merged = (users ?? []).map(u => ({ ...u, role: roleMap[u.id] ?? "viewer" }));

  return <AdminClient users={merged} />;
}
