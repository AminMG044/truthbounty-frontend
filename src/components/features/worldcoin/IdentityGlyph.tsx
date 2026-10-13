import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type IdentityGlyphName =
  | 'shield' | 'loading' | 'success' | 'error' | 'clock' | 'warning'
  | 'refresh' | 'help' | 'calendar' | 'award' | 'users' | 'lock' | 'zap' | 'info';

const GLYPHS: Record<IdentityGlyphName, string> = {
  shield: '◇', loading: '◌', success: '✓', error: '×', clock: '◷', warning: '!',
  refresh: '↻', help: '?', calendar: '▦', award: '★', users: '••', lock: '▣',
  zap: 'ϟ', info: 'i',
};

interface IdentityGlyphProps extends HTMLAttributes<HTMLSpanElement> {
  name: IdentityGlyphName;
}

/** Lightweight decorative glyphs keep the identity route out of the shared icon bundle. */
export function IdentityGlyph({ name, className, ...props }: IdentityGlyphProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center text-sm font-bold leading-none',
        name === 'loading' && 'animate-spin',
        className,
      )}
      {...props}
    >
      {GLYPHS[name]}
    </span>
  );
}
