import { useEffect, useId, useRef, useState } from "react";
import {
  isSelectionKey,
  nextSelectorIndex,
  selectedIndex,
  shouldOpenSelectorFromButton,
} from "../utils/selectorKeyboard";

export default function CompactSelector({ ariaLabel, className = "", options, value, onChange, triggerDisplay = "label" }) {
  const selectorId = useId();
  const menuId = `${selectorId}-menu`;
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => selectedIndex(options, value));

  const currentIndex = selectedIndex(options, value);
  const currentOption = options[currentIndex] || options[0];

  useEffect(() => {
    if (!open) setActiveIndex(currentIndex);
  }, [currentIndex, open]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  const openMenu = (nextIndex = currentIndex) => {
    setActiveIndex(nextIndex);
    setOpen(true);
  };

  const selectOption = (option) => {
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (event) => {
    if (!shouldOpenSelectorFromButton(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "ArrowUp" ? Math.max(options.length - 1, 0) : currentIndex;
    openMenu(nextIndex);
  };

  const handleOptionKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (isSelectionKey(event.key)) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) selectOption(option);
      return;
    }

    const nextIndex = nextSelectorIndex(activeIndex, event.key, options.length);
    if (nextIndex !== activeIndex) {
      event.preventDefault();
      setActiveIndex(nextIndex);
    }
  };

  return (
    <div className={`compact-selector ${className}`.trim()}>
      <button
        ref={buttonRef}
        type="button"
        className="compact-selector-trigger"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleButtonKeyDown}
      >
        {currentOption?.icon && <span className="compact-selector-icon" aria-hidden="true">{currentOption.icon}</span>}
        {triggerDisplay !== "icon" && (
          <span className="compact-selector-value">{currentOption?.shortLabel || currentOption?.label}</span>
        )}
        <span className="compact-selector-caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className="compact-selector-menu fade-in"
          role="menu"
          aria-label={ariaLabel}
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                ref={(node) => { optionRefs.current[index] = node; }}
                type="button"
                className={`compact-selector-option${selected ? " compact-selector-option-selected" : ""}`}
                role="menuitemradio"
                aria-checked={selected}
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => selectOption(option)}
                onKeyDown={handleOptionKeyDown}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {option.icon && <span className="compact-selector-icon" aria-hidden="true">{option.icon}</span>}
                <span className="compact-selector-option-label">{option.label}</span>
                {option.meta && <span className="compact-selector-option-meta">{option.meta}</span>}
                <span className="compact-selector-check" aria-hidden="true">{selected ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
