import { ConnexionForm } from "../../../ConnexionForm";

export default function ArtisanConnexionPage() {
  return (
    <ConnexionForm
      title="Connexion artisan"
      redirectPath="/artisan/espace"
      inscriptionHref="/artisan/inscription"
    />
  );
}
