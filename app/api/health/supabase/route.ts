import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, role, created_at")
        .limit(1);

    return NextResponse.json({
        ok: !error,
        error: error?.message ?? null,
        data: data ?? null,
    });
}