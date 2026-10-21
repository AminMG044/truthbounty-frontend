import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { BrandMark } from "./BrandMark";
import { TYPE_SCALE_TOKENS } from "@/lib/design-tokens";
import authority from "@/styles/brand-authority.json";
import { BRAND_COLORS } from "@/lib/brand-tokens";

const colors = [
  ["Signal Cyan", "signal-cyan", "Evidence and focus"],
  ["Proof Blue", "proof-blue", "Action and resolved output"],
  ["Ink Navy", "ink-navy", "Dark canvas"],
  ["Deep Slate", "deep-slate", "Dark surface"],
  ["Frost White", "frost-white", "Text and light canvas"],
  ["Bounty Gold", "bounty-gold", "Rewards and staking only"],
  ["Success", "success", "Confirmed or finalized"],
  ["Attention", "attention", "Pending, deadline or projection lag"],
  ["Danger", "danger", "Failure or destructive action"],
  ["Information", "info", "Informational state"],
] as const;
const spaces = [1, 2, 3, 4, 6, 8, 12, 16] as const;
const radii = ["sm", "md", "lg", "xl", "pill"] as const;

function Foundation({ initialTheme = "dark" }: { initialTheme?: "dark" | "light" }) {
  const [theme, setTheme] = useState(initialTheme);
  return <section data-theme={theme} aria-label="Approved brand and tokens" className="w-full max-w-full space-y-8 rounded-xl bg-canvas p-4 text-ink sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-extrabold">Evidence Shield foundation</h1>
      <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="min-h-11 rounded-lg bg-action px-4 py-2 font-semibold text-action-ink hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        style={{ transitionDuration: "var(--tb-motion-feedback)" }}>
        Preview {theme === "dark" ? "light" : "dark"} theme
      </button>
    </header>
    <p role="status">{theme === "dark" ? "Dark" : "Light"} theme. Approved static design values; no live protocol state.</p>
    <section aria-label="Five approved brand assets" className="grid gap-4 sm:grid-cols-2">
      {([
        ["Dark wordmark", "wordmark", "dark"], ["Light wordmark", "wordmark", "light"],
        ["Colour glyph", "glyph", theme], ["Monochrome glyph", "monochrome", theme], ["Application icon", "app-icon", theme],
      ] as const).map(([label, variant, surface]) => <figure key={label} data-theme={surface} className="min-w-0 space-y-3 rounded-lg border border-divider bg-canvas p-4 text-ink">
        <BrandMark variant={variant} />
        <figcaption className="text-sm">{label}</figcaption>
      </figure>)}
    </section>
    <section aria-label="Colour tokens" className="space-y-3">
      <h2 className="text-xl font-bold">Colour and purpose</h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {colors.map(([label, token, purpose]) => <div key={token} className="min-w-0 rounded-lg border border-divider bg-surface p-3">
          <div aria-hidden="true" className="mb-2 h-10 rounded-md border border-divider" style={{ backgroundColor: `var(--tb-${token})` }} />
          <dt className="font-semibold">{label}</dt><dd className="text-sm text-ink-secondary">{purpose}</dd>
          <dd><code className="break-all text-xs">--tb-{token}: {BRAND_COLORS[token]}</code></dd>
        </div>)}
      </dl>
      <p className="text-sm text-ink-secondary">Light foreground aliases blend approved colours with Ink Navy for AA contrast. Base brand tokens stay unchanged. Labels and shapes carry meaning alongside colour.</p>
    </section>
    <section aria-label="Typography" className="space-y-3">
      <h2 className="text-xl font-bold">Geist Sans and Geist Mono</h2>
      {TYPE_SCALE_TOKENS.map(role => <p key={role} className={role === "code" || role === "data" ? "tb-data" : "font-sans"}
        style={{ fontSize: `var(--type-${role})` }}>{role}: Evidence, provenance and accountable resolution</p>)}
      <p className="text-sm">Display/wordmark 800; headings 700–800; controls 600–700; body 400–500. Mono is reserved for protocol data.</p>
    </section>
    <section aria-label="Spacing" className="space-y-3">
      <h2 className="text-xl font-bold">Spacing</h2>
      <dl className="flex flex-wrap items-end gap-4">{spaces.map(n => <div key={n}>
        <dt className="text-sm">{n * 4}px</dt><dd aria-hidden="true" className="h-4 bg-proof-blue" style={{ width: `var(--tb-space-${n})` }} />
      </div>)}</dl>
    </section>
    <section aria-label="Shape and elevation" className="space-y-3">
      <h2 className="text-xl font-bold">Radius and restrained elevation</h2>
      <div className="flex flex-wrap gap-4">{radii.map(radius => <div key={radius} className="border border-divider bg-elevated p-4" style={{ borderRadius: `var(--tb-radius-${radius})` }}>{radius}</div>)}</div>
      <div className="rounded-lg border border-divider bg-elevated p-4" style={{ boxShadow: "var(--tb-shadow-raised)" }}>Raised · shadow 02. Elevation never communicates state.</div>
    </section>
    <section aria-label="Dimensions and motion" className="space-y-3">
      <h2 className="text-xl font-bold">Dimensions and motion</h2>
      <p>Control visuals: compact 36px, default 44px, large 52px. Every interactive target is at least 44 × 44px.</p>
      <dl className="grid gap-2 sm:grid-cols-2">
        {Object.entries(authority.dimension).map(([name, token]) => <div key={name}><dt className="font-semibold">{name}</dt><dd className="tb-data">{token.$value}</dd></div>)}
        {Object.entries(authority.duration).map(([name, token]) => <div key={name}><dt className="font-semibold">{name}</dt><dd className="tb-data">{token.$value}</dd></div>)}
      </dl>
      <p className="text-sm text-ink-secondary">Reduced motion uses 1ms token durations and removes non-essential transforms. Focus and state labels remain visible.</p>
    </section>
  </section>;
}
const meta = {
  title: "Foundation/Brand and tokens",
  component: Foundation,
  parameters: { layout: "fullscreen", fixture: { theme: "dark" }, chromatic: { viewports: [1440, 768, 390] } },
  tags: ["autodocs"],
} satisfies Meta<typeof Foundation>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Dark: Story = {
  args: { initialTheme: "dark" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("img", { name: "TruthBounty" })).toHaveLength(5);
    await userEvent.click(canvas.getByRole("button", { name: "Preview light theme" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Light theme");
    await userEvent.click(canvas.getByRole("button", { name: "Preview dark theme" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Dark theme");
  },
};
export const Light: Story = { args: { initialTheme: "light" } };
