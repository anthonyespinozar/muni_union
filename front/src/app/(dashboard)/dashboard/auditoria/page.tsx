"use client";

import { useEffect, useState, useCallback } from "react";
import {
    History as HistoryIcon,
    RefreshCw,
    Calendar as CalendarIcon,
    Search,
    Database,
    ArrowUpRight,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditoriaService } from "@/services/auditoria.service";
import { AuditoriaTable } from "@/components/auditoria/AuditoriaTable";
import { Auditoria } from "@/types/auditoria";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

export default function AuditoriaPage() {
    const router = useRouter();
    const currentUser = useAuthStore((state) => state.usuario);
    const [logs, setLogs] = useState<Auditoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 15,
        totalPages: 1
    });

    const [filtros, setFiltros] = useState({
        fechaInicio: "",
        fechaFin: "",
        usuario: "",
        tabla: "all",
        operacion: "all",
        page: 1,
        limit: 15
    });

    // Seguridad: Solo Admins
    useEffect(() => {
        if (currentUser && currentUser.rol_id !== 1) {
            toast.error("No tiene permisos para acceder a esta sección");
            router.push("/dashboard");
        }
    }, [currentUser, router]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                ...filtros,
                offset: (filtros.page - 1) * filtros.limit
            };

            // Limpiar filtros antes de enviar
            if (params.tabla === "all") delete params.tabla;
            if (params.operacion === "all") delete params.operacion;
            if (!params.usuario) delete params.usuario;
            if (!params.fechaInicio) delete params.fechaInicio;
            if (!params.fechaFin) delete params.fechaFin;

            const response = await auditoriaService.listar(params);
            setLogs(response.data);
            setPagination({
                total: response.total,
                page: filtros.page,
                limit: filtros.limit,
                totalPages: Math.ceil(response.total / filtros.limit)
            });
        } catch (error) {
            toast.error("Error al cargar registros de auditoría");
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handlePageChange = (newPage: number) => {
        setFiltros(prev => ({ ...prev, page: newPage }));
    };

    const handleSearch = () => {
        setFiltros(prev => ({ ...prev, page: 1 }));
    };

    const resetFiltros = () => {
        setFiltros({
            fechaInicio: "",
            fechaFin: "",
            usuario: "",
            tabla: "all",
            operacion: "all",
            page: 1,
            limit: 15
        });
    };

    if (currentUser?.rol_id !== 1) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ================= HEADER ================= */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="
          bg-primary/90 
          p-2.5 
          rounded-xl 
          shadow-md
        ">
                            <HistoryIcon className="h-5 w-5 text-white" />
                        </div>

                        <div>
                            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                                Bitácora de Auditoría
                            </h1>
                            <p className="text-muted-foreground text-xs font-medium">
                                Control histórico de operaciones y seguridad del sistema.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* ================= FILTROS ================= */}
            <div className="
    grid grid-cols-1 md:grid-cols-5 gap-4
    bg-card 
    p-5
    rounded-2xl 
    border border-border
    shadow-sm
  ">

                {/* Usuario */}
                <div className="md:col-span-1 space-y-1.5">
                    <label className="std-label">Usuario</label>
                    <div className="relative group">
                        <Search className="
          absolute left-3 top-1/2 -translate-y-1/2 
          icon-std 
          transition-colors 
          group-focus-within:text-primary
        " />
                        <Input
                            placeholder="Ej. admin..."
                            className="pl-9 std-input"
                            value={filtros.usuario}
                            onChange={(e) =>
                                setFiltros(prev => ({ ...prev, usuario: e.target.value, page: 1 }))
                            }
                        />
                    </div>
                </div>

                {/* Desde */}
                <div className="md:col-span-1 space-y-1.5">
                    <label className="std-label">Desde</label>
                    <div className="relative group">
                        <CalendarIcon className="
          absolute left-3 top-1/2 -translate-y-1/2 
          icon-std 
          transition-colors 
          group-focus-within:text-primary
        " />
                        <Input
                            type="date"
                            className="pl-9 std-input"
                            value={filtros.fechaInicio}
                            onChange={(e) =>
                                setFiltros(prev => ({ ...prev, fechaInicio: e.target.value, page: 1 }))
                            }
                        />
                    </div>
                </div>

                {/* Hasta */}
                <div className="md:col-span-1 space-y-1.5">
                    <label className="std-label">Hasta</label>
                    <div className="relative group">
                        <CalendarIcon className="
          absolute left-3 top-1/2 -translate-y-1/2 
          icon-std 
          transition-colors 
          group-focus-within:text-primary
        " />
                        <Input
                            type="date"
                            className="pl-9 std-input"
                            value={filtros.fechaFin}
                            onChange={(e) =>
                                setFiltros(prev => ({ ...prev, fechaFin: e.target.value, page: 1 }))
                            }
                        />
                    </div>
                </div>

                {/* Módulo */}
                <div className="md:col-span-1 space-y-1.5">
                    <label className="std-label">Módulo</label>
                    <Select
                        value={filtros.tabla}
                        onValueChange={(v) =>
                            setFiltros(prev => ({ ...prev, tabla: v, page: 1 }))
                        }
                    >
                        <SelectTrigger className="std-input">
                            <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-lg">
                            <SelectItem value="all">Todos los módulos</SelectItem>
                            <SelectItem value="actas">Actas</SelectItem>
                            <SelectItem value="usuarios">Usuarios</SelectItem>
                            <SelectItem value="personas">Personas</SelectItem>
                            <SelectItem value="solicitudes">Solicitudes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Botones */}
                <div className="md:col-span-1 flex items-end gap-2">
                    <Button
                        variant="outline"
                        onClick={resetFiltros}
                        className="
          flex-1 h-10 
          rounded-xl 
          text-xs 
          font-semibold 
          uppercase 
          tracking-wide
        "
                    >
                        <RefreshCw size={14} />
                    </Button>

                    <Button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="
          flex-1 h-10 
          rounded-xl 
          text-xs 
          font-semibold 
          uppercase 
          tracking-wide
          shadow-sm
        "
                    >
                        {loading
                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                            : 'Actualizar'}
                    </Button>
                </div>

            </div>

            {/* ================= RESUMEN ================= */}
            {!loading && (
                <div className="
      flex items-center gap-2 
      px-1 
      text-muted-foreground
      text-xs
      font-medium
    ">
                    <Filter className="h-3.5 w-3.5" />
                    <span>
                        Mostrando {filtros.limit} por página • Total: {pagination.total} registros
                    </span>
                </div>
            )}

            {/* ================= TABLA ================= */}
            <AuditoriaTable
                logs={logs}
                isLoading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
            />

        </div>

    );
}
