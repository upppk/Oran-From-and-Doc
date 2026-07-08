import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MasterDataImportClient from "@/components/admin/MasterDataImportClient";

export default async function MasterDataPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const [productsRes, customersRes] = await Promise.all([
    supabase.from("sales_products").select("id,code,name,category_code,category_label,weight_per_unit_kg,list_price,active").order("code"),
    supabase.from("sales_customers").select("id,code,name,zone_province,freight_baht_per_ton,credit_days,active").order("code"),
  ]);

  return <MasterDataImportClient initialProducts={productsRes.data ?? []} initialCustomers={customersRes.data ?? []} />;
}
