import { Tabs } from 'expo-router';

import { faCircleCheck, faFolderOpen, faListCheck } from '@/composants/icones';
import { iconeOnglet, optionsOnglets } from '@/composants/navigation';
import { accents } from '@/theme/tokens';

export default function OngletsDirection() {
  return (
    <Tabs screenOptions={optionsOnglets(accents.direction)}>
      <Tabs.Screen
        name="validation"
        options={{ title: 'Validation des évaluations', tabBarLabel: 'Validation', tabBarIcon: iconeOnglet(faCircleCheck) }}
      />
      <Tabs.Screen
        name="suivi"
        options={{ title: 'Suivi des saisies', tabBarLabel: 'Suivi', tabBarIcon: iconeOnglet(faListCheck) }}
      />
      <Tabs.Screen
        name="inscriptions"
        options={{ title: 'Inscriptions à valider', tabBarLabel: 'Inscriptions', tabBarIcon: iconeOnglet(faFolderOpen) }}
      />
    </Tabs>
  );
}
