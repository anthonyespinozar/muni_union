"use client";

import { useEffect, useState, useCallback } from "react";
import {
    History as HistoryIcon,
    RefreshCw,
    Calendar as CalendarIcon,
    Search,
    Database,
    ArrowUpRight,
    Filter,
    Download
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { reportesService } from "@/services/reportes.service";
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
    const [isLoading, setIsLoading] = useState(true);
    const [isAnularDialogOpen, setIsAnularDialogOpen] = useState(false);
    const [exporting, setExporting] = useState(false); // Added

    const handleExport = async () => {
        setExporting(true);
        // Limpiamos los filtros "all" para el backend
        const cleanFilters = {
            ...filtros,
            tabla: filtros.tabla === "all" ? "" : filtros.tabla,
            operacion: filtros.operacion === "all" ? "" : filtros.operacion
        };

        const toastId = toast.loading("Generando reporte de auditoría...");
        try {
            await reportesService.exportAuditoria(cleanFilters);
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Descarga lista", { id: toastId });
        } catch (error) {
            toast.error("No se pudo generar el reporte", { id: toastId });
        } finally {
            setExporting(false);
        }
    };
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
        setIsLoading(true);
        try {
            // ... resto del código que usa fetchLogs
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
            setIsLoading(false);
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* CABECERA ESTANDARIZADA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-foreground">
                        <div className="bg-primary p-2.5 rounded-xl shadow-primary/20 shadow-lg">
                            <HistoryIcon className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Bitácora de Auditoría</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-xs ml-1">
                        Control histórico de operaciones y seguridad del sistema.
                    </p>
                </div>
            </div>

            {/* HERRAMIENTAS DE TABLA: FILTROS Y ACCIONES SEPARADOS */}
            <div className="flex flex-col xl:flex-row gap-4 items-center">

                {/* CONTENEDOR DE FILTROS (70px de alto) */}
                <div className="flex-1 flex items-center gap-3 bg-card h-[70px] px-5 rounded-2xl border border-border shadow-sm w-full outline-none overflow-x-auto scrollbar-hide">

                    {/* Usuario */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-std text-slate-400" />
                        <Input
                            placeholder="Usuario..."
                            className="pl-9 std-input border-none bg-transparent focus-visible:ring-0 h-11 w-full font-semibold"
                            value={filtros.usuario}
                            onChange={(e) => setFiltros(prev => ({ ...prev, usuario: e.target.value, page: 1 }))}
                        />
                    </div>

                    <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

                    {/* Rango de Fechas */}
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            className="std-input border-none bg-transparent focus-visible:ring-0 h-11 w-36 text-xs p-0 font-semibold"
                            value={filtros.fechaInicio}
                            onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value, page: 1 }))}
                        />
                        <span className="text-slate-300 text-xs">→</span>
                        <Input
                            type="date"
                            className="std-input border-none bg-transparent focus-visible:ring-0 h-11 w-36 text-xs p-0 font-semibold"
                            value={filtros.fechaFin}
                            onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value, page: 1 }))}
                        />
                    </div>

                    <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

                    {/* Módulo */}
                    <Select
                        value={filtros.tabla}
                        onValueChange={(v) => setFiltros(prev => ({ ...prev, tabla: v, page: 1 }))}
                    >
                        <SelectTrigger className="w-40 border-none bg-transparent focus:ring-0 h-11 text-xs font-bold uppercase truncate">
                            <SelectValue placeholder="Módulo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-lg">
                            <SelectItem value="all">TODOS</SelectItem>
                            <SelectItem value="actas">ACTAS</SelectItem>
                            <SelectItem value="usuarios">USUARIOS</SelectItem>
                            <SelectItem value="personas">PERSONAS</SelectItem>
                            <SelectItem value="solicitudes">SOLICITUDES</SelectItem>
                        </SelectContent>
                    </Select>

                    <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 shrink-0"
                        onClick={resetFiltros}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                <Button
                    variant="outline"
                    disabled={exporting}
                    className="h-12 px-7 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    onClick={handleExport}
                >
                    {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                    EXPORTAR
                </Button>
            </div>


            {/* ================= RESUMEN ================= */}
            {
                !isLoading && (
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
                )
            }

            {/* ================= TABLA ================= */}
            <AuditoriaTable
                logs={logs}
                isLoading={isLoading}
                pagination={pagination}
                onPageChange={handlePageChange}
            />

        </div >

    );
}
