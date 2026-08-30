export function getMinimumNextStake(currentStake: number): number { if (!Number.isFinite(currentStake) || currentStake <= 0) return 5; if (currentStake < 50) return currentStake + 5; if (currentStake < 200) return currentStake + 10; if (currentStake < 1000) return currentStake + 25; return currentStake + 50; }
// The country-wide "minimum next stake" ladder assumes the bidder starts from zero. A brand that
// already has a stake on this country only needs to ADD enough to bring its total up to that same
// floor — never less than $5, so top-ups can't be trivially small. Used both client-side (for
// defaults/copy) and server-side (as the actual, authoritative gate in /api/checkout).
export function getMinimumAddition(currentStake: number, existingStake: number): number { return Math.max(5, getMinimumNextStake(currentStake) - Math.max(0, existingStake)); }
export function formatMoney(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
