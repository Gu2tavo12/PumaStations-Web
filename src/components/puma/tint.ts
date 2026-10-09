/** `color` at 14 % opacity: the tinted background of Pill, IconSquare and InitialsAvatar. */
export function tint(color: string, percent = 14): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}
