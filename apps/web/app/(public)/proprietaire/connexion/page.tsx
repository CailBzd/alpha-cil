import { ConnexionForm } from "../../../ConnexionForm";

export default function ProprietaireConnexionPage() {
  return (
    <ConnexionForm
      title="Connexion propriétaire"
      redirectPath="/proprietaire/espace"
      inscriptionHref="/proprietaire/inscription"
    />
  );
}
