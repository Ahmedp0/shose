import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/completed-orders — جلب الطلبات المكتملة
export async function GET() {
  const { data, error } = await supabase
    .from("completed_orders")
    .select("*")
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("returned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}