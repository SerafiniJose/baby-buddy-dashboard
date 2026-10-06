export function clampIndex(index, length) {
  if (!length) return -1;
  return Math.max(0, Math.min(index, length - 1));
}

export function selectedIndex(options, value) {
  const index = options.findIndex((option) => option.value === value);
  return index >= 0 ? index : 0;
}

export function nextSelectorIndex(currentIndex, key, length) {
  if (!length) return -1;
  switch (key) {
    case "ArrowDown":
    case "ArrowRight":
      return (clampIndex(currentIndex, length) + 1) % length;
    case "ArrowUp":
    case "ArrowLeft":
      return (clampIndex(currentIndex, length) - 1 + length) % length;
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return clampIndex(currentIndex, length);
  }
}

export function shouldOpenSelectorFromButton(key) {
  return ["ArrowDown", "ArrowUp", "Enter", " "].includes(key);
}

export function isSelectionKey(key) {
  return key === "Enter" || key === " ";
}
