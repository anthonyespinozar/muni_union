import { pool } from "../config/db.js";

const limpiar = (texto) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

export const generarUsername = async ({
  nombres,
  apellidos,
  excludeId = null
}) => {
  if (!nombres || !apellidos) {
    throw new Error("Nombres y apellidos son obligatorios");
  }

  const inicial = limpiar(nombres)[0];
  const primerApellido = limpiar(apellidos.split(" ")[0]);

  let base = `${inicial}${primerApellido}`;
  let username = base;
  let contador = 1;

  while (true) {
    const query = excludeId
      ? "SELECT 1 FROM usuarios WHERE username = $1 AND id != $2"
      : "SELECT 1 FROM usuarios WHERE username = $1";

    const params = excludeId ? [username, excludeId] : [username];

    const existe = await pool.query(query, params);

    if (existe.rowCount === 0) break;

    contador++;
    username = `${base}${contador}`;
  }

  return username;
};
