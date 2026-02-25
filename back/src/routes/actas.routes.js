import { Router } from "express";
import {
    crearActa,
    listarActas,
    obtenerActa,
    actualizarActa,
    eliminarActa,
    anularActa,
    reactivarActa
} from "../controllers/actas.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(auth);

// Rutas generales (ADMIN y USER)
router.post("/", crearActa);
router.get("/", listarActas);
router.get("/:id", obtenerActa);
router.put("/:id", actualizarActa);

// Rutas críticas (SOLO ADMIN)
router.patch("/:id/anular", anularActa);
router.patch("/:id/reactivar", reactivarActa);
router.delete("/:id", allowRoles(1), eliminarActa);

export default router;
