export const CHAUFFAGE_OPTIONS = [
  { value: "gaz", label: "Gaz" },
  { value: "electrique", label: "Électrique" },
  { value: "bois", label: "Bois" },
  { value: "pompe_a_chaleur", label: "Pompe à chaleur" },
  { value: "autre", label: "Autre" },
] as const;

export const VMC_OPTIONS = [
  { value: "simple_flux", label: "VMC simple flux" },
  { value: "double_flux", label: "VMC double flux" },
  { value: "aucune", label: "Aucune" },
] as const;
