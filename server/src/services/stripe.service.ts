import Stripe from "stripe";

// inicializacion de stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * crea una intencion de pago (PaymentIntent)
 * Qparam amount Monto de PESOS
 * @param reservationId EL ID de la reserva para saber que estamos cobrando
 */

export const createPaymentIntent = async (
    amount: number, 
    reservationId: string, 
    userEmail: string
) => {
    // Stripe cobra en CENTAVOS (multiplicar por 100)
    // Ejemplo: $200.00 MXN -> 20000 centavos
    const amountInCents = Math.round(amount * 100);

    return await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'mxn',
        automatic_payment_methods: {
            enabled: true,
        },
        // 👇 ESTA ES LA CLAVE PARA EL WEBHOOK 👇
        metadata: {
            reservationId: reservationId, // Aquí pegamos el ID para leerlo después
            userEmail: userEmail
        }
    });
};
/**
 * Valida que el aviso del Webhook venga realmente de Stripe
 */
export const constructEvent = (payload: any, signature: string) => {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error("Falta configurar STRIPE_WEBHOOK_SECRET en .env");
    }
    return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
    );
};