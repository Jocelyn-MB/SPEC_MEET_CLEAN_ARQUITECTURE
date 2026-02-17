import { PrismaClient } from "@prisma/client";

//Buscamos si ya existe en el objeto global (la memoria persitente de Node)
const globalForPrisma = global as unknown as {prisma: PrismaClient};

//2 si existe usala. si no, crea una nueva
export const prisma = globalForPrisma.prisma || new PrismaClient();

//verificamos que el entorno donde se esta trabajando sea el de produccion o el desarrollo para evitar demasiadas llamadas
//la conexion con supabase
if(process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
 