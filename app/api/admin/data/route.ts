import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
    try {
        const [
            { data: users, count: usersCount },
            { data: experiences, count: experiencesCount },
            { data: bookings, count: bookingsCount },
            { data: reviews, count: reviewsCount },
        ] = await Promise.all([
            supabaseAdmin
                .from("profiles")
                .select("id, email, full_name, role, created_at", { count: "exact" })
                .order("created_at", { ascending: false })
                .limit(100),
            supabaseAdmin
                .from("experiences")
                .select("id, title, location, category, price_from, is_published, is_featured, created_at, provider_id", { count: "exact" })
                .order("created_at", { ascending: false })
                .limit(100),
            supabaseAdmin
                .from("bookings")
                .select("id, experience_id, user_id, status, people, created_at, slot_id", { count: "exact" })
                .order("created_at", { ascending: false })
                .limit(100),
            supabaseAdmin
                .from("reviews")
                .select("id, experience_id, user_name, rating, comment, created_at", { count: "exact" })
                .order("created_at", { ascending: false })
                .limit(50),
        ]);

        const stats = {
            users: usersCount ?? 0,
            experiences: experiencesCount ?? 0,
            bookings: bookingsCount ?? 0,
            reviews: reviewsCount ?? 0,
            publishedExperiences: experiences?.filter((e) => e.is_published).length ?? 0,
            pendingExperiences: experiences?.filter((e) => !e.is_published).length ?? 0,
            providers: users?.filter((u) => u.role === "provider").length ?? 0,
            admins: users?.filter((u) => u.role === "admin").length ?? 0,
        };

        return NextResponse.json({
            stats,
            users: users ?? [],
            experiences: experiences ?? [],
            bookings: bookings ?? [],
            reviews: reviews ?? [],
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}