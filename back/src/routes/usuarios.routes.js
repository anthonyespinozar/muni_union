import { Router } from "express";
import {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
  cambiarMiPassword
} from "../controllers/usuarios.controller.js";

import { auth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(auth);

// Ruta accesible para CUALQUIER usuario autenticado
router.patch("/perfil/password", cambiarMiPassword);

// Rutas restringidas a ADMIN
router.use(allowRoles(1)); // 1 = ADMIN

router.post("/", crearUsuario);
router.get("/", listarUsuarios);
router.get("/:id", obtenerUsuario);
router.put("/:id", actualizarUsuario);
router.patch("/:id/estado", cambiarEstadoUsuario);
router.delete("/:id", eliminarUsuario);

export default router;
