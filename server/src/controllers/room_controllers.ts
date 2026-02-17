import { Request, Response } from "express";
import { prisma } from '../config/prisma';
import { roomSchema } from "../utils/validation";

// * -------------------------------------------REGISTRAR NUEVAS SALAS--------------------------------------------

export const createRoom = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = roomSchema.safeParse(req.body);

        if(!validation.success){
            res.status(400).json(
                {error: "Datos de sala invalidos", 
                details: validation.error.format()
            });
            return;
        }
        const { name, wifi_ssid, wifi_pass, price_per_hour, status, ttlock_lock_id} = validation.data;

        const newRoom = await prisma.room.create({
            data: {
                name,
                wifi_ssid,
                wifi_pass,
                price_per_hour,
                ttlock_lock_id: ttlock_lock_id || null, // Si no viene, pon null
                status: status ?? "DISPONIBLE"
            }
        });
        res.status(201).json({
            message: "Sala creada con exito",
            room: newRoom
        })

    } catch(error){
        console.error(error);
        res.status(500).json({error: 'Error al crear la sala'});
    }
};

// * --------------------------------------OBTENER TODAS LAS SALAS REGISTRADAS------------------------

export const getRooms = async (req: Request, res: Response) : Promise<void> =>{
    try{
        const rooms = await prisma.room.findMany({
            where: {
                status: "DISPONIBLE"
            }
        });
        res.json(rooms);
    } catch(error){
        console.error(error);
        res.status(500).json({error: 'Error, No se pudo obtener las salas registrada'})
    }
};

// *--------------------------------------OBTENER SALA POR ID----------------------------------------

export const getRoomById = async (req: Request, res: Response) : Promise<void> =>{
    try{
        const {id} = req.params;

        const room = await prisma.room.findUnique({
            where: {id}
        });

        if(!room){
            res.status(404).json({error: "Sala no encontrada"});
            return;
        }

        res.json(room);
    } catch(error){
        res.status(500).json({error: "Error al Obtener la sala"});
    }
};

// * ----------------------------------ACTUALIZAR INFORMACION DE LA SALA--------------------------

export const updateRoom = async (req: Request, res: Response) : Promise<void> =>{
    try{
        const {id} = req.params;
        const validation = roomSchema.partial().safeParse(req.body);

        if(!validation.success){
            res.status(404).json({
                error: "Datos invalidos",
                details: validation.error.format(),
            });
            return;
        }
        const updateRoom = await prisma.room.update({
            where: {id},
            data: validation.data
        });

        res.json({
            message: "Sala actualizada exitosamente",
            room: updateRoom
        });
    } catch(error){
        res.status(404).json({error: "Sala no encontrada o error al actualizarla"});
    }
};

// * ------------------------------------ACUALIZACION DE ESTADO DE LA SALA----------------------------------------------------------

export const deleteRoom = async (req: Request, res: Response) : Promise<void>=>{
    try{
        const {id} = req.params;

        await prisma.room.delete({
            where: {id}
        });

        res.json({message: "Sala eliminada"});

    } catch(error){
        res.status(404).json({error : "Error al eliminar la sala"});
    } 
};