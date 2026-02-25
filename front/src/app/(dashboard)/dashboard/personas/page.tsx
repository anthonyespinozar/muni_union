"use client";

import { useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { usePersonas } from "@/hooks/usePersonas";
import { PersonasTable } from "@/components/personas/PersonasTable";
import { PersonaSheet } from "@/components/personas/PersonaSheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Persona } from "@/types/persona";

export default function PersonasPage() {
    const {
        personas,
        isLoading,
        setTermino,
        createPersona,
        updatePersona,
        deletePersona,
        reactivatePersona,
        pagination,
        setPage
    } = usePersonas();

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [personaToDelete, setPersonaToDelete] = useState<number | null>(null);

    const handleNew = () => {
        setSelectedPersona(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (persona: Persona) => {
        setSelectedPersona(persona);
        setIsSheetOpen(true);
    };

    const handleDelete = (id: number) => {
        setPersonaToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (personaToDelete) {
            try {
                await deletePersona(personaToDelete);
                setPersonaToDelete(null);
            } catch (error: any) {
                toast.error(error.message || "No se pudo eliminar el ciudadano", {
                    duration: 6000
                });
            }
        }
    };

    const handleSubmit = async (data: any) => {
        if (selectedPersona) {
            return await updatePersona(selectedPersona.id, data);
        } else {
            return await createPersona(data);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-foreground">
                        <div className="bg-primary p-2.5 rounded-xl shadow-primary/20 shadow-lg">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Ciudadanos</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-xs ml-1">
                        Gestión de la base de datos de personas para registros y trámites.
                    </p>
                </div>

                <Button
                    onClick={handleNew}
                    className="btn-std btn-primary h-12 px-8 shadow-lg shadow-primary/20"
                >
                    <UserPlus className="h-5 w-5 mr-2" />
                    <span className="font-bold uppercase tracking-tight text-xs">Registrar Ciudadano</span>
                </Button>
            </div>

            <PersonasTable
                personas={personas}
                isLoading={isLoading}
                onSearch={setTermino}
                onNew={handleNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReactivate={reactivatePersona}
                pagination={pagination}
                onPageChange={setPage}
            />

            <PersonaSheet
                key={selectedPersona ? `edit-${selectedPersona.id}` : 'new-persona'}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSubmit={handleSubmit}
                persona={selectedPersona}
            />
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Ciudadano?"
                description="Esta acción eliminará al ciudadano del sistema si no tiene actas asociadas. Los datos se marcarán como inactivos y podrán ser reactivados posteriormente si es necesario."
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
}
