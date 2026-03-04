export interface Usuario {
    id: number;
    username: string;
    nombres: string;
    apellidos: string;
    rol_id: number;
    rol: string;
    telefono?: string;
    dni?: string;
    activo: boolean;
}

export interface AuthState {
    token: string | null;
    usuario: Usuario | null;
    isAuthenticated: boolean;
    login: (token: string, usuario: Usuario) => void;
    logout: () => void;
}
