import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { slot_id, experience_id, user_name, user_email, people, total_price } = body;

        if (!slot_id || !experience_id || !user_name || !user_email || !people) {
            return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/lib/supabase/server");

        // Verificar que el slot existe y tiene cupos
        const { data: slot, error: slotError } = await supabaseAdmin
            .from("availability_slots")
            .select("id, capacity, booked_count")
            .eq("id", slot_id)
            .maybeSingle();

        if (slotError || !slot) {
            return NextResponse.json({ error: "El turno no existe." }, { status: 404 });
        }

        const available = slot.capacity - slot.booked_count;
        if (people > available) {
            return NextResponse.json({
                error: `Solo quedan ${available} lugar${available === 1 ? "" : "es"} disponibles.`
            }, { status: 409 });
        }

        // Crear la reserva
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from("bookings")
            .insert({
                experience_id,
                slot_id,
                user_name,
                user_email,
                people: Number(people),
                total_price: Number(total_price),
                status: "confirmed",
            })
            .select("id")
            .single();

        if (bookingError) {
            return NextResponse.json({ error: bookingError.message }, { status: 500 });
        }

        // Actualizar booked_count en el slot
        await supabaseAdmin
            .from("availability_slots")
            .update({ booked_count: slot.booked_count + Number(people) })
            .eq("id", slot_id);

        return NextResponse.json({ success: true, booking_id: booking.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message ?? "Error interno" }, { status: 500 });
    }
}