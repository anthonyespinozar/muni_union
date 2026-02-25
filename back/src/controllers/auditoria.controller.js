import * as auditoriaService from "../services/auditoria.service.js";

export const listarAuditoria = async (req, res) => {
    try {
        const result = await auditoriaService.listarAuditoria(req.query);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
