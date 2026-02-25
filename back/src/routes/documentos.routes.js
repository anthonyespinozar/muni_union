import { Router } from "express";
import {
    registrarDocumento,
    listarDocumentosPorActa,
    eliminarDocumento
} from "../controllers/documentos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(auth);

// Registro de documentos: USER y ADMIN pueden subir
router.post("/", upload.single("archivo"), registrarDocumento);

// Listar documentos: USER y ADMIN pueden ver
router.get("/acta/:actaId", listarDocumentosPorActa);

// Eliminar documentos: Cualquier usuario autenticado puede eliminar (soft delete)
router.delete("/:id", eliminarDocumento);

export default router;
