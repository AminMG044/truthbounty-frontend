const requiredValues = [
  "NEXT_PUBLIC_CHAIN_ID",
  "NEXT_PUBLIC_RPC_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
  "NEXT_PUBLIC_EXPLORER_BASE_URL",
];

const missing = requiredValues.filter((name) => !process.env[name]?.trim());
const invalid = [];

for (const name of [
  "NEXT_PUBLIC_RPC_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_EXPLORER_BASE_URL",
]) {
  const value = process.env[name]?.trim();
  if (!value) continue;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") invalid.push(name);
  } catch {
    invalid.push(name);
  }
}

if (
  process.env.NEXT_PUBLIC_CHAIN_ID?.trim() &&
  !/^\d+$/.test(process.env.NEXT_PUBLIC_CHAIN_ID.trim())
) {
  invalid.push("NEXT_PUBLIC_CHAIN_ID");
}

if (
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() &&
  !/^[\da-f]{32}$/i.test(
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.trim(),
  )
) {
  invalid.push("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID");
}

if (missing.length || invalid.length) {
  const details = [
    missing.length ? `missing: ${missing.join(", ")}` : null,
    invalid.length ? `invalid: ${[...new Set(invalid)].join(", ")}` : null,
  ].filter(Boolean);
  console.error(`::error::Production configuration blocked (${details.join("; ")}).`);
  process.exit(1);
}

console.log("Production configuration preflight passed.");