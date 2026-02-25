import * as reportesService from "../services/reportes.service.js";

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
