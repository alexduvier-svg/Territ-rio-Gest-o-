// A closing copy may be taller than what is on screen: it shows only what the scrolling area showed.
export function ghostClip(top, height, area) {
  const above = Math.max(0, area.top - top), below = Math.max(0, top + height - area.bottom);
  return `inset(${above}px 0 ${below}px 0)`;
}
