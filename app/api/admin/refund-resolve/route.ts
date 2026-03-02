// app/api/admin/refund-resolve/route.ts
// Solo admin puede aprobar o rechazar solicitudes de reembolso

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function refundMP(
    mpPaymentId: string,
    accessToken: string,
    amount?: number
): Promise<boolean> {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}/refunds`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: amount ? JSON.stringify({ amount }) : "{}",
    });
    const data = await res.json();
    return res.ok && (data.status === "approved" || data.id);
}

export async function POST(request: NextRequest) {
    try {
        const { refund_request_id, action, admin_note, refund_pct } = await request.json();
        // action: "approve" | "reject"
        // refund_pct: 100 | 50 | 0 (solo si action === "approve")

        if (!refund_request_id || !action) {
            return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
        }

        // Verificar que el usuario es admin (validar sesión)
        // TODO: agregar validación real de sesión admin

        // Obtener la solicitud con todos los datos
        const { data: refReq } = await supabaseAdmin
            .from("refund_requests")
            .select(`
        id, status, booking_id,
        booking:booking_id (
          id, total_price, mp_payment_id, payment_status, people, slot_id,
          experience:experience_id (
            profiles!provider_id (mp_access_token)
          )
        )
      `)
            .eq("id", refund_request_id)
            .single();

        if (!refReq) {
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
        }

        if (refReq.status !== "pending") {
            return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 400 });
        }

        const booking = (refReq as any).booking;
        const provider = booking?.experience?.profiles;

        if (action === "reject") {
            await supabaseAdmin
                .from("refund_requests")
                .update({ status: "rejected", admin_note, resolved_at: new Date().toISOString() })
                .eq("id", refund_request_id);

            return NextResponse.json({ ok: true, message: "Solicitud rechazada." });
        }

        // action === "approve"
        const pct = refund_pct ?? 100;
        const refundAmount = Math.round((booking.total_price * pct) / 100);
        let paymentStatus = booking.payment_status;
        let refundOk = true;

        if (booking.mp_payment_id && provider?.mp_access_token && pct > 0) {
            const amountArg = pct === 100 ? undefined : refundAmount;
            refundOk = await refundMP(booking.mp_payment_id, provider.mp_access_token, amountArg);
            paymentStatus = pct === 100 ? "refunded" : "partially_refunded";
        }

        // Actualizar reserva
        await supabaseAdmin
            .from("bookings")
            .update({
                payment_status: paymentStatus,
                refund_amount: refundAmount,
                refund_reason: "Aprobado por admin",
                cancelled_by: "admin",
                cancelled_at: new Date().toISOString(),
                status: "cancelled",
            })
            .eq("id", booking.id);

        // Liberar cupos
        await supabaseAdmin.rpc("increment_booked_count", {
            p_slot_id: booking.slot_id,
            p_amount: -booking.people,
        });

        // Actualizar solicitud
        await supabaseAdmin
            .from("refund_requests")
            .update({
                status: "approved",
                refund_pct: pct,
                admin_note,
                resolved_at: new Date().toISOString(),
            })
            .eq("id", refund_request_id);

        return NextResponse.json({
            ok: true,
            refund_processed: refundOk,
            refund_amount: refundAmount,
            message: `Reembolso del ${pct}% procesado correctamente.`,
        });
    } catch (err) {
        console.error("Refund resolve error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}