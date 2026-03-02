// app/api/payment/webhook/route.ts
// MP llama a esta URL cuando hay un evento de pago
// Confirma la reserva, actualiza el slot y envía emails

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // MP envía diferentes tipos de notificaciones
        // Solo nos interesan los eventos de tipo "payment"
        if (body.type !== "payment") {
            return NextResponse.json({ ok: true });
        }

        const paymentId = body.data?.id;
        if (!paymentId) {
            return NextResponse.json({ ok: true });
        }

        // ── Consultar el pago en MP con el token de la plataforma ──
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
        });
        const payment = await mpRes.json();

        const bookingId = payment.external_reference;
        if (!bookingId) {
            return NextResponse.json({ ok: true });
        }

        // ── Procesar según el estado del pago ──
        if (payment.status === "approved") {
            // Obtener la reserva para saber el slot y las personas
            const { data: booking } = await supabaseAdmin
                .from("bookings")
                .select("id, slot_id, people, payment_status")
                .eq("id", bookingId)
                .single();

            if (!booking || booking.payment_status === "paid") {
                // Ya procesado o no existe
                return NextResponse.json({ ok: true });
            }

            // Confirmar la reserva
            await supabaseAdmin
                .from("bookings")
                .update({
                    status: "confirmed",
                    payment_status: "paid",
                    mp_payment_id: String(paymentId),
                })
                .eq("id", bookingId);

            // Incrementar el booked_count del slot
            await supabaseAdmin.rpc("increment_booked_count", {
                p_slot_id: booking.slot_id,
                p_amount: booking.people,
            });

            // TODO: Enviar email de confirmación al usuario y al proveedor
            // await sendConfirmationEmail(booking);

        } else if (payment.status === "rejected" || payment.status === "cancelled") {
            await supabaseAdmin
                .from("bookings")
                .update({
                    status: "cancelled",
                    payment_status: "failed",
                    mp_payment_id: String(paymentId),
                })
                .eq("id", bookingId);
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("Webhook error:", err);
        // Siempre devolver 200 para que MP no reintente indefinidamente
        return NextResponse.json({ ok: true });
    }
}

// Necesitás crear esta función en Supabase SQL:
// CREATE OR REPLACE FUNCTION increment_booked_count(p_slot_id UUID, p_amount INT)
// RETURNS VOID LANGUAGE plpgsql AS $$
// BEGIN
//   UPDATE availability_slots
//   SET booked_count = booked_count + p_amount
//   WHERE id = p_slot_id;
// END;
// $$;