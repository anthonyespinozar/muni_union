"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    FileDigit,
    User,
    FileText,
    Upload,
    Save,
    RotateCcw,
    Loader2,
    CheckCircle2,
    Trash2,
    AlertCircle,
    Calendar,
    Phone
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { personasService } from "@/services/personas.service";
import { actasService } from "@/services/actas.service";
import { documentosService } from "@/services/documentos.service";
import { Persona } from "@/types/persona";
import { Acta } from "@/types/acta";

const formSchema = z.object({
    // Persona
    tipo_documento: z.string().min(1, "Seleccione tipo"),
    dni: z.string().max(15, "Máximo 15 caracteres").optional().or(z.literal("")),
    nombres: z.string().min(2, "Min. 2 caracteres").regex(/^[A-ZÁÉÍÓÚÑ ]+$/i, "Solo letras y espacios").transform(v => v.toUpperCase()),
    apellido_paterno: z.string().min(2, "Min. 2 caracteres").regex(/^[A-ZÁÉÍÓÚÑ ]+$/i, "Solo letras y espacios").transform(v => v.toUpperCase()),
    apellido_materno: z.string().min(2, "Min. 2 caracteres").regex(/^[A-ZÁÉÍÓÚÑ ]+$/i, "Solo letras y espacios").transform(v => v.toUpperCase()),
    sexo: z.enum(["M", "F"]),
    fecha_nacimiento: z.string().optional(),
    telefono: z.string().optional(),
    persona_observaciones: z.string().optional(),

    // Acta
    tipo_acta: z.enum(["NACIMIENTO", "MATRIMONIO", "DEFUNCION"]),
    numero_acta: z.string().min(1, "Obligatorio").transform(v => v.toUpperCase()),
    anio: z.coerce.number().min(1900),
    fecha_acta: z.string().min(1, "Obligatorio"),
    acta_observaciones: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function DigitalizacionPage() {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [personaEncontrada, setPersonaEncontrada] = useState<Persona | null>(null);
    const [actaEncontrada, setActaEncontrada] = useState<Acta | null>(null);

    const [tiposDocumento, setTiposDocumento] = useState<{ id: number, nombre: string }[]>([]);

    useEffect(() => {
        personasService.getTiposDocumento()
            .then(setTiposDocumento)
            .catch(err => console.error("Error cargando tipos documento:", err));
    }, []);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            tipo_documento: "DNI",
            dni: "",
            nombres: "",
            apellido_paterno: "",
            apellido_materno: "",
            sexo: "M",
            fecha_nacimiento: "",
            telefono: "",
            persona_observaciones: "",
            tipo_acta: "NACIMIENTO",
            numero_acta: "",
            anio: new Date().getFullYear(),
            fecha_acta: new Date().toISOString().split('T')[0],
            acta_observaciones: "",
        }
    });

    const dniValue = form.watch("dni");
    const nombresValue = form.watch("nombres");
    const paternoValue = form.watch("apellido_paterno");
    const maternoValue = form.watch("apellido_materno");
    const numActaValue = form.watch("numero_acta");
    const fechaActaValue = form.watch("fecha_acta");
    const tipoActaValue = form.watch("tipo_acta");

    // Sincronizar año automáticamente con la fecha del acta
    useEffect(() => {
        if (fechaActaValue) {
            const year = new Date(fechaActaValue + 'T00:00:00').getFullYear();
            if (year >= 1900) {
                form.setValue("anio", year);
            }
        }
    }, [fechaActaValue, form]);

    // Autocompletado al digitar DNI / Documento
    useEffect(() => {
        if (dniValue && dniValue.length >= 8) {
            personasService.checkDni(dniValue).then(p => {
                if (p) {
                    setPersonaEncontrada(p);
                    form.setValue("tipo_documento", p.tipo_documento || "DNI");
                    form.setValue("nombres", p.nombres);
                    form.setValue("apellido_paterno", p.apellido_paterno);
                    form.setValue("apellido_materno", p.apellido_materno);
                    form.setValue("sexo", p.sexo);
                    form.setValue("fecha_nacimiento", p.fecha_nacimiento?.split('T')[0] || "");
                    form.setValue("telefono", p.telefono || "");
                    form.setValue("persona_observaciones", p.observaciones || "");
                    toast.info("Ciudadano identificado.");
                } else {
                    // Si no se encuentra, limpiar datos previos para permitir registro nuevo
                    setPersonaEncontrada(null);
                    form.setValue("nombres", "");
                    form.setValue("apellido_paterno", "");
                    form.setValue("apellido_materno", "");
                    form.setValue("fecha_nacimiento", "");
                    form.setValue("telefono", "");
                    form.setValue("persona_observaciones", "");
                }
            });
        }
    }, [dniValue, form]);

    // Búsqueda de duplicados por nombre (si no hay DNI o para verificar)
    useEffect(() => {
        if (nombresValue?.length > 2 && paternoValue?.length > 2 && maternoValue?.length > 2 && !dniValue) {
            const timer = setTimeout(() => {
                personasService.buscarDuplicados(nombresValue, paternoValue, maternoValue)
                    .then(personas => {
                        if (personas.length > 0 && !personaEncontrada) {
                            const p = personas[0];
                            toast.warning("Posible registro duplicado encontrado", {
                                description: `Existe un ciudadano llamado ${p.apellido_paterno} ${p.apellido_materno}, ${p.nombres} registrado previamente.`,
                                duration: 8000
                            });
                        }
                    });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [nombresValue, paternoValue, maternoValue, dniValue, personaEncontrada]);

    // Validación de Acta Duplicada por Número (Preventiva)
    useEffect(() => {
        if (numActaValue && numActaValue.length >= 1) {
            const timer = setTimeout(() => {
                actasService.getAll({
                    numero: String(numActaValue).trim()
                }).then(response => {
                    const actas = response.data || [];
                    const existente = actas.find(a =>
                        String(a.numero_acta).trim() === String(numActaValue).trim()
                    );

                    if (existente) {
                        setActaEncontrada(existente);
                        const esMismaPersona = existente.dni === dniValue;

                        toast.warning(
                            `Aviso: El acta N° ${numActaValue} ya está registrada en el sistema.`,
                            {
                                duration: 10000,
                                description: esMismaPersona
                                    ? `Este ciudadano (${existente.tipo_acta}) ya tiene este número de acta.`
                                    : `Registrada para otro ciudadano en ${existente.anio} (${existente.tipo_acta}).`
                            }
                        );
                    } else {
                        setActaEncontrada(null);
                    }
                }).catch(err => {
                    console.error("Error checking actas:", err);
                });
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [numActaValue, tipoActaValue, dniValue]);

    const resetAll = () => {
        form.reset();
        setFile(null);
        setPersonaEncontrada(null);
        toast.success("Formulario limpiado");
    };

    const onSubmit = async (values: FormValues) => {
        // Bloqueo estricto: El objetivo de esta página es la DIGITALIZACIÓN
        if (!file) {
            toast.error("Documento Requerido", {
                description: "Debe adjuntar el sustento digital (PDF o Imagen) para proceder con el registro.",
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Crear o actualizar persona
            let personaId = personaEncontrada?.id;
            if (personaId) {
                // Si la persona existe, actualizamos sus datos (corrección simultánea)
                await personasService.update(personaId, {
                    tipo_documento: values.tipo_documento,
                    nombres: values.nombres,
                    apellido_paterno: values.apellido_paterno,
                    apellido_materno: values.apellido_materno,
                    sexo: values.sexo,
                    fecha_nacimiento: values.fecha_nacimiento,
                    telefono: values.telefono,
                    observaciones: values.persona_observaciones
                });
            } else {
                const newPersona = await personasService.create({
                    tipo_documento: values.tipo_documento,
                    dni: values.dni,
                    nombres: values.nombres,
                    apellido_paterno: values.apellido_paterno,
                    apellido_materno: values.apellido_materno,
                    sexo: values.sexo,
                    fecha_nacimiento: values.fecha_nacimiento,
                    telefono: values.telefono,
                    observaciones: values.persona_observaciones
                });
                personaId = newPersona.id;
            }

            // 2. Crear o Actualizar Acta
            let currentActaId: number;
            if (actaEncontrada) {
                const updatedActa = await actasService.update(actaEncontrada.id, {
                    tipo_acta: values.tipo_acta,
                    numero_acta: values.numero_acta,
                    anio: values.anio,
                    fecha_acta: values.fecha_acta,
                    persona_principal_id: personaId,
                    observaciones: values.acta_observaciones
                });
                currentActaId = updatedActa.id;
            } else {
                const newActa = await actasService.create({
                    tipo_acta: values.tipo_acta,
                    numero_acta: values.numero_acta,
                    anio: values.anio,
                    fecha_acta: values.fecha_acta,
                    persona_principal_id: personaId as number,
                    observaciones: values.acta_observaciones
                });
                currentActaId = newActa.id;
            }

            // 3. Subir Documento si hay
            if (file) {
                try {
                    await documentosService.upload(currentActaId, file);
                    toast.success("Operación exitosa: Datos y documento actualizados.");
                } catch (err) {
                    toast.warning("Datos guardados, pero falló la subida del archivo.");
                }
            } else {
                toast.success(actaEncontrada ? "Acta actualizada con éxito." : "Nueva acta registrada con éxito.");
            }

            resetAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al procesar el registro integral");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header de la Página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-foreground">
                        <div className="bg-primary p-2.5 rounded-xl shadow-primary/20 shadow-lg">
                            <FileDigit className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Consola de Digitalización</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-xs ml-1">
                        Gestión eficiente y procesamiento de archivo digital de actas y documentos.
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">

                        {/* COLUMNA IZQUIERDA: DATOS DEL CIUDADANO (7/12) */}
                        <div className="lg:col-span-7 space-y-3">
                            <Card className="shadow-sm border-border rounded-2xl overflow-hidden bg-card py-0 gap-0">
                                <CardHeader className="h-9 flex items-center px-5 border-b bg-muted/40 !py-0 !pb-0">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <User size={14} className="text-primary" />
                                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 leading-none">1. INFORMACIÓN DEL CIUDADANO</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 py-4 space-y-3.5">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="tipo_documento"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label mb-1.5 uppercase font-bold text-[10px] text-primary">Tipo Doc.</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={!!personaEncontrada}>
                                                        <FormControl>
                                                            <SelectTrigger className={cn("std-input h-10 font-bold bg-muted/20 border-primary/20", !!personaEncontrada && "opacity-80")}>
                                                                <SelectValue placeholder="—" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {tiposDocumento.length > 0 ? (
                                                                tiposDocumento.map((tipo) => (
                                                                    <SelectItem key={tipo.id} value={tipo.nombre} className="font-semibold text-xs">
                                                                        {tipo.nombre}
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <SelectItem value="DNI" className="font-semibold text-xs">DNI</SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="dni"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label mb-1.5">N° Documento</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Número..."
                                                            {...field}
                                                            maxLength={15}
                                                            className="std-input text-sm font-semibold tracking-widest focus-visible:ring-primary"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="fecha_nacimiento"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label mb-1.5">F. Nacimiento</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input type="date" {...field} className="std-input pl-9 text-xs" disabled={!!personaEncontrada} />
                                                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="sexo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label mb-1.5">Sexo</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!!personaEncontrada}>
                                                        <FormControl>
                                                            <SelectTrigger className="std-input font-semibold text-sm">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="M" className="font-semibold">M</SelectItem>
                                                            <SelectItem value="F" className="font-semibold">F</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <FormField
                                            control={form.control}
                                            name="nombres"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label mb-1.5">Nombres</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled={!!personaEncontrada}
                                                            placeholder="Nombres"
                                                            className="std-input font-semibold uppercase tracking-tight text-xs"
                                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="apellido_paterno"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label mb-1.5">Ap. Paterno</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled={!!personaEncontrada}
                                                            placeholder="Paterno"
                                                            className="std-input font-semibold uppercase tracking-tight text-xs"
                                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="apellido_materno"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label mb-1.5">Ap. Materno</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled={!!personaEncontrada}
                                                            placeholder="Materno"
                                                            className="std-input font-semibold uppercase tracking-tight text-xs"
                                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                        <div className="md:col-span-4">
                                            <FormField
                                                control={form.control}
                                                name="telefono"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="std-label mb-1.5">Teléfono</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input placeholder="Opcional" {...field} disabled={!!personaEncontrada} className="std-input pl-9 text-xs" />
                                                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-8">
                                            <FormField
                                                control={form.control}
                                                name="persona_observaciones"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="std-label mb-1.5 text-muted-foreground">Observaciones del Ciudadano</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                disabled={!!personaEncontrada}
                                                                placeholder="Aclaraciones..."
                                                                className="std-input min-h-[40px] py-2 resize-none border-border/60 bg-muted/20 text-xs"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* COLUMNA DERECHA: DATOS DEL ACTA Y ARCHIVO (5/12) */}
                        <div className="lg:col-span-5 space-y-3">
                            <Card className="shadow-sm border-border rounded-2xl overflow-hidden bg-card py-0 gap-0">
                                <CardHeader className="h-9 flex items-center px-5 border-b bg-muted/40 !py-0 !pb-0">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <FileText size={14} className="text-primary" />
                                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 leading-none">2. Especificaciones del Acta</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 py-4 space-y-3.5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="md:col-span-12 lg:col-span-7">
                                            <FormField
                                                control={form.control}
                                                name="tipo_acta"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="std-label mb-1.5">Tipo de Acta</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!actaEncontrada}>
                                                            <FormControl>
                                                                <SelectTrigger className="std-input font-semibold text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="NACIMIENTO" className="font-semibold">Nacimiento</SelectItem>
                                                                <SelectItem value="MATRIMONIO" className="font-semibold">Matrimonio</SelectItem>
                                                                <SelectItem value="DEFUNCION" className="font-semibold">Defunción</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-12 lg:col-span-5">
                                            <FormField
                                                control={form.control}
                                                name="fecha_acta"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="std-label mb-1.5">F. Registro</FormLabel>
                                                        <FormControl>
                                                            <Input type="date" {...field} disabled={!!actaEncontrada} className="std-input text-xs" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                        <div className="md:col-span-8">
                                            <FormField
                                                control={form.control}
                                                name="numero_acta"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="std-label mb-1.5">N° de Acta</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="EJ: 450-A"
                                                                className="std-input font-semibold uppercase text-xs"
                                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-4">
                                            <FormField
                                                control={form.control}
                                                name="anio"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="std-label mb-1.5">Año</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} disabled className="std-input bg-muted/50 text-muted-foreground font-bold text-xs" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="acta_observaciones"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="std-label mb-1.5">Notas del Acta</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        disabled={!!actaEncontrada}
                                                        placeholder="Observaciones..."
                                                        className="std-input min-h-[40px] py-1 resize-none border-border/60 bg-muted/20 text-xs"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* SECCIÓN 3: DOCUMENTO DIGITAL */}
                            <Card className="shadow-sm border-border rounded-2xl overflow-hidden bg-card py-0 gap-0">
                                <CardHeader className="h-9 flex items-center px-5 border-b bg-muted/40 !py-0 !pb-0">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Upload size={14} className="text-primary" />
                                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 leading-none">3. Archivo Digitalizado</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 py-4">
                                    <div
                                        className={cn(
                                            "border-2 border-dashed rounded-2xl p-3 text-center transition-all cursor-pointer relative group",
                                            file
                                                ? "border-primary bg-primary/5 shadow-inner"
                                                : "border-border hover:border-primary/50 hover:bg-muted/30"
                                        )}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                                        }}
                                        onClick={() => document.getElementById('file-upload-main')?.click()}
                                    >
                                        <div className="flex flex-col items-center">
                                            {file ? (
                                                <div className="bg-primary/20 p-2 rounded-full mb-1 group-hover:scale-110 transition-transform">
                                                    <CheckCircle2 className="h-6 w-6 text-primary" />
                                                </div>
                                            ) : (
                                                <div className="bg-muted p-2 rounded-full mb-1 group-hover:scale-110 transition-transform">
                                                    <Upload className="h-6 w-6 text-muted-foreground/30" />
                                                </div>
                                            )}

                                            <span className="font-bold text-foreground text-xs tracking-tight uppercase">
                                                {file ? file.name : "Subir Documento Digital"}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground/60 mt-0.5 uppercase font-bold tracking-wider">
                                                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB — LISTO` : "PDF, JPG o PNG (MAX 10MB)"}
                                            </span>

                                            {file && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFile(null);
                                                    }}
                                                    className="mt-6 text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-black uppercase text-[10px] tracking-wider h-10 px-4 rounded-xl border border-rose-100"
                                                >
                                                    <Trash2 size={14} className="mr-2" /> Eliminar Archivo
                                                </Button>
                                            )}
                                        </div>
                                        {!file && (
                                            <>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    id="file-upload-main"
                                                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                                    accept="application/pdf,image/*"
                                                />
                                                <Button type="button" variant="outline" className="mt-6 border-border btn-std text-[10px] uppercase font-bold tracking-widest bg-card">
                                                    Examinar Archivos
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    {!file && (
                                        <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase rounded-xl border border-amber-100 dark:border-amber-900/30 tracking-tight leading-none shadow-sm">
                                            <AlertCircle size={14} />
                                            <span>Documento estrictamente obligatorio.</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>

            {/* BARRA DE ACCIONES FIJA (STICKY BOTTOM BAR) */}
            <div className="fixed bottom-0 left-0 right-0 md:left-20 lg:left-64 bg-background/80 backdrop-blur-md border-t border-border p-2 z-40 animate-in slide-in-from-bottom-full duration-500 shadow-[0_-4px_15px_rgb(0,0,0,0.03)] transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Estado de Carga</span>
                        <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", file ? "bg-emerald-500" : "bg-amber-500")} />
                            <span className="text-xs font-bold text-foreground">
                                {file ? "Documento Adjunto" : "Falta Documento"}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <Button
                            variant="outline"
                            onClick={resetAll}
                            disabled={loading}
                            className="flex-1 md:flex-none h-12 px-8 rounded-xl font-bold uppercase text-[11px] tracking-widest border-border hover:bg-muted"
                        >
                            <RotateCcw size={16} className="mr-2" /> Limpiar
                        </Button>
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={loading}
                            className="flex-1 md:flex-none h-12 px-10 rounded-xl font-bold uppercase text-[11px] tracking-widest btn-primary shadow-xl shadow-primary/20"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    Guardar Registro Integral
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
