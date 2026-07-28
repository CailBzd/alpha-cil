export const DEVIS_STATUT_OPTIONS = [
  { value: "demande", label: "Demandé" },
  { value: "recu", label: "Reçu" },
  { value: "accepte", label: "Accepté" },
  { value: "refuse", label: "Refusé" },
] as const;

export function devisStatutLabel(value: string) {
  return DEVIS_STATUT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
