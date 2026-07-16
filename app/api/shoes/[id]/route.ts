import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/shoes/[id] — جلب حذاء واحد مع مقاساته
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: shoe, error: shoeError } = await supabase
    .from("shoes")
    .select("*")
    .eq("id", id)
    .single();

  if (shoeError) {
    return NextResponse.json({ error: shoeError.message }, { status: 404 });
  }

  const { data: sizes } = await supabase
    .from("shoe_sizes")
    .select("*")
    .eq("shoe_id", id);

  return NextResponse.json({ ...shoe, sizes: sizes || [] });
}

// PUT /api/shoes/[id] — تعديل حذاء + مقاساته
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { shoe, sizes } = body;

  const price = Number.isFinite(Number(shoe?.price ?? 0)) ? Number(shoe.price ?? 0) : 0;
  const costPrice = Number.isFinite(Number(shoe?.cost_price ?? 0)) ? Number(shoe.cost_price ?? 0) : 0;

  const { error: shoeError } = await supabase
    .from("shoes")
    .update({
      name: (shoe?.name ?? "").toString().trim(),
      supplier: (shoe?.supplier ?? "").toString().trim(),
      color: (shoe?.color ?? "").toString().trim(),
      cost_price: costPrice,
      price,
      image: (shoe?.image ?? "").toString() || "",
    })
    .eq("id", id);

  if (shoeError) {
    return NextResponse.json({ error: shoeError.message }, { status: 500 });
  }

  if (Array.isArray(sizes)) {
    await supabase.from("shoe_sizes").delete().eq("shoe_id", id);

    const normalizedSizes = sizes
      .filter((s: { size?: number; quantity?: number } | null) => s && typeof s.size === "number" && Number.isFinite(s.size) && s.size > 0)
      .map((s: { size: number; quantity?: number }) => ({
        shoe_id: id,
        size: Number(s.size),
        quantity: Math.max(0, Number(s.quantity ?? 0)),
      }));

    if (normalizedSizes.length > 0) {
      const { error: sizesError } = await supabase.from("shoe_sizes").insert(normalizedSizes);

      if (sizesError) {
        return NextResponse.json({ error: sizesError.message }, { status: 500 });
      }
    }
  }

  const { data: updatedShoe } = await supabase.from("shoes").select("*").eq("id", id).single();

  const { data: allSizes } = await supabase.from("shoe_sizes").select("*").eq("shoe_id", id);

  return NextResponse.json({ ...updatedShoe, sizes: allSizes || [] });
}

// DELETE /api/shoes/[id] — حذف حذاء
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabase.from("shoes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}