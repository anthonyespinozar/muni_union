import { Router } from "express";
import {
    crearPersona,
    listarPersonas,
    obtenerPersona,
    actualizarPersona,
    eliminarPersona,
    reactivarPersona,
    buscarDuplicados
} from "../controllers/personas.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(auth);

// Rutas generales (ADMIN y USER)
router.post("/", crearPersona);
router.get("/", listarPersonas);
router.get("/buscar-duplicados", buscarDuplicados);
router.get("/:id", obtenerPersona);
router.put("/:id", actualizarPersona);

// Rutas críticas (SOLO ADMIN)
router.patch("/:id/reactivar", allowRoles(1), reactivarPersona);
router.delete("/:id", allowRoles(1), eliminarPersona);

export default router;
