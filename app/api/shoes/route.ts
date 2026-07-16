import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/shoes — جلب كل الأحذية مع مقاساتها
export async function GET() {
  const { data: shoes, error: shoesError } = await supabase
    .from("shoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (shoesError) {
    return NextResponse.json({ error: shoesError.message }, { status: 500 });
  }

  const { data: sizes, error: sizesError } = await supabase
    .from("shoe_sizes")
    .select("*");

  if (sizesError) {
    return NextResponse.json({ error: sizesError.message }, { status: 500 });
  }

  const shoesWithSizes = (shoes || []).map((shoe) => ({
    ...shoe,
    sizes: (sizes || []).filter((s) => s.shoe_id === shoe.id),
  }));

  return NextResponse.json(shoesWithSizes);
}

// POST /api/shoes — إضافة حذاء جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shoe, sizes } = body;

    const price = Number.isFinite(Number(shoe?.price ?? 0)) ? Number(shoe.price ?? 0) : 0;
    const costPrice = Number.isFinite(Number(shoe?.cost_price ?? 0)) ? Number(shoe.cost_price ?? 0) : 0;

    const normalizedSizes = Array.isArray(sizes)
      ? sizes
          .filter((s: { size?: number; quantity?: number } | null) => s && typeof s.size === "number" && Number.isFinite(s.size) && s.size > 0)
          .map((s: { size: number; quantity?: number }) => ({
            size: Number(s.size),
            quantity: Math.max(0, Number(s.quantity ?? 0)),
          }))
      : [];

    const { data: newShoe, error: shoeError } = await supabase
      .from("shoes")
      .insert({
        name: (shoe?.name ?? "").toString().trim(),
        supplier: (shoe?.supplier ?? "").toString().trim(),
        color: (shoe?.color ?? "").toString().trim(),
        cost_price: costPrice,
        price,
        image: (shoe?.image ?? "").toString() || "",
      })
      .select()
      .single();

    if (shoeError) {
      return NextResponse.json({ error: shoeError.message }, { status: 500 });
    }

    if (normalizedSizes.length > 0) {
      const sizesToInsert = normalizedSizes.map((s) => ({
        shoe_id: newShoe.id,
        size: s.size,
        quantity: s.quantity,
      }));

      const { error: sizesError } = await supabase.from("shoe_sizes").insert(sizesToInsert);

      if (sizesError) {
        return NextResponse.json({ error: sizesError.message }, { status: 500 });
      }
    }

    const { data: allSizes } = await supabase.from("shoe_sizes").select("*").eq("shoe_id", newShoe.id);

    return NextResponse.json({ ...newShoe, sizes: allSizes || [] });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة الحذاء" }, { status: 500 });
  }
}