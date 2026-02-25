export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol_id)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
  };
};
