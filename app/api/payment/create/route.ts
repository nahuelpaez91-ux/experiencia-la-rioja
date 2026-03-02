// app/api/payment/create/route.ts
// Crea la preferencia de pago en MP usando el token del proveedor
// El split es automático: plataforma retiene el 15%, el 85% va al proveedor

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLATFORM_FEE_PCT = Number(process.env.MP_PLATFORM_FEE_PCT ?? 15) / 100;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { experience_id, slot_id, people, user_name, user_email } = body;

        if (!experience_id || !slot_id || !people || !user_name || !user_email) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        // ── Obtener experiencia + datos del proveedor ──
        const { data: experience, error: expError } = await supabaseAdmin
            .from("experiences")
            .select(`
        id, title, price_from, provider_id,
        profiles!provider_id (
          mp_access_token,
          mp_user_id,
          full_name
        )
      `)
            .eq("id", experience_id)
            .single();

        if (expError || !experience) {
            return NextResponse.json({ error: "Experiencia no encontrada" }, { status: 404 });
        }

        const provider = (experience as any).profiles;
        if (!provider?.mp_access_token) {
            return NextResponse.json(
                { error: "El proveedor aún no conectó su cuenta de Mercado Pago" },
                { status: 400 }
            );
        }

        // ── Verificar disponibilidad del slot ──
        const { data: slot } = await supabaseAdmin
            .from("availability_slots")
            .select("id, capacity, booked_count, date, time")
            .eq("id", slot_id)
            .single();

        if (!slot || slot.capacity - slot.booked_count < people) {
            return NextResponse.json({ error: "No hay suficiente disponibilidad para ese turno" }, { status: 400 });
        }

        // ── Calcular montos ──
        const pricePerPerson = Number(experience.price_from);
        const totalPrice = pricePerPerson * people;
        const platformFee = Math.round(totalPrice * PLATFORM_FEE_PCT);
        const providerAmount = totalPrice - platformFee;

        // ── Crear reserva en estado pendiente ──
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from("bookings")
            .insert({
                experience_id,
                slot_id,
                people,
                user_name,
                user_email,
                total_price: totalPrice,
                platform_fee: platformFee,
                provider_amount: providerAmount,
                status: "pending",
                payment_status: "pending",
            })
            .select()
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: "Error creando la reserva" }, { status: 500 });
        }

        const base = process.env.NEXT_PUBLIC_BASE_URL!;

        // ── Crear preferencia en MP usando el token del PROVEEDOR ──
        // El marketplace_fee es lo que la plataforma retiene automáticamente
        const prefBody = {
            items: [
                {
                    id: experience.id,
                    title: experience.title,
                    description: `${people} persona${people > 1 ? "s" : ""} · ${slot.date} ${slot.time.slice(0, 5)}`,
                    quantity: 1,
                    unit_price: totalPrice,
                    currency_id: "ARS",
                },
            ],
            marketplace_fee: platformFee,
            payer: {
                name: user_name,
                email: user_email,
            },
            back_urls: {
                success: `${base}/pago/exitoso?booking_id=${booking.id}`,
                failure: `${base}/pago/fallido?booking_id=${booking.id}`,
                pending: `${base}/pago/pendiente?booking_id=${booking.id}`,
            },
            auto_return: "approved",
            notification_url: `${base}/api/payment/webhook`,
            external_reference: booking.id,
            statement_descriptor: "EXPERIENCIA LA RIOJA",
            expires: true,
            expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // expira en 30 min
        };

        const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${provider.mp_access_token}`,
            },
            body: JSON.stringify(prefBody),
        });

        const prefData = await mpRes.json();

        if (!prefData.id) {
            console.error("MP preference error:", prefData);
            // Eliminar la reserva pendiente si MP falla
            await supabaseAdmin.from("bookings").delete().eq("id", booking.id);
            return NextResponse.json({ error: "Error al crear el pago con Mercado Pago" }, { status: 500 });
        }

        // ── Guardar el preference_id en la reserva ──
        await supabaseAdmin
            .from("bookings")
            .update({ mp_preference_id: prefData.id })
            .eq("id", booking.id);

        return NextResponse.json({
            booking_id: booking.id,
            init_point: prefData.init_point,           // URL de checkout para producción
            sandbox_init_point: prefData.sandbox_init_point, // URL para testing
        });
    } catch (err) {
        console.error("Payment create error:", err);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}