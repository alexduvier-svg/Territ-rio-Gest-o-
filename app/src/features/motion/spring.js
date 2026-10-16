// Closed-form damped spring, in seconds. Keeping velocity when the destination changes makes a
// gesture interruptible; a new gesture never restarts a prerecorded easing curve.
export const SPRING = Object.freeze({ stiffness: 380, damping: 34, mass: 1 });

export function stepSpring({ position, velocity }, target, seconds, options = SPRING) {
  const { stiffness = SPRING.stiffness, damping = SPRING.damping, mass = 1 } = options;
  if (![position, velocity, target, seconds, stiffness, damping, mass].every(Number.isFinite)) {
    throw new TypeError('Spring values must be finite numbers');
  }
  if (mass <= 0 || stiffness <= 0 || damping < 0 || seconds < 0) {
    throw new RangeError('Spring mass/stiffness must be positive; damping/time cannot be negative');
  }
  if (seconds === 0) return { position, velocity };
  const displacement = position - target;
  const decay = damping / (2 * mass);
  const frequency2 = stiffness / mass;
  const discriminant = decay * decay - frequency2;
  let next, speed;
  if (Math.abs(discriminant) < 1e-8 * frequency2) {
    const b = velocity + decay * displacement;
    const envelope = Math.exp(-decay * seconds);
    next = envelope * (displacement + b * seconds);
    speed = envelope * (velocity - decay * b * seconds);
  } else if (discriminant < 0) {
    const frequency = Math.sqrt(-discriminant);
    const b = (velocity + decay * displacement) / frequency;
    const sine = Math.sin(frequency * seconds), cosine = Math.cos(frequency * seconds);
    const envelope = Math.exp(-decay * seconds);
    next = envelope * (displacement * cosine + b * sine);
    speed = envelope * (velocity * cosine - (decay * b + frequency * displacement) * sine);
  } else {
    const root = Math.sqrt(discriminant);
    // This equivalent expression avoids cancellation for very large damping.
    const slow = -frequency2 / (decay + root), fast = -decay - root;
    const a = (velocity - fast * displacement) / (slow - fast), b = displacement - a;
    const slowEnvelope = Math.exp(slow * seconds), fastEnvelope = Math.exp(fast * seconds);
    next = a * slowEnvelope + b * fastEnvelope;
    speed = a * slow * slowEnvelope + b * fast * fastEnvelope;
  }
  return { position: target + next, velocity: speed };
}

export function springAtRest(state, target, positionTolerance = 0.01, velocityTolerance = 0.05) {
  return Math.abs(state.position - target) <= positionTolerance && Math.abs(state.velocity) <= velocityTolerance;
}
