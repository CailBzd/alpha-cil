import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { dateFormatter, dateTimeFormatter } from "@/lib/formatters";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4 },
  address: { fontSize: 12, marginBottom: 16, color: "#555555" },
  sectionTitle: { fontSize: 13, marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  cell: { flexGrow: 1, flexBasis: 0 },
  empty: { color: "#777777" },
});

export interface CarnetDocumentIntervention {
  id: string;
  type_travaux: string;
  date_intervention: string;
  artisan_siret: string | null;
  rge_verifie: boolean;
  rge_verifie_a: string | null;
}

export function CarnetDocument({
  adresse,
  interventions,
}: {
  adresse: string | null;
  interventions: CarnetDocumentIntervention[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Alpha CIL — Carnet de santé du logement</Text>
        {adresse ? <Text style={styles.address}>{adresse}</Text> : null}
        <Text style={styles.sectionTitle}>Interventions</Text>
        {interventions.length > 0 ? (
          interventions.map((intervention) => (
            <View key={intervention.id} style={styles.row}>
              <Text style={styles.cell}>
                {dateFormatter.format(new Date(intervention.date_intervention))}
              </Text>
              <Text style={styles.cell}>{intervention.type_travaux}</Text>
              <Text style={styles.cell}>SIRET {intervention.artisan_siret ?? "inconnu"}</Text>
              <Text style={styles.cell}>
                {intervention.rge_verifie ? "RGE vérifié" : "RGE non vérifié"}
                {intervention.rge_verifie_a
                  ? ` le ${dateTimeFormatter.format(new Date(intervention.rge_verifie_a))}`
                  : ""}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Aucune intervention sélectionnée.</Text>
        )}
      </Page>
    </Document>
  );
}
