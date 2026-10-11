import fs from 'node:fs';
import path from 'node:path';

import {
  BRAND_COLOR_TOKENS,
  CONTROL_HEIGHT_TOKENS,
  MOTION_TOKENS,
  RADIUS_TOKENS,
  SEMANTIC_STATE_TOKENS,
  SPACING_TOKENS,
} from '@/lib/design-tokens';
import { TRUTHBOUNTY_BRAND_ASSETS } from '@/lib/brand';

const globalsCss = fs.readFileSync(path.resolve(__dirname, '../../app/globals.css'), 'utf8');

describe('approved brand assets and foundation tokens (UI-FE-001)', () => {
  it.each(Object.values(TRUTHBOUNTY_BRAND_ASSETS))('installs %s as an undistorted SVG', (assetPath) => {
    const svg = fs.readFileSync(path.resolve(process.cwd(), 'public', assetPath.slice(1)), 'utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox=');
  });

  it('keeps the canonical brand and semantic palette', () => {
    for (const value of [...Object.values(BRAND_COLOR_TOKENS), ...Object.values(SEMANTIC_STATE_TOKENS)]) {
      expect(globalsCss.toLowerCase()).toContain(value.toLowerCase());
    }
    expect(globalsCss.toLowerCase()).not.toContain('#5b5bf6');
    expect(globalsCss.toLowerCase()).not.toContain('#7c7cf7');
  });

  it('exposes the approved spacing, radius, control and motion scales', () => {
    expect(SPACING_TOKENS).toEqual([4, 8, 12, 16, 24, 32, 48, 64]);
    expect(RADIUS_TOKENS).toEqual([8, 12, 16, 20]);
    expect(CONTROL_HEIGHT_TOKENS).toEqual({ compact: 36, default: 44, large: 52 });
    expect(MOTION_TOKENS).toEqual({ feedback: 120, component: 180, drawer: 240 });
    expect(globalsCss).toContain('--tb-touch-min: 2.75rem');
  });
});
