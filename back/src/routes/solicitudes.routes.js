import { Router } from "express";
import {
    crearSolicitante,
    crearSolicitud,
    listarSolicitudes,
    obtenerSolicitud,
    atenderSolicitud,
    anularSolicitud,
    eliminarSolicitud,
    obtenerSolicitante
} from "../controllers/solicitudes.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

// Rutas de solicitudes: El trabajador tiene total libertad y responsabilidad sobre este flujo
router.post("/solicitantes", crearSolicitante);
router.get("/solicitantes/:dni", obtenerSolicitante);
router.post("/", crearSolicitud);
router.get("/", listarSolicitudes);
router.get("/:id", obtenerSolicitud);
router.patch("/:id/atender", atenderSolicitud);
router.patch("/:id/anular", anularSolicitud); // Ahora libre para USER y ADMIN
router.delete("/:id", eliminarSolicitud);

export default router;
