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
                timeout: 300000 // 5 minutos para archivos grandes
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
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="h-10 font-bold border-dashed border-primary/40"
                        onClick={() => window.open('/templates/plantilla_carga_masiva.xls', '_blank')}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Plantilla
                    </Button>
                    <Button variant="ghost" className="h-10" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                </div>
            </div>

            {/* INSTRUCCIONES */}
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-2xl">
                <CardContent className="p-5 space-y-4">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <p className="font-bold text-amber-800 dark:text-amber-400 text-sm">¿Cómo preparar tu carga?</p>
                            <ol className="list-decimal ml-4 space-y-1.5 text-amber-700 dark:text-amber-300 text-xs leading-relaxed">
                                <li>Descarga la <strong>Plantilla Excel</strong> y llena los datos de cada acta (una acta = una fila).</li>
                                <li>En <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">carpeta_ruta</code>: escribe la ruta relativa dentro del ZIP donde está el PDF.<br />
                                    <span className="text-amber-600">Ej: <code>nacimientos/LIBRO 2/PRIMERA PARTE</code></span></li>
                                <li>En <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">nombre_archivo_pdf</code>: escribe el nombre exacto del PDF.<br />
                                    <span className="text-amber-600">Ej: <code>Documento 1.pdf</code></span></li>
                                <li className="font-semibold">Crea el ZIP <strong>desde la carpeta raíz</strong> que contiene todas las subcarpetas de libros, manteniendo la estructura de carpetas intacta.</li>
                                <li>Si no tienes PDFs aún, deja esas columnas en blanco. Puedes adjuntarlos después desde la tabla de actas.</li>
                            </ol>
                        </div>
                    </div>

                    {/* Diagrama visual de la estructura */}
                    <div className="bg-amber-100/60 dark:bg-amber-900/30 rounded-xl p-4 text-xs font-mono space-y-0.5 text-amber-900 dark:text-amber-200">
                        <p className="font-bold mb-2 non-mono font-sans text-amber-800">📁 Estructura de tu ZIP:</p>
                        <p>📦 <strong>mi_carga.zip</strong></p>
                        <p className="ml-4">📂 nacimientos/</p>
                        <p className="ml-8">📂 LIBRO 1/</p>
                        <p className="ml-12">📂 PRIMERA PARTE/</p>
                        <p className="ml-16 text-emerald-700 dark:text-emerald-400">📄 Documento 1.pdf  <span className="text-amber-600">← carpeta_ruta: <em>nacimientos/LIBRO 1/PRIMERA PARTE</em></span></p>
                        <p className="ml-16 text-emerald-700 dark:text-emerald-400">📄 Documento 2.pdf</p>
                        <p className="ml-8">📂 LIBRO 2/</p>
                        <p className="ml-12">📂 PRIMERA PARTE/</p>
                        <p className="ml-16 text-emerald-700 dark:text-emerald-400">📄 Documento 1.pdf  <span className="text-amber-600">← carpeta_ruta: <em>nacimientos/LIBRO 2/PRIMERA PARTE</em></span></p>
                        <p className="ml-4">📂 matrimonios/ ...</p>
                    </div>
                </CardContent>
            </Card>

            {/* ZONA DE CARGA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* EXCEL */}
                <div
                    className={cn(
                        "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group",
                        dragOverExcel ? "border-primary bg-primary/5" : excelFile ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border hover:border-primary/50 hover:bg-muted/20"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragOverExcel(true); }}
                    onDragLeave={() => setDragOverExcel(false)}
                    onDrop={(e) => handleDrop(e, "excel")}
                    onClick={() => excelRef.current?.click()}
                >
                    <input ref={excelRef} type="file" className="hidden" accept=".xlsx,.xls"
                        onChange={(e) => e.target.files?.[0] && setExcelFile(e.target.files[0])} />
                    <div className={cn("p-3 rounded-full mx-auto w-fit mb-3 transition-transform group-hover:scale-110",
                        excelFile ? "bg-emerald-100 dark:bg-emerald-900" : "bg-muted")}>
                        <FileSpreadsheet className={cn("h-8 w-8", excelFile ? "text-emerald-600" : "text-muted-foreground/40")} />
                    </div>
                    {excelFile ? (
                        <>
                            <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{excelFile.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{(excelFile.size / 1024).toFixed(1)} KB</p>
                            <Badge variant="success" className="mt-2">Archivo Listo</Badge>
                        </>
                    ) : (
                        <>
                            <p className="font-bold text-sm">📊 Archivo Excel (Requerido)</p>
                            <p className="text-xs text-muted-foreground mt-1">Arrastra o haz click. Solo .xlsx / .xls</p>
                        </>
                    )}
                    {excelFile && (
                        <Button variant="ghost" size="sm" className="mt-3 text-rose-500 text-xs"
                            onClick={(e) => { e.stopPropagation(); setExcelFile(null); }}>
                            Cambiar archivo
                        </Button>
                    )}
                </div>

                {/* ZIP */}
                <div
                    className={cn(
                        "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group",
                        dragOverZip ? "border-primary bg-primary/5" : zipFile ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-border hover:border-primary/50 hover:bg-muted/20"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragOverZip(true); }}
                    onDragLeave={() => setDragOverZip(false)}
                    onDrop={(e) => handleDrop(e, "zip")}
                    onClick={() => zipRef.current?.click()}
                >
                    <input ref={zipRef} type="file" className="hidden" accept=".zip"
                        onChange={(e) => e.target.files?.[0] && setZipFile(e.target.files[0])} />
                    <div className={cn("p-3 rounded-full mx-auto w-fit mb-3 transition-transform group-hover:scale-110",
                        zipFile ? "bg-blue-100 dark:bg-blue-900" : "bg-muted")}>
                        <Package className={cn("h-8 w-8", zipFile ? "text-blue-600" : "text-muted-foreground/40")} />
                    </div>
                    {zipFile ? (
                        <>
                            <p className="font-bold text-blue-700 dark:text-blue-400 text-sm">{zipFile.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <Badge className="mt-2 bg-blue-600">PDFs Adjuntos</Badge>
                        </>
                    ) : (
                        <>
                            <p className="font-bold text-sm">📁 ZIP con PDFs (Opcional)</p>
                            <p className="text-xs text-muted-foreground mt-1">Todos los PDF del libro en un solo ZIP</p>
                        </>
                    )}
                    {zipFile && (
                        <Button variant="ghost" size="sm" className="mt-3 text-rose-500 text-xs"
                            onClick={(e) => { e.stopPropagation(); setZipFile(null); }}>
                            Cambiar ZIP
                        </Button>
                    )}
                </div>
            </div>

            {/* BOTÓN IMPORTAR */}
            <div className="flex justify-center">
                <Button
                    onClick={handleImportar}
                    disabled={!excelFile || loading}
                    className="h-14 px-12 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 text-base font-bold uppercase tracking-widest rounded-2xl"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                            Procesando registros...
                        </>
                    ) : (
                        <>
                            <Upload className="h-5 w-5 mr-3" />
                            Iniciar Importación
                        </>
                    )}
                </Button>
            </div>

            {/* RESULTADOS */}
            {resumen && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    <Separator />

                    {/* RESUMEN ESTADÍSTICO */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="rounded-2xl border-border text-center p-4">
                            <p className="text-3xl font-black text-foreground">{resumen.total}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Total Filas</p>
                        </Card>
                        <Card className="rounded-2xl border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-center p-4">
                            <p className="text-3xl font-black text-emerald-600">{resumen.exitosos}</p>
                            <p className="text-xs text-emerald-700 font-bold uppercase tracking-widest mt-1">Importadas</p>
                        </Card>
                        <Card className="rounded-2xl border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-center p-4">
                            <p className="text-3xl font-black text-rose-600">{resumen.errores}</p>
                            <p className="text-xs text-rose-700 font-bold uppercase tracking-widest mt-1">Con Error</p>
                        </Card>
                    </div>

                    {/* BARRA DE PROGRESO */}
                    <Card className="rounded-2xl">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold">Tasa de Éxito</span>
                                <span className="text-sm font-black text-emerald-600">{porcentajeExito}%</span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                                    style={{ width: `${porcentajeExito}%` }}
                                />
                            </div>
                            {resumen.errores > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Descarga el reporte de errores para corregir las filas fallidas y volver a importarlas.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* LISTA DE ERRORES */}
                    {resumen.errores > 0 && (
                        <Card className="rounded-2xl border-rose-200">
                            <CardHeader className="p-4 pb-0 cursor-pointer" onClick={() => setMostrarErrores(!mostrarErrores)}>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2 text-rose-700">
                                        <XCircle className="h-4 w-4" />
                                        Filas con Error ({resumen.errores})
                                    </CardTitle>
                                    {mostrarErrores ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>
                            </CardHeader>
                            {mostrarErrores && (
                                <CardContent className="p-4 pt-3">
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {resumen.resultados.filter(r => r.estado === "ERROR").map((r) => (
                                            <div key={r.fila} className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-xs">
                                                <span className="font-black text-rose-600 min-w-[50px]">Fila {r.fila}</span>
                                                <div className="flex-1">
                                                    <p className="font-bold text-rose-800 dark:text-rose-300">{r.persona}</p>
                                                    <p className="text-rose-600 mt-0.5">{r.error}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* LISTA DE EXITOSOS */}
                    {resumen.exitosos > 0 && (
                        <Card className="rounded-2xl border-emerald-200">
                            <CardHeader className="p-4 pb-0 cursor-pointer" onClick={() => setMostrarExitosos(!mostrarExitosos)}>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Actas Importadas ({resumen.exitosos})
                                    </CardTitle>
                                    {mostrarExitosos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>
                            </CardHeader>
                            {mostrarExitosos && (
                                <CardContent className="p-4 pt-3">
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {resumen.resultados.filter(r => r.estado === "OK").map((r) => (
                                            <div key={r.fila} className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-xs">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="font-bold">{r.acta}</p>
                                                    <p className="text-muted-foreground">{r.persona}</p>
                                                </div>
                                                {r.con_documento && (
                                                    <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">
                                                        <FileText className="h-3 w-3 mr-1" /> PDF
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* ACCIONES FINALES */}
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => { setResumen(null); setExcelFile(null); setZipFile(null); }}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Nueva Importación
                        </Button>
                        <Button onClick={() => router.push("/dashboard/actas")} className="bg-primary">
                            Ver Actas Importadas
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
