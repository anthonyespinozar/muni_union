"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    label?: string;
}

export function Pagination({
    total,
    page,
    limit,
    totalPages,
    onPageChange,
    label = "registros"
}: PaginationProps) {
    if (totalPages <= 0) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-muted/50 rounded-xl border border-border">
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                Mostrando <span className="text-foreground">{limit > total ? total : limit}</span> de <span className="text-foreground">{total}</span> {label}
            </div>
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="h-9 px-4 rounded-lg font-bold border-border bg-card"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <div className="flex items-center gap-1.5 mx-2">
                    <span className="text-xs font-black text-primary-foreground px-2.5 py-1 bg-primary rounded shadow-md">
                        {page}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mx-1 text-center">de</span>
                    <span className="text-xs font-black text-foreground px-2.5 py-1 bg-muted rounded">
                        {totalPages}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="h-9 px-4 rounded-lg font-bold border-border bg-card"
                >
                    Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}
