"use client"

/**
 * theme-toggle.tsx
 * Sun/moon button to switch between light and dark themes.
 * Uses next-themes useTheme hook + shadcn Button + lucide-react icons.
 */

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // Avoid hydration mismatch — render placeholder on server
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Toggle theme">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200" />
      )}
    </Button>
  )
}
