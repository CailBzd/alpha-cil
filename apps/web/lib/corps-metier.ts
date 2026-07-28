export const CORPS_METIER_OPTIONS = [
  { value: "plombier", label: "Plombier" },
  { value: "electricien", label: "Électricien" },
  { value: "chauffagiste", label: "Chauffagiste" },
  { value: "couvreur", label: "Couvreur" },
  { value: "macon", label: "Maçon" },
  { value: "menuisier", label: "Menuisier" },
  { value: "peintre", label: "Peintre" },
  { value: "carreleur", label: "Carreleur" },
  { value: "autre", label: "Autre" },
] as const;

export function corpsMetierLabel(value: string | null | undefined) {
  if (!value) {
    return "Non renseigné";
  }
  return CORPS_METIER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
