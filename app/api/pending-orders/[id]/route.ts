import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// DELETE /api/pending-orders/[id]?action=deliver — تسليم الطلب (pending → completed)
// DELETE /api/pending-orders/[id]?action=return — إرجاع الطلب (pending → completed مع returned_at)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "deliver";

  // جلب الطلب المعلق
  const { data: order, error: fetchError } = await supabase
    .from("pending_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  if (action === "return") {
    // إرجاع الكمية للمخزون
    const { data: sizeEntry } = await supabase
      .from("shoe_sizes")
      .select("id, quantity")
      .eq("shoe_id", order.shoe_id)
      .eq("size", order.size)
      .single();

    if (sizeEntry) {
      await supabase
        .from("shoe_sizes")
        .update({ quantity: sizeEntry.quantity + order.quantity })
        .eq("id", sizeEntry.id);
    }

    // نقل إلى الطلبات المكتملة مع returned_at
    const { error: insertError } = await supabase
      .from("completed_orders")
      .insert({
        order_number: order.order_number,
        shoe_id: order.shoe_id,
        shoe_name: order.shoe_name,
        shoe_supplier: order.shoe_supplier,
        shoe_color: order.shoe_color,
        shoe_image: order.shoe_image,
        shoe_cost_price: order.shoe_cost_price,
        shoe_price: order.shoe_price,
        size: order.size,
        quantity: order.quantity,
        total_price: order.total_price,
        buyer_name: order.buyer_name,
        buyer_phone: order.buyer_phone,
        governorate: order.governorate,
        notes: order.notes,
        created_at: order.created_at,
        returned_at: new Date().toISOString(),
        return_reason: searchParams.get("reason") || "",
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    // تسليم — نقل إلى الطلبات المكتملة مع completed_at
    const { error: insertError } = await supabase
      .from("completed_orders")
      .insert({
        order_number: order.order_number,
        shoe_id: order.shoe_id,
        shoe_name: order.shoe_name,
        shoe_supplier: order.shoe_supplier,
        shoe_color: order.shoe_color,
        shoe_image: order.shoe_image,
        shoe_cost_price: order.shoe_cost_price,
        shoe_price: order.shoe_price,
        size: order.size,
        quantity: order.quantity,
        total_price: order.total_price,
        buyer_name: order.buyer_name,
        buyer_phone: order.buyer_phone,
        governorate: order.governorate,
        notes: order.notes,
        created_at: order.created_at,
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // حذف الطلب المعلق
  const { error: deleteError } = await supabase
    .from("pending_orders")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, action });
}