// app/api/mp/save-token/route.ts
// El proveedor pega su Access Token de MP directamente
// Sin OAuth, sin Client Secret — funciona igual para el MVP

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { user_id, access_token } = await request.json();

        if (!user_id || !access_token) {
            return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
        }

        // Verificar que el token es válido consultando la API de MP
        const mpRes = await fetch("https://api.mercadopago.com/users/me", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!mpRes.ok) {
            return NextResponse.json(
                { error: "El token no es válido. Verificá que copiaste bien el Access Token de MP." },
                { status: 400 }
            );
        }

        const mpUser = await mpRes.json();

        // Guardar en el perfil del proveedor
        await supabaseAdmin
            .from("profiles")
            .update({
                mp_access_token: access_token,
                mp_user_id: String(mpUser.id),
                mp_connected_at: new Date().toISOString(),
            })
            .eq("id", user_id);

        return NextResponse.json({ ok: true, mp_user_id: mpUser.id });
    } catch (err) {
        console.error("Save token error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}