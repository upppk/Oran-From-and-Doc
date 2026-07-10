import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SampleRequestClient from "@/components/sample-requests/SampleRequestClient";

export default async function SampleRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "viewer";

  const [rowsRes, productsRes] = await Promise.all([
    supabase.from("sample_requests").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("sales_products").select("id,code,name,category_code,category_label,weight_per_unit_kg,list_price").eq("active", true).order("code"),
  ]);

  return (
    <SampleRequestClient
      initialRows={(rowsRes.data ?? []) as any[]}
      products={productsRes.data ?? []}
      currentUserId={user.id}
      currentUserName={profile?.full_name ?? user.email ?? ""}
      role={role}
    />
  );
}
