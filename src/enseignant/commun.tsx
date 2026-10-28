import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { mesAffectations, periodesDe } from '@/api';
import type { CarteAffectation, Saisie, TypeEvaluation } from '@/api/types';
import type { IconeDef } from '@/composants/Icone';
import { faFilePen, faFileSignature, faFlaskVial, faLock, faMicrophone, faPen } from '@/composants/icones';
import { Puces } from '@/composants/Selecteurs';
import { Texte } from '@/composants/Texte';
import { cles } from '@/requetes/cles';
import { couleurs, espaces } from '@/theme/tokens';
import { dateCourte } from '@/utils/format';

export const ICONES_TYPE: Record<TypeEvaluation, IconeDef> = {
  interrogation: faPen,
  devoir: faFilePen,
  composition: faFileSignature,
  tp: faFlaskVial,
  oral: faMicrophone,
};

export function useAffectations() {
  return useQuery({ queryKey: cles.affectations, queryFn: mesAffectations });
}

export function usePeriodes(affectation: number | null) {
  return useQuery({
    queryKey: cles.periodes(affectation ?? 0),
    queryFn: () => periodesDe(affectation as number),
    enabled: affectation !== null,
  });
}

export const nomAffectation = (a: Pick<CarteAffectation, 'classe' | 'matiere'>) => `${a.classe} · ${a.matiere}`;

/** Phrase décrivant la fenêtre de saisie (RG13). */
export function phraseSaisie(saisie: Saisie | null, periode?: string) {
  if (!saisie) return 'Aucune période de saisie';
  if (saisie.ouverte) {
    const de = periode ? ` du ${periode}` : '';
    return saisie.derogation
      ? `Saisie${de} rouverte par la direction jusqu’au ${dateCourte(saisie.jusquAu)}`
      : `Saisie${de} ouverte jusqu’au ${dateCourte(saisie.jusquAu)}`;
  }
  return saisie.raison === 'a_venir' ? 'Saisie pas encore ouverte' : 'Saisie close';
}

/** Choix de la classe et de la matière, en puces défilantes. */
export function SelecteurAffectation({
  affectations,
  valeur,
  onChange,
  toutes,
}: {
  affectations: CarteAffectation[];
  valeur: number | null;
  onChange: (id: number | null) => void;
  toutes?: boolean;
}) {
  const options = [
    ...(toutes ? [{ cle: 0, libelle: 'Toutes' }] : []),
    ...affectations.map((a) => ({ cle: a.id, libelle: affectations.length > 1 ? nomAffectation(a) : a.classe })),
  ];
  return (
    <Puces
      options={options}
      valeur={valeur ?? 0}
      onChange={(cle) => onChange(cle === 0 ? null : cle)}
      libelleGroupe="Classe et matière"
    />
  );
}

/**
 * Choix de la période d'une affectation, la courante par défaut. Les
 * périodes dont la saisie est close portent un cadenas.
 */
export function SelecteurPeriode({
  affectation,
  valeur,
  onChange,
}: {
  affectation: number;
  valeur: number | null;
  onChange: (id: number) => void;
}) {
  const { data } = usePeriodes(affectation);
  const periodes = data?.periodes ?? [];
  const courante = periodes.find((p) => p.courante)?.id ?? periodes[0]?.id ?? null;

  useEffect(() => {
    if (valeur === null && courante !== null) onChange(courante);
  }, [valeur, courante, onChange]);

  if (periodes.length <= 1) {
    return periodes[0] ? (
      <View style={styles.seule}>
        <Texte taille="m" graisse={600} couleur={couleurs.texteSecondaire}>
          {periodes[0].libelle}
        </Texte>
      </View>
    ) : null;
  }
  return (
    <Puces
      options={periodes.map((p) => ({ cle: p.id, libelle: p.libelle, icone: p.saisie.ouverte ? undefined : faLock }))}
      valeur={valeur}
      onChange={onChange}
      libelleGroupe="Période"
    />
  );
}

const styles = StyleSheet.create({
  seule: { paddingVertical: espaces.xs },
});
