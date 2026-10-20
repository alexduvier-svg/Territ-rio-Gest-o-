// Recover layout coordinates from a translated/scaled surface without resetting its pose first.
export function naturalRect(rect, pose) {
  const scale = Math.max(0.001, pose.scale);
  return {
    left: rect.left - pose.x - pose.originX * (1 - scale),
    top: rect.top - pose.y - pose.originY * (1 - scale),
    width: rect.width / scale,
    height: rect.height / scale,
  };
}

// Changing a pivot is a coordinate change, not a physical jump. Preserve both position and
// screen-space velocity; copying raw velocity into another pivot would visibly catch or blink.
export function reanchorPose(pose, originX, originY) {
  return {
    ...pose,
    x: pose.x + (pose.originX - originX) * (1 - pose.scale),
    y: pose.y + (pose.originY - originY) * (1 - pose.scale),
    velocityX: (pose.velocityX || 0) + (originX - pose.originX) * (pose.velocityScale || 0),
    velocityY: (pose.velocityY || 0) + (originY - pose.originY) * (pose.velocityScale || 0),
    originX, originY,
  };
}

// Container transform (iOS / ColorOS): the sheet is born from the tapped surface. Its top edge
// (title included) starts inside the source, scaled to the source and clipped to the source's own
// shape and corners; the clip then opens downward while the spring carries it to rest. Showing the
// top first keeps the title on screen for the whole movement instead of popping in at the end.
// `reveal` 0 = source shape, 1 = the whole sheet.
export function morphGeometry(rect, source, sheetRadius = 28) {
  if (!source?.width || !source?.height || !rect.width || !rect.height) return null;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const { left, top, width, height } = rect;
  const scale = clamp(Math.max(source.width / width, source.height / height), 0.18, 1);
  const visibleWidth = Math.min(width, source.width / scale), visibleHeight = Math.min(height, source.height / scale);
  return {
    x: source.cx - (left + width / 2),
    y: source.cy - (top + visibleHeight / 2),
    scale,
    origin: `${(width / 2).toFixed(2)}px ${(visibleHeight / 2).toFixed(2)}px`,
    clip: {
      x: (width - visibleWidth) / 2,
      bottom: height - visibleHeight,
      radius: (source.radius ?? 16) / scale,
      sheetRadius,
    },
  };
}

// On return the entire surface fits into its source. Shrinking the reveal mask
// instead would wipe away the footer/rows before the window arrived at the card.
export function wholeReturnGeometry(rect, source, sheetRadius = 28) {
  if (!source?.width || !source?.height || !rect.width || !rect.height) return null;
  return {
    x: source.cx - (rect.left + rect.width / 2),
    y: source.cy - (rect.top + rect.height / 2),
    scale: Math.min(1, source.width / rect.width, source.height / rect.height),
    origin: `${(rect.width / 2).toFixed(2)}px ${(rect.height / 2).toFixed(2)}px`,
    clip: { x: 0, bottom: 0, radius: sheetRadius, sheetRadius },
    whole: true,
  };
}

// Clip for a reveal value. The spring may overshoot past 1; the sheet then simply stays whole.
export function revealClip(clip, reveal) {
  const open = Math.max(0, Math.min(1, reveal));
  const rest = 1 - open;
  const radius = clip.radius + (clip.sheetRadius - clip.radius) * open;
  return `inset(0px ${(clip.x * rest).toFixed(2)}px ${(clip.bottom * rest).toFixed(2)}px round ${Math.max(0, radius).toFixed(2)}px)`;
}

// A closing sheet stays whole and solid on its way back; it only merges into the source during
// the last few percent of the return, so it never dissolves mid-flight.
export function closingOpacity(reveal, base = 1) {
  return Math.max(0, Math.min(1, reveal / 0.08)) * base;
}

// A large insight sheet comes from a small toolbar glyph. Scaling the entire text surface down
// to the glyph's area makes its lower edge travel hundreds of pixels and feels like dragging.
// Keep a short, source-directed expansion with a bounded pivot, including on return/close.
export function insightSheetGeometry(rect, source, lite = false) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const { left, top, width, height } = rect;
  const cx = left + width / 2, cy = top + height / 2;
  return {
    x: source ? clamp((source.cx - cx) * (lite ? 0.04 : 0.08), lite ? -6 : -12, lite ? 6 : 12) : 0,
    y: source ? clamp((source.cy - cy) * (lite ? 0.04 : 0.08), lite ? -10 : -18, lite ? 10 : 18) : lite ? 8 : 14,
    scale: lite ? 0.975 : 0.94,
    origin: `${clamp((source?.cx ?? cx) - left, width * 0.35, width * 0.65).toFixed(2)}px ${clamp((source?.cy ?? cy) - top, height * 0.35, height * 0.65).toFixed(2)}px`,
  };
}

// Navigation gets a visible expansion from the touched tab. All panels share
// this pivot; no independent stagger, font blur, or full-page DOM copy.
export function navigationEntryGeometry(width,height,source,lite=false){
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const tab=source?.tab||'Vender',poses={Vender:[-width*.23,12],Estoque:[-width*.07,height*.06],Clientes:[width*.12,16],Eventos:[0,height*.08],Gestão:[width*.18,10]},pose=poses[tab]||[0,12];
 return {x:lite?pose[0]*.3:pose[0],y:lite?pose[1]*.35:pose[1],scale:lite?.97:.90,origin:`${clamp(source?.cx??width/2,0,width).toFixed(2)}px ${clamp(source?.cy??height*.85,0,height).toFixed(2)}px`};
}
