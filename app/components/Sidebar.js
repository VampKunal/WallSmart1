"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon, CubeIcon, ChartBarIcon, MapIcon, Cog6ToothIcon } from "@heroicons/react/24/outline"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Inventory", href: "/inventory", icon: CubeIcon },
  { name: "Reports", href: "/reports", icon: ChartBarIcon },
  { name: "Delivery Routes", href: "/routes", icon: MapIcon },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border">
      <div className="flex items-center justify-center h-16 px-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">WallSmart</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p>WallSmart v1.0</p>
          <p>Inventory Management</p>
        </div>
      </div>
    </div>
  )
}
