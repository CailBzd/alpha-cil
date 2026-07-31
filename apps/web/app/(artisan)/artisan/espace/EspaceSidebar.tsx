"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/artisan/espace", label: "Mes interventions", exact: true },
  { href: "/artisan/espace/rendez-vous", label: "Mes rendez-vous", exact: false },
  { href: "/artisan/espace/recherche-adresse", label: "Rechercher une adresse", exact: false },
  { href: "/artisan/espace/profil", label: "Mon profil", exact: false },
] as const;

export function EspaceSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 sm:w-48 sm:shrink-0 sm:flex-col sm:overflow-visible sm:space-y-1 sm:pb-0">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "block shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm"
                : "block shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            }
            style={
              active
                ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }
                : undefined
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
