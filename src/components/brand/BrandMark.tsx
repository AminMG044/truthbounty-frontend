"use client";

import { useId } from "react";
import { BRAND_SVGS } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "wordmark" | "glyph" | "monochrome" | "app-icon";
  theme?: "light" | "dark";
  decorative?: boolean;
  className?: string;
};

/** Only pinned, reviewed SVG constants enter this renderer; never API/user markup. */
export function BrandMark({ variant = "wordmark", theme, decorative = false, className }: Props) {
  const id = useId().replace(/:/g, "");
  const glyph = variant !== "wordmark";
  const asset = variant === "monochrome" ? "glyph-monochrome" : variant;
  return (
    <span
      className={cn("tb-brand", glyph ? "tb-brand-glyph" : "tb-brand-wordmark", className)}
      data-theme={theme}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "TruthBounty"}
      aria-hidden={decorative || undefined}
    >
      {glyph ? (
        <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: scopeSvgIds(BRAND_SVGS[asset as "glyph" | "glyph-monochrome" | "app-icon"], id) }} />
      ) : (
        <>
          <span className="tb-brand-on-dark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: scopeSvgIds(BRAND_SVGS["landscape-dark"], `${id}-dark`) }} />
          <span className="tb-brand-on-light" aria-hidden="true" dangerouslySetInnerHTML={{ __html: scopeSvgIds(BRAND_SVGS["landscape-light"], `${id}-light`) }} />
        </>
      )}
    </span>
  );
}

/** Scope identifiers only; geometry, colours and approved source bytes stay unchanged. */
function scopeSvgIds(svg: string, prefix: string): string {
  return svg.replace(/\bid="([^"]+)"/g, (_, id: string) => `id="${prefix}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${prefix}-${id})`)
    .replace(/aria-labelledby="([^"]+)"/g, (_, ids: string) => `aria-labelledby="${ids.split(" ").map(id => `${prefix}-${id}`).join(" ")}"`);
}
