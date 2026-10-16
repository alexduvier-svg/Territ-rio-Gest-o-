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
