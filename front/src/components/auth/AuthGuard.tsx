"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

const rolePermissions: Record<string, number[]> = {
    "/dashboard/usuarios": [1],
    "/dashboard/auditoria": [1],
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, usuario } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Pequeño delay para dejar que zustand-persist restaure el estado desde localStorage
        const checkAuth = () => {
            if (!isAuthenticated) {
                router.push("/login");
            } else if (usuario) {
                // Verificar permisos por rol en rutas específicas
                const requiredRoles = rolePermissions[pathname];
                if (requiredRoles && !requiredRoles.includes(usuario.rol_id)) {
                    router.push("/dashboard");
                }
            }
            setIsChecking(false);
        };

        const timeout = setTimeout(checkAuth, 100);
        return () => clearTimeout(timeout);
    }, [isAuthenticated, usuario, router, pathname]);

    if (isChecking) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="font-medium animate-pulse">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    return <>{isAuthenticated ? children : null}</>;
}
