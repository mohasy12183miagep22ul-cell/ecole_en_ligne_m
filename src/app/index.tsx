import { Redirect } from 'expo-router';

import { ACCUEIL_ESPACE, useSession } from '@/session/session';

/** Aiguillage : connexion, changement imposé du mot de passe, ou espace du compte. */
export default function Index() {
  const { etat, utilisateur, espace } = useSession();
  if (etat.statut !== 'connecte' || !utilisateur) return <Redirect href="/connexion" />;
  if (utilisateur.doitChangerMotDePasse) return <Redirect href="/mot-de-passe-impose" />;
  if (!espace) return <Redirect href="/web-uniquement" />;
  return <Redirect href={ACCUEIL_ESPACE[espace]} />;
}
