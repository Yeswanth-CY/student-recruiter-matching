"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sun, Moon, Palette } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const themes = [
    { name: "Light", value: "light", icon: <Sun className="h-4 w-4 mr-2" /> },
    { name: "Dark", value: "dark", icon: <Moon className="h-4 w-4 mr-2" /> },
    { name: "Blue", value: "blue", icon: <div className="h-3 w-3 rounded-full bg-blue-500 mr-2" /> },
    { name: "Green", value: "green", icon: <div className="h-3 w-3 rounded-full bg-green-500 mr-2" /> },
    { name: "Purple", value: "purple", icon: <div className="h-3 w-3 rounded-full bg-purple-500 mr-2" /> },
    { name: "Orange", value: "orange", icon: <div className="h-3 w-3 rounded-full bg-orange-500 mr-2" /> },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`flex items-center ${theme === t.value ? "bg-accent" : ""}`}
          >
            {t.icon}
            {t.name}
            {theme === t.value && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
