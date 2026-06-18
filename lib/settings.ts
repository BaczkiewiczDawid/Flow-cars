import fs from 'fs';
import path from 'path';

export interface AppSettings {
  yearTolerance: number;
  mileageTolerance: number;
  engineTolerance: number;
  underpricedThresholdPercent: number;
  requireFuelMatch: boolean;
  dealerListingThreshold: number;
  listingsPerPortal: number;
  locationCity: string;
  locationRadiusKm: number;
  priceMin: number;
  priceMax: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  yearTolerance: 1,
  mileageTolerance: 50000,
  engineTolerance: 0,
  underpricedThresholdPercent: 15,
  requireFuelMatch: true,
  dealerListingThreshold: 3,
  listingsPerPortal: 50,
  locationCity: 'gliwice',
  locationRadiusKm: 30,
  priceMin: 0,
  priceMax: 0,
};

const SETTINGS_PATH = path.join(process.cwd(), '.flowcars-settings.json');

export function getSettings(): AppSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(patch: Partial<AppSettings>): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify({ ...getSettings(), ...patch }, null, 2), 'utf-8');
}
