import { Tabs } from 'expo-router';

import { faChartColumn, faClipboardList, faCommentDots, faUsers } from '@/composants/icones';
import { iconeOnglet, optionsOnglets } from '@/composants/navigation';
import { accents } from '@/theme/tokens';

export default function OngletsEnseignant() {
  return (
    <Tabs screenOptions={optionsOnglets(accents.enseignant)}>
      <Tabs.Screen name="classes" options={{ title: 'Mes classes', tabBarLabel: 'Mes classes', tabBarIcon: iconeOnglet(faUsers) }} />
      <Tabs.Screen
        name="evaluations"
        options={{ title: 'Mes évaluations', tabBarLabel: 'Évaluations', tabBarIcon: iconeOnglet(faClipboardList) }}
      />
      <Tabs.Screen
        name="appreciations"
        options={{ title: 'Appréciations', tabBarLabel: 'Appréciations', tabBarIcon: iconeOnglet(faCommentDots) }}
      />
      <Tabs.Screen
        name="recap"
        options={{ title: 'Récapitulatif', tabBarLabel: 'Récap', tabBarIcon: iconeOnglet(faChartColumn) }}
      />
    </Tabs>
  );
}
