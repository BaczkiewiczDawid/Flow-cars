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

function settingsPath(userId?: number) {
  return path.join(
    process.cwd(),
    userId ? `.flowcars-settings-${userId}.json` : '.flowcars-settings.json'
  );
}

export function getSettings(userId?: number): AppSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(settingsPath(userId), 'utf-8')) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(patch: Partial<AppSettings>, userId?: number): void {
  fs.writeFileSync(
    settingsPath(userId),
    JSON.stringify({ ...getSettings(userId), ...patch }, null, 2),
    'utf-8'
  );
}
