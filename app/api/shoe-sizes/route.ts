import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/shoe-sizes?shoe_id=xxx — جلب مقاسات حذاء معين
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shoeId = searchParams.get("shoe_id");

  let query = supabase.from("shoe_sizes").select("*");

  if (shoeId) {
    query = query.eq("shoe_id", shoeId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/shoe-sizes — إضافة مقاس جديد
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("shoe_sizes")
    .insert({
      shoe_id: body.shoe_id,
      size: body.size,
      quantity: body.quantity || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}