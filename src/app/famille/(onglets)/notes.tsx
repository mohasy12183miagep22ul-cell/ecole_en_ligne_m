import { EtatVide } from '@/composants/EtatVide';
import { faLock } from '@/composants/icones';
import { EcranEnfant } from '@/famille/EcranEnfant';

/**
 * RG18 : une note n'est visible par la famille qu'avec la publication du
 * bulletin. Le serveur n'expose encore aucune note au portail ; l'écran ne
 * montre donc rien, et ne laisse pas croire le contraire.
 */
export default function Notes() {
  return (
    <EcranEnfant>
      {(enfant) => (
        <EtatVide
          icone={faLock}
          titre="En attente de publication par l’établissement"
          texte={`Les notes de ${enfant.prenoms} deviennent visibles uniquement après la délivrance officielle du bulletin de la période.`}
        />
      )}
    </EcranEnfant>
  );
}
