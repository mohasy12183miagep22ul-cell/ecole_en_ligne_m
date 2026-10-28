import { Tabs } from 'expo-router';

import { faChartSimple, faFileLines, faHouse, faIdCard } from '@/composants/icones';
import { iconeOnglet, optionsOnglets } from '@/composants/navigation';
import { accents } from '@/theme/tokens';

export default function OngletsFamille() {
  return (
    <Tabs screenOptions={optionsOnglets(accents.portail)}>
      <Tabs.Screen name="accueil" options={{ title: 'Accueil', tabBarIcon: iconeOnglet(faHouse) }} />
      <Tabs.Screen name="notes" options={{ title: 'Notes publiées', tabBarLabel: 'Notes', tabBarIcon: iconeOnglet(faChartSimple) }} />
      <Tabs.Screen name="bulletins" options={{ title: 'Bulletins', tabBarIcon: iconeOnglet(faFileLines) }} />
      <Tabs.Screen
        name="dossier"
        options={{ title: 'Informations du dossier', tabBarLabel: 'Dossier', tabBarIcon: iconeOnglet(faIdCard) }}
      />
    </Tabs>
  );
}
