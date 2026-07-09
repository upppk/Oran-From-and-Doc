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

  const [rowsRes, userProfilesRes, customersRes, productsRes] = await Promise.all([
    supabase.from("quality_claims").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("user_profiles").select("id, full_name"),
    supabase.from("sales_customers").select("id,code,name,zone_province,freight_baht_per_ton,credit_days").eq("active", true).order("code"),
    supabase.from("sales_products").select("id,code,name,category_code,category_label,weight_per_unit_kg,list_price").eq("active", true).order("code"),
  ]);

  const userNames: Record<string, string> = {};
  (userProfilesRes.data ?? []).forEach(u => { if (u.full_name) userNames[u.id] = u.full_name; });

  return (
    <QualityClaimClient
      initialRows={(rowsRes.data ?? []) as any[]}
      customers={customersRes.data ?? []}
      products={productsRes.data ?? []}
      currentUserId={user.id}
      currentUserName={profile?.full_name ?? user.email ?? ""}
      role={role}
      userNames={userNames}
    />
  );
}
