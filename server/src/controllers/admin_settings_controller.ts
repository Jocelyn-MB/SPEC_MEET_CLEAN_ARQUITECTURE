import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// ============================================================
// PRECIOS
// ============================================================
export const getPricingSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const [config, packages, room] = await Promise.all([
      prisma.businessConfig.findUnique({ where: { id: 1 } }),
      prisma.pricingPackage.findMany({ where: { isActive: true }, orderBy: { hours: 'asc' } }),
      prisma.room.findFirst(),
    ]);

    res.json({
      pricePerHour: Number(room?.price_per_hour ?? config?.pricePerHour ?? 200),
      ivaRate: Number(config?.ivaRate ?? 0.16),
      packages: packages.map(p => ({
        id: p.id, name: p.name, hours: p.hours,
        price: Number(p.price), discount: p.discount,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener precios' });
  }
};

export const updatePricingSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    const { pricePerHour, packages } = req.body;

    if (pricePerHour) {
      await prisma.room.updateMany({ data: { price_per_hour: pricePerHour } });
      await prisma.businessConfig.update({ where: { id: 1 }, data: { pricePerHour } });
    }

    if (packages && Array.isArray(packages)) {
      await prisma.pricingPackage.deleteMany({});
      if (packages.length > 0) {
        await prisma.pricingPackage.createMany({
          data: packages.map((pkg: any) => ({
            name: pkg.name, hours: pkg.hours,
            price: pkg.price, discount: pkg.discount ?? 0, isActive: true,
          })),
        });
      }
    }

    res.json({ message: 'Configuración de precios guardada correctamente' });
  } catch (error) {
    console.error('Error actualizando precios:', error);
    res.status(500).json({ error: 'Error al guardar precios' });
  }
};

// ============================================================
// UBICACIÓN Y HORARIOS
// ============================================================
export const getLocationSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const [config, room] = await Promise.all([
      prisma.businessConfig.findUnique({ where: { id: 1 } }),
      prisma.room.findFirst(),
    ]);

    res.json({
      name:               config?.locationName ?? '',
      address:            config?.address ?? '',
      openingHours:       config?.openingHours ?? {},
      capacity:           room?.capacity ?? 8,
      accessInstructions: config?.accessInstructions ?? '',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ubicación' });
  }
};

export const updateLocationSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    const { name, address, openingHours, capacity, accessInstructions } = req.body;

    await prisma.businessConfig.upsert({
      where: { id: 1 },
      update:  { locationName: name, address, openingHours, accessInstructions },
      create:  {
        id: 1, locationName: name, address, openingHours,
        accessInstructions, refundFullHours: 24, refundPartialHours: 12,
        refundPartialPct: 50, pricePerHour: 200,
      },
    });

    if (capacity) {
      await prisma.room.updateMany({ data: { capacity: Number(capacity) } });
    }

    res.json({ message: 'Configuración de ubicación guardada correctamente' });
  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    res.status(500).json({ error: 'Error al guardar ubicación' });
  }
};

// ============================================================
// TÉRMINOS Y CONDICIONES DINÁMICOS
// ============================================================
export const getTermsSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const [activeTerms, config, room] = await Promise.all([
      prisma.termsConfig.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
      prisma.businessConfig.findUnique({ where: { id: 1 } }),
      prisma.room.findFirst(),
    ]);

    if (!activeTerms) {
      res.status(404).json({ error: 'No hay términos configurados' });
      return;
    }

    // Variables dinámicas para la plantilla
    const variables: Record<string, string> = {
      version:                    activeTerms.version,
      fecha_vigencia:             activeTerms.createdAt.toLocaleDateString('es-MX'),
      direccion:                  config?.address ?? 'Por definir',
      capacidad:                  String(room?.capacity ?? 8),
      precio_hora:                Number(config?.pricePerHour ?? 200).toFixed(2),
      iva:                        String(Math.round(Number(config?.ivaRate ?? 0.16) * 100)),
      horas_reembolso_completo:   String(config?.refundFullHours ?? 24),
      horas_reembolso_parcial:    String(config?.refundPartialHours ?? 12),
      porcentaje_reembolso_parcial: String(config?.refundPartialPct ?? 50),
      minutos_gracia:             String(config?.gracePeriodMin ?? 15),
      minutos_limpieza:           String(config?.cleaningMinutes ?? 30),
    };

    res.json({
      terms: {
        version:          activeTerms.version,
        template:         activeTerms.templateContent,
        additionalClauses: activeTerms.additionalClauses,
        privacyOptions:   activeTerms.privacyOptions,
      },
      variables, // para el editor del admin
    });
  } catch (error) {
    console.error('Error obteniendo términos:', error);
    res.status(500).json({ error: 'Error al obtener términos' });
  }
};

export const updateTermsSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    const { template, additionalClauses, privacyOptions } = req.body;

    // Desactivar términos anteriores
    await prisma.termsConfig.updateMany({ where: { isActive: true }, data: { isActive: false } });

    // Generar nueva versión
    const lastTerms = await prisma.termsConfig.findFirst({ orderBy: { createdAt: 'desc' } });
    const versionParts = (lastTerms?.version ?? '1.0.0').split('.').map(Number);
    versionParts[2] = (versionParts[2] ?? 0) + 1;
    const newVersion = versionParts.join('.');

    await prisma.termsConfig.create({
      data: {
        version: newVersion,
        isActive: true,
        templateContent: template,
        additionalClauses,
        privacyOptions: privacyOptions ?? {},
        createdBy: req.user?.userId,
      },
    });

    res.json({ message: 'Términos y condiciones actualizados', version: newVersion });
  } catch (error) {
    console.error('Error actualizando términos:', error);
    res.status(500).json({ error: 'Error al guardar términos' });
  }
};

// ============================================================
// WIFI
// ============================================================
export const getWifiSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await prisma.room.findFirst();
    res.json({ ssid: room?.wifi_ssid ?? '', password: room?.wifi_pass ?? '' });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener Wi-Fi' });
  }
};

export const updateWifiSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    const { ssid, password } = req.body;
    await prisma.room.updateMany({ data: { wifi_ssid: ssid, wifi_pass: password } });
    res.json({ message: 'Configuración Wi-Fi actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar Wi-Fi' });
  }
};

// ============================================================
// POLÍTICAS OPERACIONALES
// ============================================================
export const getOperationalSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await prisma.businessConfig.findUnique({ where: { id: 1 } });
    res.json({
      refundFullHours:    config?.refundFullHours    ?? 24,
      refundPartialHours: config?.refundPartialHours ?? 12,
      refundPartialPct:   config?.refundPartialPct   ?? 50,
      cleaningMinutes:    config?.cleaningMinutes    ?? 30,
      gracePeriodMin:     config?.gracePeriodMin     ?? 15,
      minBookingHours:    config?.minBookingHours    ?? 1,
      maxBookingHours:    config?.maxBookingHours    ?? 8,
      maxAdvanceDays:     config?.maxAdvanceDays     ?? 60,
      damageChargeMax:    Number(config?.damageChargeMax    ?? 5000),
      excessCapacityFee:  Number(config?.excessCapacityFee  ?? 500),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración operacional' });
  }
};

export const updateOperationalSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    const data = req.body;
    await prisma.businessConfig.update({ where: { id: 1 }, data });
    res.json({ message: 'Configuración operacional guardada correctamente' });
  } catch (error) {
    console.error('Error actualizando operacional:', error);
    res.status(500).json({ error: 'Error al guardar configuración operacional' });
  }
};