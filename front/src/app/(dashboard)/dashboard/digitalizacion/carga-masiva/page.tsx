"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    FileSpreadsheet, Upload, Loader2, ArrowLeft, Download,
    CheckCircle2, XCircle, AlertTriangle, FileText, FolderOpen,
    Info, Package, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/utils/api";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ResultadoFila {
    fila: number;
    estado: "OK" | "ERROR";
    acta: string;
    persona: string;
    con_documento: boolean;
    error?: string;
}

interface ResumenImportacion {
    total: number;
    exitosos: number;
    errores: number;
    resultados: ResultadoFila[];
}

export default function CargaMasivaPage() {
    const router = useRouter();

    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [resumen, setResumen] = useState<ResumenImportacion | null>(null);
    const [mostrarErrores, setMostrarErrores] = useState(false);
    const [mostrarExitosos, setMostrarExitosos] = useState(false);
    const [dragOverExcel, setDragOverExcel] = useState(false);
    const [dragOverZip, setDragOverZip] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const excelRef = useRef<HTMLInputElement>(null);
    const zipRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent, tipo: "excel" | "zip") => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (tipo === "excel") {
            if (![".xlsx", ".xls"].some(ext => file.name.endsWith(ext))) {
                toast.error("Solo archivos Excel (.xlsx o .xls)");
                return;
            }
            setExcelFile(file);
        } else {
            if (!file.name.endsWith(".zip")) {
                toast.error("Solo archivos ZIP");
                return;
            }
            setZipFile(file);
        }
        tipo === "excel" ? setDragOverExcel(false) : setDragOverZip(false);
    };

    const handleImportar = async () => {
        if (!excelFile) {
            toast.error("Seleccione el archivo Excel antes de continuar.");
            return;
        }

        setLoading(true);
        setResumen(null);

        try {
            const formData = new FormData();
            formData.append("excel", excelFile);
            if (zipFile) formData.append("zip", zipFile);

            const { data } = await api.post<ResumenImportacion>("/importacion", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 300000, // 5 minutos para archivos grandes
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setUploadProgress(progress);
                }
            });

            setResumen(data);

            if (data.errores === 0) {
                toast.success(`✅ Importación completada: ${data.exitosos} actas registradas.`);
            } else {
                toast.warning(`Importación finalizada: ${data.exitosos} exitosas, ${data.errores} con errores.`);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Error inesperado durante la importación.";
            toast.error(msg);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const porcentajeExito = resumen ? Math.round((resumen.exitosos / resumen.total) * 100) : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-foreground">
                        <div className="bg-emerald-600 p-2.5 rounded-xl shadow-emerald-200 shadow-lg">
                            <FileSpreadsheet className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Carga Masiva de Actas</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-xs ml-1">
                        Importa miles de registros desde Excel + PDFs escaneados de forma segura.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="h-10 hover:bg-muted font-medium"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <Button
                        variant="outline"
                        className="h-10 font-bold border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                        onClick={() => window.open('/templates/plantilla_carga_masiva.xlsx', '_blank')}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Plantilla
                    </Button>
                </div>
            </div>

            {/* INSTRUCCIONES */}
            <Card className="border-emerald-100 bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 dark:border-slate-800 rounded-3xl shadow-xl shadow-emerald-500/5">
                <CardContent className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="bg-amber-100 dark:bg-amber-950/40 p-3 rounded-2xl h-fit">
                            <Info className="h-6 w-6 text-amber-600 flex-shrink-0" />
                        </div>
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Guía de Importación Inteligente</h3>
                                <p className="text-sm text-slate-500 font-medium">Sigue estos pasos para una carga 100% exitosa.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ul className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs font-medium list-none">
                                    <li className="flex gap-2">
                                        <div className="bg-emerald-500 h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" />
                                        <span>Llena el Excel: Una fila por cada acta de <strong>Nacimiento, Matrimonio o Defunción</strong>.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="bg-emerald-500 h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" />
                                        <span>Ruta ZIP: Indica la carpeta exacta donde está el PDF (ej: <code>defunciones/2023/LIBRO 1</code>).</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="bg-emerald-500 h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" />
                                        <span>Nombres Reales: El sistema reconoce automáticamente <strong>PART. NACIMIENTO, DNI</strong>, etc.</span>
                                    </li>
                                </ul>
                                <div className="bg-slate-100/80 dark:bg-slate-800/50 rounded-2xl p-4 text-[11px] font-mono border border-slate-200 dark:border-slate-700">
                                    <p className="text-slate-400 mb-2 uppercase tracking-widest text-[9px] font-bold font-sans">Estructura del ZIP Sugerida</p>
                                    <div className="space-y-1">
                                        <p className="text-emerald-600 dark:text-emerald-400 font-bold">📦 carga_marzo.zip</p>
                                        <p className="ml-4 text-slate-500">📂 nacimientos / 📂 matrimonios / 📂 defunciones</p>
                                        <p className="ml-8 text-slate-500">📂 LIBRO 1 / 📂 1990</p>
                                        <p className="ml-12 text-blue-600 dark:text-blue-400">📄 acta_45.pdf (Ruta: <code>defunciones/1990</code>)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ZONA DE CARGA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EXCEL */}
                <Card
                    className={cn(
                        "group relative overflow-hidden transition-all duration-300 border-2 border-dashed cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/10 rounded-3xl",
                        dragOverExcel ? "border-emerald-500 bg-emerald-50/50 scale-[1.02]" : excelFile ? "border-emerald-500 bg-emerald-50/20" : "border-slate-200 dark:border-slate-800 hover:border-emerald-400"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragOverExcel(true); }}
                    onDragLeave={() => setDragOverExcel(false)}
                    onDrop={(e) => handleDrop(e, "excel")}
                    onClick={() => excelRef.current?.click()}
                >
                    <CardContent className="p-8 text-center">
                        <input ref={excelRef} type="file" className="hidden" accept=".xlsx,.xls"
                            onChange={(e) => e.target.files?.[0] && setExcelFile(e.target.files[0])} />

                        <div className={cn(
                            "mb-4 mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6",
                            excelFile ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                            <FileSpreadsheet className="h-8 w-8" />
                        </div>

                        {excelFile ? (
                            <div className="space-y-1.5 animate-in zoom-in-95 duration-300">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate w-full px-4">{excelFile.name}</h4>
                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-tighter">Archivo Excel Detectado</p>
                                <Button variant="ghost" size="sm" className="mt-4 text-rose-500 h-7 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50"
                                    onClick={(e) => { e.stopPropagation(); setExcelFile(null); }}>
                                    <RefreshCw className="h-3 w-3 mr-1" /> Cambiar Archivo
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Datos en Excel</h4>
                                <p className="text-xs text-slate-400 px-8 mx-auto leading-relaxed">Arrastra la plantilla llena aquí o haz click para explorar tus carpetas.</p>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px] font-bold">REQUERIDO</Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ZIP */}
                <Card
                    className={cn(
                        "group relative overflow-hidden transition-all duration-300 border-2 border-dashed cursor-pointer hover:shadow-2xl hover:shadow-blue-500/10 rounded-3xl",
                        dragOverZip ? "border-blue-500 bg-blue-50/50 scale-[1.02]" : zipFile ? "border-blue-500 bg-blue-50/20" : "border-slate-200 dark:border-slate-800 hover:border-blue-400"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragOverZip(true); }}
                    onDragLeave={() => setDragOverZip(false)}
                    onDrop={(e) => handleDrop(e, "zip")}
                    onClick={() => zipRef.current?.click()}
                >
                    <CardContent className="p-8 text-center">
                        <input ref={zipRef} type="file" className="hidden" accept=".zip"
                            onChange={(e) => e.target.files?.[0] && setZipFile(e.target.files[0])} />

                        <div className={cn(
                            "mb-4 mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:-rotate-6",
                            zipFile ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                            <Package className="h-8 w-8" />
                        </div>

                        {zipFile ? (
                            <div className="space-y-1.5 animate-in zoom-in-95 duration-300">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate w-full px-4">{zipFile.name}</h4>
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-tighter">Archivo ZIP Listado</p>
                                <Button variant="ghost" size="sm" className="mt-4 text-rose-500 h-7 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50"
                                    onClick={(e) => { e.stopPropagation(); setZipFile(null); }}>
                                    <RefreshCw className="h-3 w-3 mr-1" /> Cambiar ZIP
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Imágenes y PDFs</h4>
                                <p className="text-xs text-slate-400 px-8 mx-auto leading-relaxed">Si tienes los escaneos en un ZIP, cárgalo aquí para vincularlos automáticamente.</p>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-400 text-[9px] font-bold">OPCIONAL</Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* BOTÓN IMPORTAR */}
            <div className="flex flex-col items-center gap-6 py-6 w-full max-w-lg mx-auto">
                {loading && (
                    <div className="w-full space-y-3 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-end px-1">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    {uploadProgress < 100 ? "Transmitiendo Archivos" : "Servidor Procesando"}
                                </p>
                                <p className="text-xs font-bold text-slate-500">
                                    {uploadProgress < 100
                                        ? "Enviando datos al servidor central..."
                                        : "Validando registros y vinculando documentos..."}
                                </p>
                            </div>
                            <span className="text-xl font-black text-emerald-600">{uploadProgress}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 shadow-inner">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-300 shadow-md",
                                    uploadProgress < 100
                                        ? "bg-emerald-500 shadow-emerald-500/30"
                                        : "bg-blue-600 shadow-blue-500/30 animate-pulse"
                                )}
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {!resumen && (
                    <Button
                        onClick={handleImportar}
                        disabled={!excelFile || loading}
                        className={cn(
                            "h-16 px-16 group relative overflow-hidden transition-all duration-500 rounded-3xl shadow-2xl",
                            excelFile ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25" : "bg-slate-200 text-slate-400 shadow-none border-none"
                        )}
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <div className="relative flex items-center gap-4 text-lg font-black uppercase tracking-[0.2em]">
                            {loading ? (
                                <>
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span>{uploadProgress < 100 ? "SUBIENDO..." : "TRABAJANDO..."}</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
                                    <span>INICIAR CARGA</span>
                                </>
                            )}
                        </div>
                    </Button>
                )}

                {!excelFile && !loading && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Debes cargar al menos el archivo Excel</p>
                )}
            </div>

            {/* RESULTADOS */}
            {resumen && (
                <Card className="border-none bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
                    <CardContent className="p-8 space-y-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2 text-center md:text-left">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Resultado de la Operación</h2>
                                <p className="text-sm text-slate-500 font-medium italic">La importación se procesó de forma atómica y segura.</p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-slate-50 border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6 shadow-sm flex items-center gap-2"
                                    onClick={() => toast.info("Generando reporte Excel...", { description: "Funcionalidad de exportación en desarrollo." })}
                                >
                                    <Download className="h-4 w-4" /> REPORTE XLS
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white hover:bg-slate-50 border-slate-200 text-slate-600 font-bold rounded-xl h-11 px-6 shadow-sm flex items-center gap-2"
                                    onClick={() => toast.info("Generando comprobante PDF...", { description: "Funcionalidad de exportación en desarrollo." })}
                                >
                                    <FileText className="h-4 w-4" /> RESUMEN PDF
                                </Button>
                            </div>
                        </div>

                        {/* RESUMEN ESTADÍSTICO */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'TOTAL FILAS', value: resumen.total, icon: FileSpreadsheet, color: 'slate' },
                                { label: 'REGISTROS EXITOSOS', value: resumen.exitosos, icon: CheckCircle2, color: 'emerald' },
                                { label: 'FALLIDOS / ERRORES', value: resumen.errores, icon: XCircle, color: 'rose' }
                            ].map((stat, i) => (
                                <div key={i} className={cn(
                                    "p-6 rounded-[30px] border flex flex-col items-center justify-center gap-2 transition-all hover:scale-105",
                                    stat.color === 'slate' ? "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700" :
                                        stat.color === 'emerald' ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800" :
                                            "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-800"
                                )}>
                                    <stat.icon className={cn("h-6 w-6 mb-1",
                                        stat.color === 'slate' ? "text-slate-400" :
                                            stat.color === 'emerald' ? "text-emerald-600" : "text-rose-600"
                                    )} />
                                    <p className={cn("text-4xl font-black",
                                        stat.color === 'slate' ? "text-slate-700 dark:text-slate-200" :
                                            stat.color === 'emerald' ? "text-emerald-700" : "text-rose-700"
                                    )}>{stat.value}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* BARRA DE PROGRESO PREMIUM */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Estado de Carga</span>
                                <span className="text-sm font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full">{porcentajeExito}% COMPLETADO</span>
                            </div>
                            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 shadow-lg shadow-emerald-500/50"
                                    style={{ width: `${porcentajeExito}%` }}
                                />
                            </div>
                        </div>

                        {/* TABLAS DE DETALLES */}
                        <div className="grid grid-cols-1 gap-6">
                            {/* LISTA DE ERRORES */}
                            {resumen.errores > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2" onClick={() => setMostrarErrores(!mostrarErrores)}>
                                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                                        <h3 className="font-black text-rose-700 uppercase tracking-widest text-sm cursor-pointer hover:underline">Detalle de Incidencias ({resumen.errores})</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                        {resumen.resultados.filter(r => r.estado === "ERROR").map((r) => (
                                            <div key={r.fila} className="flex gap-4 p-4 bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="bg-rose-50 dark:bg-rose-950/40 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    <span className="font-black text-rose-600 text-xs">#{r.fila}</span>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm">{r.persona || 'Dato no identificado'}</p>
                                                    <p className="text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-900/30 font-medium">{r.error}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ACCIONES FINALES */}
                        <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 px-10 border-slate-200 text-slate-500 hover:text-slate-800 font-bold rounded-2xl transition-all hover:bg-white active:scale-95"
                                onClick={() => { setResumen(null); setExcelFile(null); setZipFile(null); }}
                            >
                                <RefreshCw className="h-4 w-4 mr-3" /> VOLVER A EMPEZAR
                            </Button>
                            <Button
                                size="lg"
                                className="h-14 px-10 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-xl active:scale-95"
                                onClick={() => router.push("/dashboard/actas")}
                            >
                                IR AL REGISTRO DE ACTAS <ArrowLeft className="h-4 w-4 ml-3 rotate-180" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
