import { Request, Response } from 'express';
import { prisma } from "../config/prisma";

export const getUsersWithReservations = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: {in: ["CLIENT", "ADMIN"]}
            },
            include: {
                reservations: true // Incluimos sus reservas (nombre según tu schema.prisma)
            }
        });

        // Formateamos la respuesta para que el frontend reciba "reservations" en plural
        const formattedUsers = users.map(user => ({
            ...user,
            reservations: user.reservations // Mapeo para consistencia en el frontend
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error("Error al obtener usuarios con reservas:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};