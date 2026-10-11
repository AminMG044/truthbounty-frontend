import type { Meta, StoryObj } from '@storybook/react';
import Image from 'next/image';

import { BRAND_COLOR_TOKENS, SEMANTIC_STATE_TOKENS } from '@/lib/design-tokens';
import { TRUTHBOUNTY_BRAND_ASSETS } from '@/lib/brand';

const palette = { ...BRAND_COLOR_TOKENS, ...SEMANTIC_STATE_TOKENS };

function BrandFoundation() {
  return (
    <div style={{ display: 'grid', gap: 'var(--tb-space-8)', width: 'min(960px, 90vw)' }}>
      <section aria-labelledby="wordmarks-heading">
        <h2 id="wordmarks-heading" className="tb-section">Approved wordmarks</h2>
        <div style={{ display: 'grid', gap: 'var(--tb-space-4)', marginTop: 'var(--tb-space-4)' }}>
          <div style={{ padding: 'var(--tb-space-4)', background: '#070A12', borderRadius: 'var(--tb-radius-lg)' }}>
            <Image src={TRUTHBOUNTY_BRAND_ASSETS.landscapeDark} alt="TruthBounty" width={480} height={128} priority />
          </div>
          <div style={{ padding: 'var(--tb-space-4)', background: '#F7F9FC', borderRadius: 'var(--tb-radius-lg)' }}>
            <Image src={TRUTHBOUNTY_BRAND_ASSETS.landscapeLight} alt="TruthBounty" width={480} height={128} />
          </div>
        </div>
      </section>

      <section aria-labelledby="marks-heading">
        <h2 id="marks-heading" className="tb-section">Evidence Shield assets</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--tb-space-4)', marginTop: 'var(--tb-space-4)' }}>
          <Image src={TRUTHBOUNTY_BRAND_ASSETS.glyph} alt="TruthBounty" width={128} height={128} />
          <Image src={TRUTHBOUNTY_BRAND_ASSETS.appIcon} alt="TruthBounty application icon" width={128} height={128} />
          <div style={{ padding: 'var(--tb-space-4)', color: '#070A12', background: '#F7F9FC', borderRadius: 'var(--tb-radius-lg)' }}>
            <Image src={TRUTHBOUNTY_BRAND_ASSETS.glyphMonochrome} alt="TruthBounty monochrome mark" width={96} height={96} />
          </div>
        </div>
      </section>

      <section aria-labelledby="tokens-heading">
        <h2 id="tokens-heading" className="tb-section">Approved colour tokens</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--tb-space-3)', marginTop: 'var(--tb-space-4)' }}>
          {Object.entries(palette).map(([name, value]) => (
            <div key={name} style={{ padding: 'var(--tb-space-3)', background: 'var(--tb-surface)', border: '1px solid var(--tb-border)', borderRadius: 'var(--tb-radius-md)' }}>
              <div aria-hidden="true" style={{ height: 48, background: value, borderRadius: 'var(--tb-radius-sm)' }} />
              <strong style={{ display: 'block', marginTop: 'var(--tb-space-2)' }}>{name}</strong>
              <code>{value}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: 'Foundation/Brand and tokens',
  component: BrandFoundation,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BrandFoundation>;

export default meta;
type Story = StoryObj<typeof meta>;
export const ApprovedFoundation: Story = {};
