"use client"

import { useTheme } from "./ThemeProvider"
import { SunIcon, MoonIcon, BellIcon } from "@heroicons/react/24/outline"

export default function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">Inventory Management</h2>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <BellIcon className="w-5 h-5" />
        </button>

        <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          {theme === "light" ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
}
