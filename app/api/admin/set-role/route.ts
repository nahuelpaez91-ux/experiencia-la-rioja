import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { userId, role } = await req.json();
        if (!userId || !["user", "provider", "admin"].includes(role)) {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
        }
        const { error } = await supabaseAdmin.from("profiles").update({ role }).eq("id", userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}