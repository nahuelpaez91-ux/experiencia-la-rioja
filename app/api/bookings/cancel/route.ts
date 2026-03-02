// app/api/bookings/cancel/route.ts
// Maneja cancelaciones con la política de reembolso:
// - Más de 7 días antes → 100%
// - Entre 7 días y 48hs → 50%
// - Menos de 48hs → 0%
// - Cancelación por proveedor → siempre 100%
// - No-show del proveedor → 100%

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function calcRefundPct(slotDate: string, cancelledBy: string): number {
    if (cancelledBy === "provider" || cancelledBy === "admin") return 100;

    const now = new Date();
    const expDate = new Date(slotDate + "T12:00:00");
    const hoursUntil = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil > 7 * 24) return 100; // Más de 7 días
    if (hoursUntil > 48) return 50;       // Entre 7 días y 48hs
    return 0;                              // Menos de 48hs
}

async function refundMP(
    mpPaymentId: string,
    providerAccessToken: string,
    amount?: number
): Promise<boolean> {
    const body = amount ? JSON.stringify({ amount }) : "{}";
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}/refunds`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${providerAccessToken}`,
        },
        body,
    });
    const data = await res.json();
    return res.ok && (data.status === "approved" || data.id);
}

export async function POST(request: NextRequest) {
    try {
        const { booking_id, cancelled_by, reason } = await request.json();

        if (!booking_id || !cancelled_by) {
            return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
        }

        // ── Obtener la reserva con todos los datos necesarios ──
        const { data: booking } = await supabaseAdmin
            .from("bookings")
            .select(`
        id, status, payment_status, total_price,
        mp_payment_id, slot_id, people,
        slot:slot_id (date, time),
        experience:experience_id (
          provider_id,
          profiles!provider_id (mp_access_token)
        )
      `)
            .eq("id", booking_id)
            .single();

        if (!booking) {
            return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
        }

        if (booking.status === "cancelled") {
            return NextResponse.json({ error: "La reserva ya está cancelada" }, { status: 400 });
        }

        const slot = (booking as any).slot;
        const provider = (booking as any).experience?.profiles;
        const slotDate = slot?.date;

        // ── Calcular reembolso ──
        const refundPct = calcRefundPct(slotDate, cancelled_by);
        const refundAmount = Math.round((booking.total_price * refundPct) / 100);

        let paymentStatus: string = booking.payment_status;
        let refundOk = true;

        // ── Procesar reembolso en MP si el pago fue procesado ──
        if (booking.payment_status === "paid" && booking.mp_payment_id && provider?.mp_access_token) {
            if (refundPct === 100) {
                refundOk = await refundMP(booking.mp_payment_id, provider.mp_access_token);
                paymentStatus = refundOk ? "refunded" : "paid";
            } else if (refundPct === 50) {
                refundOk = await refundMP(booking.mp_payment_id, provider.mp_access_token, refundAmount);
                paymentStatus = refundOk ? "partially_refunded" : "paid";
            }
            // Si refundPct === 0, no se hace nada en MP
        }

        // ── Actualizar la reserva ──
        await supabaseAdmin
            .from("bookings")
            .update({
                status: "cancelled",
                payment_status: paymentStatus,
                cancelled_by,
                cancelled_at: new Date().toISOString(),
                refund_amount: refundAmount,
                refund_reason: reason ?? null,
            })
            .eq("id", booking_id);

        // ── Liberar cupos del slot ──
        if (booking.payment_status === "paid") {
            await supabaseAdmin.rpc("increment_booked_count", {
                p_slot_id: booking.slot_id,
                p_amount: -booking.people, // negativo para restar
            });
        }

        return NextResponse.json({
            ok: true,
            refund_pct: refundPct,
            refund_amount: refundAmount,
            refund_processed: refundOk,
            message:
                refundPct === 100
                    ? "Reserva cancelada. Reembolso completo procesado."
                    : refundPct === 50
                        ? "Reserva cancelada. Reembolso del 50% procesado."
                        : "Reserva cancelada. No corresponde reembolso según la política.",
        });
    } catch (err) {
        console.error("Cancel booking error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}