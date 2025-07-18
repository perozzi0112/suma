import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('BODY RECIBIDO EN API:', body);
  try {
    const { email, name, date, time, doctor, specialty, services, consultationFee, totalPrice } = body;
    if (!email || !name || !date || !time || !doctor) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Formatear servicios adicionales
    let servicesHtml = '';
    type Service = { name: string; price?: number };
    if (Array.isArray(services) && services.length > 0) {
      servicesHtml = `<ul style="margin: 0; padding-left: 18px;">` +
        (services as Service[]).
          map((s: Service) => `<li>${s.name}${s.price ? ` ($${Number(s.price).toFixed(2)})` : ''}</li>`).join('') +
        `</ul>`;
    } else {
      servicesHtml = '<span style="color: #888;">Ninguno</span>';
    }

    await transporter.sendMail({
      from: `Citas Suma <${GMAIL_USER}>`,
      to: email,
      subject: 'Confirmación de tu cita en Suma',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e0e7ef; border-radius: 12px; overflow: hidden; background: #f8fafc;">
          <div style="background: linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%); padding: 28px 0; text-align: center;">
            <span style="font-size: 2.5rem; color: #fff; font-weight: bold; letter-spacing: 2px;">SUMA</span>
          </div>
          <div style="padding: 36px 28px 28px 28px; background: #fff;">
            <h2 style="color: #0ea5e9; margin-bottom: 18px; font-size: 1.5rem;">¡Tu cita ha sido agendada!</h2>
            <p style="color: #222; margin-bottom: 18px; font-size: 1.1rem;">Hola <b>${name}</b>,</p>
            <p style="color: #222; margin-bottom: 22px;">Aquí tienes los detalles de tu cita:</p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
              <table style="width: 100%; font-size: 1rem; color: #222;">
                <tr><td style="padding: 6px 0;"><b>Médico:</b></td><td style="padding: 6px 0;">Dr@: ${doctor}</td></tr>
                <tr><td style="padding: 6px 0;"><b>Especialidad:</b></td><td style="padding: 6px 0;">${specialty || '-'}</td></tr>
                <tr><td style="padding: 6px 0;"><b>Fecha:</b></td><td style="padding: 6px 0;">${formatDate(date)}</td></tr>
                <tr><td style="padding: 6px 0;"><b>Hora:</b></td><td style="padding: 6px 0;">${time}</td></tr>
                <tr><td style="padding: 6px 0;"><b>Tarifa de Consulta:</b></td><td style="padding: 6px 0;">${typeof consultationFee !== 'undefined' ? `$${Number(consultationFee).toFixed(2)}` : '-'}</td></tr>
                <tr><td style="padding: 6px 0;"><b>Total Pagado:</b></td><td style="padding: 6px 0;">${typeof totalPrice !== 'undefined' ? `$${Number(totalPrice).toFixed(2)}` : '-'}</td></tr>
              </table>
            </div>
            <div style="margin-bottom: 18px;">
              <b>Servicios Adicionales:</b>
              ${servicesHtml}
            </div>
            <p style="color: #0ea5e9; font-size: 1.1rem; margin-bottom: 18px; text-align: center;"><b>¡Te esperamos con alegría!</b></p>
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="display: inline-block; background: #0ea5e9; color: #fff; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 17px; letter-spacing: 1px;">Recuerda llegar 10 minutos antes</span>
            </div>
            <p style="color: #222; font-size: 1rem; margin-bottom: 18px; text-align: center;">Cada vez son más los venezolanos que se <b>SUMAN</b> a una mejor salud.<br>¡Gracias por ser parte de nuestra comunidad!</p>
            <p style="color: #666; font-size: 13px; text-align: center;">Si tienes alguna duda o necesitas reprogramar, puedes responder a este correo o contactarnos desde la app.</p>
          </div>
          <div style="background: #f1f5f9; color: #888; text-align: center; font-size: 12px; padding: 16px;">&copy; ${new Date().getFullYear()} Suma. Todos los derechos reservados.</div>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    let message = 'Error enviando correo';
    if (error instanceof Error) message = error.message;
    console.error('Error enviando correo de cita:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 