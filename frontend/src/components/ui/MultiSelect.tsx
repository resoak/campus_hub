import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '../../utils/helpers';
import { ChevronDown, X, Search } from 'lucide-react';

interface MultiSelectOption<T> {
  value: T;
  label: string;
  color?: string;
  disabled?: boolean;
}

interface MultiSelectProps<T> {
  options: MultiSelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
  maxSelected?: number;
  renderSelected?: (option: MultiSelectOption<T>) => ReactNode;
  renderOption?: (option: MultiSelectOption<T>, isSelected: boolean) => ReactNode;
}

export function MultiSelect<T>({
  options,
  value,
  onChange,
  placeholder = '請選擇標籤',
  disabled,
  className,
  searchable = true,
  maxSelected,
  renderSelected,
  renderOption,
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const handleToggle = (optionValue: T) => {
    if (maxSelected && value.length >= maxSelected && !value.includes(optionValue)) return;

    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemove = (optionValue: T, event: React.MouseEvent) => {
    event.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div ref={dropdownRef} className={cn('relative w-full', className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'w-full min-h-[42px] px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-lg flex flex-wrap items-center gap-2',
          'transition-colors duration-200',
          'focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent',
          disabled ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500',
          isOpen && !disabled ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''
        )}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedOptions.map((option) => (
          <span
            key={String(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
              option.color
                ? `bg-[${option.color}]/15 text-[${option.color}] border border-[${option.color}]/30`
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
            )}
          >
            {renderSelected ? renderSelected(option) : option.label}
            <button
              type="button"
              onClick={(e) => handleRemove(option.value, e)}
              className={cn(
                'p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
                option.color ? 'text-current' : 'text-indigo-600 dark:text-indigo-400'
              )}
              aria-label={`移除 ${option.label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        {(!selectedOptions.length || isOpen) && (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                // Allow creating new tags if needed
              }
            }}
            placeholder={selectedOptions.length ? '' : placeholder}
            disabled={disabled || (maxSelected && value.length >= maxSelected)}
            className={cn(
              'flex-1 min-w-[120px] py-1.5 bg-transparent border-none outline-none text-sm',
              'text-gray-900 dark:text-gray-100 placeholder-gray-400',
              disabled ? 'cursor-not-allowed' : ''
            )}
            aria-autocomplete="list"
            aria-controls="multiselect-options"
          />
        )}

        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform shrink-0', isOpen && 'rotate-180')} />
      </div>

      {isOpen && !disabled && (
        <div
          id="multiselect-options"
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
          role="listbox"
        >
          {searchable && (
            <div className="relative p-2 border-b border-gray-100 dark:border-gray-700">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋標籤..."
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">無符合標籤</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    disabled={option.disabled || (maxSelected && value.length >= maxSelected && !isSelected)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2',
                      'focus:outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/30',
                      option.disabled || (maxSelected && value.length >= maxSelected && !isSelected)
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700',
                      isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {renderOption ? (
                      renderOption(option, isSelected)
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        {option.color && (
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                        )}
                        <span className={cn('flex-1', isSelected ? 'font-medium' : '')}>{option.label}</span>
                        {isSelected && <ChevronDown className="h-4 w-4 text-indigo-600 dark:text-indigo-400 rotate-90" />}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}