import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useStockIndex } from '@/hooks/useStockIndex';
import { useAutocomplete } from '@/hooks/useAutocomplete';
import { SuggestionsList } from './SuggestionsList';
import { cn } from '@/lib/utils';

export interface StockAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (code: string, name?: string, market?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function StockAutocomplete({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder,
  className,
}: StockAutocompleteProps) {
  const { index, loading, fallback } = useStockIndex();
  const {
    setQuery,
    suggestions,
    isOpen,
    highlightedIndex,
    setHighlightedIndex,
    highlightPrevious,
    highlightNext,
    close,
    isComposing,
    setIsComposing,
    runtimeFallback,
  } = useAutocomplete(index, { minLength: 1 });

  const inputRef = useRef<HTMLInputElement>(null);
  const prevValue = useRef(value);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: string;
  } | null>(null);

  useEffect(() => {
    if (prevValue.current !== value) {
      setQuery(value);
      prevValue.current = value;
    }
  }, [value, setQuery]);

  const updatePosition = () => {
    if (!inputRef.current) {
      setDropdownStyle(null);
      return;
    }
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 2,
      left: rect.left,
      width: `${rect.width}px`,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const closeDropdown = () => {
    close();
    setDropdownStyle(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        highlightPrevious();
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          const selected = suggestions[highlightedIndex];
          onChange(selected.displayCode);
          closeDropdown();
          onSubmit(selected.canonicalCode, selected.nameZh, selected.market);
        } else if (value.trim()) {
          onSubmit(value.trim());
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
    }
  };

  const useFallback = fallback || loading || runtimeFallback;

  if (useFallback) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && value.trim() && onSubmit(value.trim())}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full rounded-md border border-border bg-card px-3 text-sm shadow-sm',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          className,
        )}
      />
    );
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onFocus={() => isOpen && updatePosition()}
        onBlur={() => setTimeout(closeDropdown, 150)}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="stock-suggestions-list"
        className={cn(
          'flex h-9 w-full rounded-md border border-border bg-card px-3 text-sm shadow-sm',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isOpen && 'rounded-b-none border-b-transparent',
          className,
        )}
      />
      {loading && (
        <div className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      )}
      {isOpen && dropdownStyle &&
        createPortal(
          <SuggestionsList
            suggestions={suggestions}
            highlightedIndex={highlightedIndex}
            onSelect={(s) => {
              onChange(s.displayCode);
              closeDropdown();
              onSubmit(s.canonicalCode, s.nameZh, s.market);
            }}
            onMouseEnter={setHighlightedIndex}
            style={{ position: 'fixed', ...dropdownStyle }}
          />,
          document.body,
        )}
    </div>
  );
}