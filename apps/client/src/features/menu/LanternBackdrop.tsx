const STARS = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: (index * 37) % 100,
  top: (index * 23) % 55,
  delay: (index % 7) * 0.7,
}));

const FIREFLIES = Array.from({ length: 6 }, (_, index) => ({
  id: index,
  left: 34 + ((index * 11) % 34),
  top: 46 + ((index * 17) % 30),
  delay: index * 0.9,
}));

/** CSS-only night scene: stars, the lantern hill, wind-blown grass, flies. */
export const LanternBackdrop = () => (
  <div aria-hidden="true" className="backdrop">
    <div className="backdrop-hill" />
    <div className="backdrop-grass" />
    {STARS.map((star) => (
      <span
        className="star"
        key={star.id}
        style={{
          left: `${star.left}%`,
          top: `${star.top}%`,
          animationDelay: `${star.delay}s`,
        }}
      />
    ))}
    {FIREFLIES.map((fly) => (
      <span
        className="firefly"
        key={fly.id}
        style={{
          left: `${fly.left}%`,
          top: `${fly.top}%`,
          animationDelay: `${fly.delay}s`,
        }}
      />
    ))}
    <img
      alt=""
      aria-hidden="true"
      className="backdrop-lantern glow"
      height="40"
      src="/lantern.svg"
      width="31"
    />
  </div>
);
