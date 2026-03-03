import { Router } from "express";
import { importarMasivo, uploadImport } from "../controllers/importacion.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(auth);

// Solo administradores pueden hacer importación masiva
router.post("/", allowRoles(1), uploadImport, importarMasivo);

export default router;
