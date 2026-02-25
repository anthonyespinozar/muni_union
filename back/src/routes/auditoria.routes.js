import { Router } from "express";
import { listarAuditoria } from "../controllers/auditoria.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(auth);
router.use(allowRoles(1)); // Solo ADMIN

router.get("/", listarAuditoria);

export default router;
