/** Deterministic color from string - for customer avatar circles */
const AVATAR_PALETTE = [
  '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#6366f1', '#ef4444', '#06b6d4', '#84cc16', '#f97316',
]
export function getAvatarColor(name) {
  if (!name || typeof name !== 'string') return AVATAR_PALETTE[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i)
  const idx = Math.abs(h) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[idx]
}
