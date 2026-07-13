import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/pending-orders — جلب الطلبات المعلقة
export async function GET() {
  const { data, error } = await supabase
    .from("pending_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/pending-orders — إنشاء طلب معلق جديد (بيع)
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data: order, error: orderError } = await supabase
    .from("pending_orders")
    .insert({
      shoe_id: body.shoe_id,
      shoe_name: body.shoe_name,
      shoe_supplier: body.shoe_supplier,
      shoe_color: body.shoe_color,
      shoe_image: body.shoe_image,
      shoe_cost_price: body.shoe_cost_price,
      shoe_price: body.shoe_price,
      size: body.size,
      quantity: body.quantity,
      total_price: body.total_price,
      buyer_name: body.buyer_name,
      buyer_phone: body.buyer_phone || "",
      governorate: body.governorate,
      notes: body.notes || "",
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // خصم الكمية من المخزون
  const { data: sizeEntry, error: sizeFetchError } = await supabase
    .from("shoe_sizes")
    .select("id, quantity")
    .eq("shoe_id", body.shoe_id)
    .eq("size", body.size)
    .single();

  if (!sizeFetchError && sizeEntry) {
    await supabase
      .from("shoe_sizes")
      .update({ quantity: sizeEntry.quantity - body.quantity })
      .eq("id", sizeEntry.id);
  }

  return NextResponse.json(order);
}