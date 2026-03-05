import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const userId = searchParams.get("state");

    if (!code || !userId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/proveedor?mp_error=missing_params`);
    }

    try {
        const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/callback`;

        const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.MP_CLIENT_ID,
                client_secret: process.env.MP_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            console.error("MP OAuth error:", tokenData);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/proveedor?mp_error=token_failed`);
        }

        const { error } = await supabaseAdmin
            .from("profiles")
            .update({
                mp_access_token: tokenData.access_token,
                mp_user_id: String(tokenData.user_id),
                mp_connected: true,
            })
            .eq("id", userId);

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/proveedor?mp_error=db_failed`);
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/proveedor?mp_success=1`);

    } catch (e: any) {
        console.error("OAuth exception:", e);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/proveedor?mp_error=exception`);
    }
}