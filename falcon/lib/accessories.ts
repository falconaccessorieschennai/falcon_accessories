/**
 * Accessory catalog for the Falcon Accessories Job Card Management System.
 *
 * The catalog is now stored in Firestore (accessories collection).
 * This file provides the static seed data and helper constants.
 */

import type { AccessoryDefinition } from '@/types';

/**
 * Static seed data — used only for initial database seeding.
 */
export const SEED_ACCESSORY_CATALOG: Record<string, AccessoryDefinition[]> = {
  'Safety & Security': [
    { id: 'dash-camera',    name: 'Dash Camera',                 variants: [] },
    { id: 'rear-bumper',    name: 'Rear Bumper',                 variants: [] },
    { id: 'gps-tracker',    name: 'GPS Tracker',                 variants: [] },
    { id: 'reverse-camera', name: 'Reverse Camera / 360 Camera', variants: [] },
    { id: 'door-guard',     name: 'Door Guard',                  variants: [] },
  ],

  'Essential': [
    { id: 'sun-film',         name: 'Sun Film',         variants: ['Hi-Teach', 'Hi-Cool', 'Garware', '3M Film'] },
    { id: 'seat-cover',       name: 'Seat Cover',       variants: ['Fabric', 'Leather', 'Premium Leather'] },
    { id: 'led-bulb',         name: 'LED Bulb',         variants: ['Basic', 'Premium', 'Ultra Bright'] },
    { id: 'steering-cover',   name: 'Steering Cover',   variants: [] },
    { id: 'projector-lights', name: 'Projector Lights', variants: [] },
    { id: 'horn',             name: 'Horn',             variants: [] },
    { id: 'wheel-cup',        name: 'Wheel Cup',        variants: [] },
    { id: 'full-chrome-item', name: 'Full Chrome Item', variants: [] },
  ],

  'Entertainment': [
    { id: 'android-system', name: 'Android System', variants: ['TS7 - (4+64)', 'P13 - (4+64 Carplay)', 'ZY - (4+64 Carplay)', 'MTK - (4+64 Carplay)', 'T5 - (4+32 DVR Carplay)', 'T5 - (4+32 360* Carplay)', 'Diamond - (4+64 2K Carplay)', 'Diamond - (4+64 360* Carplay)', 'Rapid 13inch- (6+64 Carplay)'] },
    { id: 'speakers',       name: 'Speakers',       variants: ['component', 'coaxial'] },
    { id: 'sub-woofers',    name: 'Sub Woofers',    variants: [] },
    { id: 'ambient-light',  name: 'Ambient Light',  variants: ['7 Color', '18 Color', 'App Controlled'] },
    { id: 'police-light',   name: 'Police Light',   variants: [] },
  ],

  'Ambience': [
    { id: 'hydro-dipping',  name: 'Hydro Dipping Interior Painting', variants: [] },
    { id: 'recliner-seats', name: 'Recliner Seats',                  variants: [] },
  ],
};
