import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PriceApprovalClient from "@/components/price-approval/PriceApprovalClient";

export default async function PriceApprovalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "viewer";

  const [rowsRes, productsRes, customersRes, userProfilesRes] = await Promise.all([
    supabase.from("price_approvals").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("sales_products").select("id,code,name,category_code,category_label,weight_per_unit_kg,list_price").eq("active", true).order("code"),
    supabase.from("sales_customers").select("id,code,name,zone_province,freight_baht_per_ton,credit_days").eq("active", true).order("code"),
    supabase.from("user_profiles").select("id, full_name"),
  ]);

  const userNames: Record<string, string> = {};
  (userProfilesRes.data ?? []).forEach(u => { if (u.full_name) userNames[u.id] = u.full_name; });

  return (
    <PriceApprovalClient
      initialRows={(rowsRes.data ?? []) as any[]}
      products={productsRes.data ?? []}
      customers={customersRes.data ?? []}
      currentUserId={user.id}
      currentUserName={profile?.full_name ?? user.email ?? ""}
      role={role}
      userNames={userNames}
    />
  );
}
