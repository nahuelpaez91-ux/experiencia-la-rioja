import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

    if (path.startsWith("/admin")) {
        if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role !== "admin") return NextResponse.redirect(new URL("/", request.url));
    }

    if (path.startsWith("/proveedor")) {
        if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role !== "provider" && profile?.role !== "admin") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    if (path.startsWith("/mis-reservas")) {
        if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: ["/admin/:path*", "/proveedor/:path*", "/mis-reservas/:path*"],
};