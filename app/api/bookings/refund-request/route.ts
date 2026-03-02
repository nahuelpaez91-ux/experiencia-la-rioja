// app/api/bookings/refund-request/route.ts
// El usuario puede solicitar reembolso por disputa (experiencia no se realizó,
// fue diferente a lo prometido, etc.) hasta 24hs después de la experiencia

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { booking_id, reason, evidence_url, user_email } = await request.json();

        if (!booking_id || !reason || !user_email) {
            return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
        }

        // Verificar que la reserva existe y pertenece al email
        const { data: booking } = await supabaseAdmin
            .from("bookings")
            .select("id, status, payment_status, user_email, slot:slot_id(date)")
            .eq("id", booking_id)
            .eq("user_email", user_email)
            .single();

        if (!booking) {
            return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
        }

        if (booking.payment_status !== "paid") {
            return NextResponse.json({ error: "Solo se pueden reclamar reservas pagas" }, { status: 400 });
        }

        // Verificar que no hayan pasado más de 24hs desde la experiencia
        const slotDate = (booking as any).slot?.date;
        if (slotDate) {
            const expDate = new Date(slotDate + "T23:59:00");
            const hoursSince = (Date.now() - expDate.getTime()) / (1000 * 60 * 60);
            if (hoursSince > 24) {
                return NextResponse.json(
                    { error: "El plazo para reclamar es de 24hs después de la experiencia" },
                    { status: 400 }
                );
            }
        }

        // Verificar que no exista ya una solicitud
        const { data: existing } = await supabaseAdmin
            .from("refund_requests")
            .select("id")
            .eq("booking_id", booking_id)
            .single();

        if (existing) {
            return NextResponse.json({ error: "Ya existe una solicitud de reembolso para esta reserva" }, { status: 400 });
        }

        // Crear la solicitud
        const { data: refundReq } = await supabaseAdmin
            .from("refund_requests")
            .insert({
                booking_id,
                reason,
                evidence_url: evidence_url ?? null,
                status: "pending",
            })
            .select()
            .single();

        // TODO: Notificar al admin por email

        return NextResponse.json({
            ok: true,
            refund_request_id: refundReq?.id,
            message: "Tu solicitud fue recibida. El equipo la revisará en las próximas 48hs.",
        });
    } catch (err) {
        console.error("Refund request error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}