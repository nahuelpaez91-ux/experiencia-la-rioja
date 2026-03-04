import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { userId, action, reason } = await req.json();

        if (action === "approve") {
            const { error } = await supabaseAdmin
                .from("profiles")
                .update({ role: "provider", provider_status: "approved" })
                .eq("id", userId);

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ ok: true });
        }

        if (action === "reject") {
            const { error } = await supabaseAdmin
                .from("profiles")
                .update({ role: "user", provider_status: "rejected", rejection_reason: reason })
                .eq("id", userId);

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}