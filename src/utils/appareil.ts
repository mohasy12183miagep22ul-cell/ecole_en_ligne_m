import * as Device from 'expo-device';

/** Nom donné au jeton côté serveur (120 caractères au plus). */
export function nomAppareil() {
  return (Device.deviceName ?? Device.modelName ?? undefined)?.slice(0, 120);
}
