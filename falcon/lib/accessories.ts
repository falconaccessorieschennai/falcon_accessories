/**
 * Static accessory catalog for the Falcon Accessories Job Card Management System.
 *
 * The catalog is keyed by category name and contains an ordered list of
 * `AccessoryDefinition` objects. Accessories with predefined variant options
 * include a non-empty `variants` array; all others use an empty array.
 */

import type { AccessoryDefinition } from '@/types';

/**
 * The complete, static accessory catalog used to populate the job card form.
 *
 * Categories:
 *  - Safety & Security
 *  - Essential
 *  - Entertainment
 *  - Ambience
 */
export const ACCESSORY_CATALOG: Record<string, AccessoryDefinition[]> = {
  'Safety & Security': [
    { id: 'dash-camera',    name: 'Dash Camera',                 variants: [] },
    { id: 'rear-bumper',    name: 'Rear Bumper',                 variants: [] },
    { id: 'gps-tracker',    name: 'GPS Tracker',                 variants: [] },
    { id: 'reverse-camera', name: 'Reverse Camera / 360 Camera', variants: [] },
    { id: 'door-guard',     name: 'Door Guard',                  variants: [] },
  ],

  'Essential': [
    { id: 'sun-film',         name: 'Sun Film',         variants: [] },
    {
      id: 'seat-cover',
      name: 'Seat Cover',
      variants: ['Fabric', 'Leather', 'Premium Leather'],
    },
    {
      id: 'led-bulb',
      name: 'LED Bulb',
      variants: ['Basic', 'Premium', 'Ultra Bright'],
    },
    { id: 'steering-cover',   name: 'Steering Cover',   variants: [] },
    { id: 'projector-lights', name: 'Projector Lights', variants: [] },
    { id: 'horn',             name: 'Horn',             variants: [] },
    { id: 'wheel-cup',        name: 'Wheel Cup',        variants: [] },
    { id: 'full-chrome-item', name: 'Full Chrome Item', variants: [] },
  ],

  'Entertainment': [
    { id: 'android-system', name: 'Android System', variants: [] },
    { id: 'speakers',       name: 'Speakers',       variants: [] },
    { id: 'sub-woofers',    name: 'Sub Woofers',    variants: [] },
    {
      id: 'ambient-light',
      name: 'Ambient Light',
      variants: ['7 Color', '18 Color', 'App Controlled'],
    },
    { id: 'police-light', name: 'Police Light', variants: [] },
  ],

  'Ambience': [
    { id: 'hydro-dipping',  name: 'Hydro Dipping Interior Painting', variants: [] },
    { id: 'recliner-seats', name: 'Recliner Seats',                  variants: [] },
  ],
};

/** Ordered list of category names, matching the display order in the form. */
export const ACCESSORY_CATEGORIES = Object.keys(ACCESSORY_CATALOG) as Array<
  keyof typeof ACCESSORY_CATALOG
>;
