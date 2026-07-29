"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/proprietaire/espace", label: "Mon logement", exact: true },
  { href: "/proprietaire/espace/finances", label: "Suivi financier", exact: false },
  { href: "/proprietaire/espace/contacts", label: "Carnet de contacts", exact: false },
  { href: "/proprietaire/espace/rappels", label: "Mes rappels", exact: false },
  { href: "/proprietaire/espace/projets", label: "Mes projets", exact: false },
  { href: "/proprietaire/espace/acces", label: "Gérer les accès", exact: false },
  { href: "/proprietaire/espace/export", label: "Exporter", exact: false },
] as const;

export function EspaceSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 space-y-1">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "block rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm"
                : "block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
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
