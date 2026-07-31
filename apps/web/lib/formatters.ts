export const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });
export const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
});
export const montantFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
export const consommationFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
export const surfaceFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
