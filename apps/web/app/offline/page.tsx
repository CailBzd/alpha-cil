export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Pas de connexion
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Foya a besoin d&apos;une connexion internet pour afficher votre carnet. Réessayez
        une fois reconnecté.
      </p>
    </div>
  );
}
