"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="
        h-10 w-10 rounded-full 
        relative 
        bg-background/60 
        backdrop-blur-md
        border border-border/40
        hover:bg-muted/60
        transition-all duration-300
        hover:scale-105
        active:scale-95
      "
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-500" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-blue-400" />
                    <span className="sr-only">Cambiar tema</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="
      w-44 
      rounded-2xl 
      border border-border/50 
      bg-background/80 
      backdrop-blur-xl
      shadow-2xl
      p-2
      animate-in fade-in zoom-in-95
    "
            >
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="
        flex items-center gap-3 
        rounded-xl 
        px-3 py-2 
        cursor-pointer 
        transition-all
        hover:bg-amber-500/10
        focus:bg-amber-500/10
      "
                >
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Modo Claro</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="
        flex items-center gap-3 
        rounded-xl 
        px-3 py-2 
        cursor-pointer 
        transition-all
        hover:bg-blue-500/10
        focus:bg-blue-500/10
      "
                >
                    <Moon className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium">Modo Oscuro</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="
        flex items-center gap-3 
        rounded-xl 
        px-3 py-2 
        cursor-pointer 
        transition-all
        hover:bg-muted/60
        focus:bg-muted/60
      "
                >
                    <span className="flex h-4 w-4 items-center justify-center text-xs">
                        ⚙️
                    </span>
                    <span className="text-sm font-medium">Sistema</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

    )
}
