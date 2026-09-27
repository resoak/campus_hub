import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '../../utils/helpers';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface DropdownProps<T> {
  options: DropdownOption<T>[];
  value?: T;
  placeholder?: string;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
  renderOption?: (option: DropdownOption<T>, isSelected: boolean) => ReactNode;
}

export function Dropdown<T>({
  options,
  value,
  placeholder = '請選擇',
  onChange,
  disabled,
  className,
  searchable = false,
  renderOption,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className={cn('relative w-full', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-2.5 text-left bg-white dark:bg-gray-800 border rounded-lg',
          'text-gray-900 dark:text-gray-100 placeholder-gray-400',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          disabled ? 'border-gray-200 dark:border-gray-700' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500',
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
      >
        <div className="flex items-center justify-between">
          <span>{selectedOption?.label || placeholder}</span>
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋..."
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">無符合選項</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  disabled={option.disabled}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm transition-colors',
                    'focus:outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/30',
                    option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700',
                    value === option.value ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100'
                  )}
                  role="option"
                  aria-selected={value === option.value}
                >
                  {renderOption ? (
                    renderOption(option, value === option.value)
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {value === option.value && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}