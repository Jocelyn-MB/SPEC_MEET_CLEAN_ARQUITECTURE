import nodemailer from 'nodemailer';

// ============================================================
// CONFIGURACIÓN DEL TRANSPORTER
// ============================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============================================================
// TIPOS
// ============================================================
interface ReservationEmailData {
  userName: string;
  userEmail: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  accessCode: string;
  totalPaid: number;
  hours: number;
  roomName: string;
  address: string;
}

// ============================================================
// EMAIL: CONFIRMACIÓN DE RESERVA
// ============================================================
export const sendConfirmationEmail = async (data: ReservationEmailData): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #111; }
        .header { background: #000; padding: 40px 30px; text-align: center; border-bottom: 1px solid #333; }
        .header img { height: 40px; }
        .header h1 { color: #fff; font-size: 24px; margin: 20px 0 0; font-weight: 300; letter-spacing: 4px; }
        .body { padding: 40px 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; }
        .info-card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a2a2a; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #888; font-size: 14px; }
        .info-value { color: #fff; font-size: 14px; font-weight: 500; }
        .access-code { background: #1a1a1a; border: 2px solid #555; border-radius: 12px; padding: 30px; text-align: center; margin: 24px 0; }
        .access-code h2 { color: #888; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 16px; }
        .code { font-size: 48px; font-weight: 700; letter-spacing: 12px; color: #fff; font-family: monospace; }
        .warning { background: #1a1400; border: 1px solid #554; border-radius: 8px; padding: 16px; font-size: 13px; color: #bba; margin-top: 16px; }
        .footer { background: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #222; }
        .footer p { color: #555; font-size: 12px; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SPEC<span style="color:#888">.</span>MEET</h1>
        </div>
        <div class="body">
          <p class="greeting">Hola, <strong>${data.userName}</strong> 👋</p>
          <p style="color:#aaa">Tu reserva ha sido confirmada y el pago procesado exitosamente. A continuación encontrarás todos los detalles.</p>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">📍 Sala</span>
              <span class="info-value">${data.roomName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">📅 Fecha</span>
              <span class="info-value">${data.reservationDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">⏰ Horario</span>
              <span class="info-value">${data.startTime} – ${data.endTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">⏱️ Duración</span>
              <span class="info-value">${data.hours} hora${data.hours !== 1 ? 's' : ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">💳 Total pagado</span>
              <span class="info-value">$${data.totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN <small style="color:#666">(IVA incluido)</small></span>
            </div>
          </div>

          <div class="access-code">
            <h2>🔐 Tu Código de Acceso</h2>
            <div class="code">${data.accessCode}</div>
            <p style="color:#666; font-size:13px; margin-top:16px">Válido únicamente para el período de tu reserva</p>
          </div>

          <div class="warning">
            ⚠️ <strong>Importante:</strong> Este código es personal e intransferible. No lo compartas. Es válido solo para el horario de tu reserva. Ingresa el código en el panel de la puerta al llegar.
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #111; border-radius: 8px; border: 1px solid #222;">
            <h3 style="color:#fff; margin:0 0 12px; font-size:14px">📍 Ubicación</h3>
            <p style="color:#aaa; font-size:14px; margin:0">${data.address}</p>
          </div>
        </div>
        <div class="footer">
          <p>SPEC.MEET — Salas de juntas inteligentes</p>
          <p>¿Tienes preguntas? Escríbenos a <a href="mailto:info@spec.meet" style="color:#666">info@spec.meet</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'SPEC.MEET <noreply@spec.meet>',
    to: data.userEmail,
    subject: `✅ Reserva Confirmada — ${data.reservationDate} ${data.startTime}`,
    html,
  });

  console.log(`📧 Email de confirmación enviado a ${data.userEmail}`);
};

// ============================================================
// EMAIL: RECORDATORIO
// ============================================================
export const sendReminderEmail = async (
  userEmail: string,
  userName: string,
  reservationDate: string,
  startTime: string,
  accessCode: string,
  minutesBefore: number
): Promise<void> => {
  const subject =
    minutesBefore >= 1440
      ? `⏰ Recordatorio: Tu reserva mañana a las ${startTime}`
      : minutesBefore >= 60
      ? `⏰ Tu reserva en 1 hora — ${startTime}`
      : `🔔 Tu reserva en 10 minutos — ${startTime}`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px; max-width: 600px; margin: 0 auto;">
      <h1 style="letter-spacing: 4px; font-weight: 300;">SPEC<span style="color:#888">.</span>MEET</h1>
      <h2 style="color: #aaa; font-weight: 400;">${subject}</h2>
      <p>Hola, <strong>${userName}</strong></p>
      <p style="color: #aaa;">Este es un recordatorio de tu próxima reserva.</p>
      <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 24px; margin: 20px 0;">
        <p>📅 <strong>Fecha:</strong> ${reservationDate}</p>
        <p>⏰ <strong>Hora:</strong> ${startTime}</p>
        <p style="font-size: 24px; text-align: center; letter-spacing: 8px; font-family: monospace; font-weight: bold;">🔐 ${accessCode}</p>
      </div>
      <p style="color: #555; font-size: 12px;">SPEC.MEET — info@spec.meet</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'SPEC.MEET <noreply@spec.meet>',
    to: userEmail,
    subject,
    html,
  });

  console.log(`📧 Recordatorio (${minutesBefore}min) enviado a ${userEmail}`);
};

// ============================================================
// EMAIL: CANCELACIÓN
// ============================================================
export const sendCancellationEmail = async (
  userEmail: string,
  userName: string,
  reservationDate: string,
  startTime: string,
  refundAmount?: number
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px; max-width: 600px; margin: 0 auto;">
      <h1 style="letter-spacing: 4px; font-weight: 300;">SPEC<span style="color:#888">.</span>MEET</h1>
      <h2 style="color: #e55;">❌ Reserva Cancelada</h2>
      <p>Hola, <strong>${userName}</strong></p>
      <p style="color: #aaa;">Tu reserva del <strong>${reservationDate}</strong> a las <strong>${startTime}</strong> ha sido cancelada.</p>
      ${refundAmount && refundAmount > 0
        ? `<div style="background: #0a2a0a; border: 1px solid #2a5a2a; border-radius: 8px; padding: 16px; margin: 20px 0;">
             <p style="color: #4a4; margin: 0;">💰 <strong>Reembolso:</strong> $${refundAmount.toFixed(2)} MXN — Será procesado en 5-10 días hábiles.</p>
           </div>`
        : '<p style="color: #888;">No aplica reembolso según la política de cancelación.</p>'
      }
      <p style="color: #555; font-size: 12px;">SPEC.MEET — info@spec.meet</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'SPEC.MEET <noreply@spec.meet>',
    to: userEmail,
    subject: `❌ Reserva Cancelada — ${reservationDate} ${startTime}`,
    html,
  });
};

// ============================================================
// EMAIL: RECUPERACIÓN DE CONTRASEÑA
// ============================================================
export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  resetUrl: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px; max-width: 600px; margin: 0 auto;">
      <h1 style="letter-spacing: 4px; font-weight: 300;">SPEC<span style="color:#888">.</span>MEET</h1>
      <h2 style="color: #aaa; font-weight: 400;">Restablecer Contraseña</h2>
      <p>Hola, <strong>${userName}</strong></p>
      <p style="color: #aaa;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #333; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; display: inline-block;">
          Restablecer Contraseña
        </a>
      </div>
      <p style="color: #666; font-size: 13px;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
      <p style="color: #555; font-size: 12px;">SPEC.MEET — info@spec.meet</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'SPEC.MEET <noreply@spec.meet>',
    to: userEmail,
    subject: '🔐 Restablecer tu contraseña — SPEC.MEET',
    html,
  });
};