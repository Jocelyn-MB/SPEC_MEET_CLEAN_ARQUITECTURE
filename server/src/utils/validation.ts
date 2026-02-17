import {email, z} from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos  2 caracteres"),
    email: z.string().email("Formato de email invalido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const loginSchema = z.object ({
    email: z.string().email(),
    password: z.string(),
})

export const roomSchema = z.object({
  name: z.string().min(3, "El nombre de la sala es muy corto"),
  wifi_ssid: z.string().min(1, "El nombre del WiFi (SSID) es obligatorio"),
  wifi_pass: z.string().min(1, "La contraseña del WiFi es obligatoria"),
  price_per_hour: z.number().positive("El precio debe ser un número positivo"),
  status: z.string().optional(),
  ttlock_lock_id: z.string().optional() // <--- ¡ASEGÚRATE DE TENER ESTO!
})

export const reservationSchema = z.object({
  roomId: z.string().uuid({message: "ID de sala invalido"}),
  startTime: z.coerce.date({message: "Fecha de inicio invalida"}),
  endTime: z.coerce.date({message: "Fecha de fin invalida"}),

  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Debes acepta los terminos y condiciones"
  }),

  acceptedVersion: z.string().min(1, "La version de los terminos es obligatoria")

}).refine((data) => {
  return data.startTime > new Date(Date.now() - 60000);
}, {
  message: "No puedes hacer una reserva em el pasado",
  path: ["startTime"]
}).refine((data)=>{
  return data.endTime > data.startTime;
}, {
  message: "la hora de fin debe ser despues de la hora de inicio",
  path: ["endTime"]
});