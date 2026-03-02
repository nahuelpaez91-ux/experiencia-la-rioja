import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
export async function POST(req: Request) {
    const { reviewId } = await req.json();
    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", reviewId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}