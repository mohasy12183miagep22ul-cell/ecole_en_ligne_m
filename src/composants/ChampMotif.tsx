import { Champ } from '@/composants/Champ';
import { couleurs } from '@/theme/tokens';

export const MOTIF_MIN = 5;
export const MOTIF_MAX = 250;

/** Motif journalisé côté serveur (RG22) : 5 à 250 caractères. */
export function ChampMotif({
  valeur,
  onChange,
  libelle = 'Motif (journalisé)',
  placeholder,
}: {
  valeur: string;
  onChange: (t: string) => void;
  libelle?: string;
  placeholder?: string;
}) {
  const n = valeur.trim().length;
  return (
    <Champ
      libelle={libelle}
      value={valeur}
      onChangeText={onChange}
      multiline
      maxLength={MOTIF_MAX}
      placeholder={placeholder}
      aide={`${valeur.length} / ${MOTIF_MAX} · ${MOTIF_MIN} caractères minimum`}
      couleurAide={n >= MOTIF_MIN ? couleurs.texteSecondaire : couleurs.texteTertiaire}
    />
  );
}

export function verifierMotif(valeur: string) {
  return valeur.trim().length < MOTIF_MIN ? `Indiquez un motif (${MOTIF_MIN} caractères minimum).` : null;
}
