/** Canonical Evidence Shield assets copied unchanged from protocol authority. */
export const TRUTHBOUNTY_BRAND_ASSETS = {
  appIcon: '/brand/truthbounty-app-icon.svg',
  glyph: '/brand/truthbounty-glyph.svg',
  glyphMonochrome: '/brand/truthbounty-glyph-monochrome.svg',
  landscapeDark: '/brand/truthbounty-landscape-dark.svg',
  landscapeLight: '/brand/truthbounty-landscape-light.svg',
} as const;

export type TruthBountyBrandAsset = keyof typeof TRUTHBOUNTY_BRAND_ASSETS;

export function truthBountyWordmarkForTheme(theme: 'dark' | 'light'): string {
  return theme === 'dark'
    ? TRUTHBOUNTY_BRAND_ASSETS.landscapeDark
    : TRUTHBOUNTY_BRAND_ASSETS.landscapeLight;
}
