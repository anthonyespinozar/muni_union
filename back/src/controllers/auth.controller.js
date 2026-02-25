import { autenticarUsuario } from "../services/auth.service.js";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Usuario y contraseña son obligatorios"
      });
    }

    const resultado = await autenticarUsuario(username, password);

    res.json(resultado);
  } catch (error) {
    res.status(401).json({
      message: error.message
    });
  }
};
