export const colors = {
  feeding: "#F59E0B",
  sleep: "#8B5CF6",
  diaper: "#3B82F6",
  growth: "#10B981",
  tummy: "#EC4899",
  temp: "#EF4444",
  height: "#6366F1",
  headCircumference: "#14B8A6",
  note: "#84CC16",
  bath: "#06B6D4",
  event: "#A855F7",
};

// The per-category colors above are tuned as fills/icons on the built-in dark theme.
// Used as small text they get too pale on a light theme (and are already marginal on
// dark). Pulling them toward var(--text) keeps the hue recognizable while landing the
// luminance on the readable side of whatever background the active theme provides.
export const onSurface = (c) => `color-mix(in srgb, ${c} 68%, var(--text))`;
