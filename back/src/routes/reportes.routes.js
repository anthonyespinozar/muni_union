import { Router } from "express";
import {
    getResumenDashboard,
    getEvolucionActas,
    getEstadoSolicitudes,
    getIngresos,
    exportActas,
    exportPersonas,
    exportSolicitudes,
    exportAuditoria
} from "../controllers/reportes.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(auth);

// Estadísticas generales para el dashboard (Admin y Trabajador)
router.get("/resumen", getResumenDashboard);
router.get("/actas-evolucion", getEvolucionActas);
router.get("/solicitudes-estados", getEstadoSolicitudes);

// Datos financieros (Solo ADMIN)
router.get("/ingresos", allowRoles(1), getIngresos);

// Rutas de Exportación EXCEL (Admin y Trabajador)
router.get("/export/actas", exportActas);
router.get("/export/personas", exportPersonas);
router.get("/export/solicitudes", exportSolicitudes);

// Exportación Auditoría (Solo ADMIN)
router.get("/export/auditoria", allowRoles(1), exportAuditoria);

export default router;
