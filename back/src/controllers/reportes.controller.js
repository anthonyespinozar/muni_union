import * as reportesService from "../services/reportes.service.js";
import * as exportService from "../services/export.service.js";

export const getResumenDashboard = async (req, res) => {
    try {
        const stats = await reportesService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getEvolucionActas = async (req, res) => {
    try {
        const data = await reportesService.getActasByMonth();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getEstadoSolicitudes = async (req, res) => {
    try {
        const data = await reportesService.getSolicitudesStats();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getIngresos = async (req, res) => {
    try {
        const data = await reportesService.getIngresosStats();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Exportación EXCEL

export const exportActas = async (req, res) => {
    try {
        const buffer = await exportService.exportarActasExcel(req.query);
        res.setHeader("Content-Disposition", "attachment; filename=Reporte_Actas.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const exportPersonas = async (req, res) => {
    try {
        const buffer = await exportService.exportarPersonasExcel(req.query);
        res.setHeader("Content-Disposition", "attachment; filename=Reporte_Ciudadanos.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const exportSolicitudes = async (req, res) => {
    try {
        const buffer = await exportService.exportarSolicitudesExcel(req.query);
        res.setHeader("Content-Disposition", "attachment; filename=Reporte_Tramites.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const exportAuditoria = async (req, res) => {
    try {
        const buffer = await exportService.exportarAuditoriaExcel(req.query);
        res.setHeader("Content-Disposition", "attachment; filename=Reporte_Auditoria.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
