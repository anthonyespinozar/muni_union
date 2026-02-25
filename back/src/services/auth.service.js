import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export const autenticarUsuario = async (username, password) => {
  const query = `
    SELECT 
      u.id,
      u.username,
      u.password_hash,
      u.nombres,
      u.apellidos,
      u.telefono,
      u.activo,
      u.rol_id,
      r.nombre AS rol
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.username = $1
      AND u.fecha_eliminacion IS NULL
  `;

  const { rows } = await pool.query(query, [username]);

  // Usuario no existe
  if (rows.length === 0) {
    throw new Error("Usuario o contraseña incorrectos.");
  }

  const usuario = rows[0];

  // Validar contraseña
  const passwordValido = await bcrypt.compare(
    password,
    usuario.password_hash
  );

  if (!passwordValido) {
    throw new Error("Usuario o contraseña incorrectos.");
  }

  // Validar si la cuenta está activa
  if (!usuario.activo) {
    throw new Error("La cuenta se encuentra inactiva. Contacte al administrador.");
  }

  // Generar token
  const token = jwt.sign(
    {
      id: usuario.id,
      rol_id: usuario.rol_id,
      rol: usuario.rol
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      username: usuario.username,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      telefono: usuario.telefono,
      rol_id: usuario.rol_id,
      rol: usuario.rol,
      activo: usuario.activo
    }
  };
};
