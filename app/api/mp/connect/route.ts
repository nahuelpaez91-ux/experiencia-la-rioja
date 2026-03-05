import { NextResponse } from "next/server";

export async function GET() {
    const clientId = process.env.MP_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/callback`;

    const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return NextResponse.redirect(authUrl);
}