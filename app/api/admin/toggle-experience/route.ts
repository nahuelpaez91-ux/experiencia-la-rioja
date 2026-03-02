import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { expId, field, value } = await req.json();
        if (!expId || !["is_published", "is_featured"].includes(field)) {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
        }
        const { error } = await supabaseAdmin.from("experiences").update({ [field]: value }).eq("id", expId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}