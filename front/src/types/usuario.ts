import { Usuario } from "./auth";

export interface UsuarioInput {
    nombres: string;
    apellidos: string;
    rol_id: number;
    telefono?: string;
    dni?: string;
    password?: string;
}

export interface ChangePasswordInput {
    passwordActual: string;
    passwordNuevo: string;
}
