'use client';

/**
 * AccessoryRow — a single accessory line in the job card form.
 *
 * - Checkbox toggles selection.
 * - When checked: shows variant <select> (if variants exist), notes, quantity,
 *   and price inputs.
 * - When unchecked: hides and clears all detail fields.
 *
 * Requirements: 3.4, 3.5, 3.10
 */

import type { AccessoryDefinition, SelectedAccessory, AccessoryCategory } from '@/types';

interface AccessoryRowProps {
  definition: AccessoryDefinition;
  category: AccessoryCategory;
  selected: SelectedAccessory | undefined;
  onChange: (updated: SelectedAccessory | null) => void;
}

const INPUT_CLASS =
  'w-full bg-background border border-border text-text-primary rounded-lg px-3 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition';

export default function AccessoryRow({
  definition,
  category,
  selected,
  onChange,
}: AccessoryRowProps) {
  const isChecked = !!selected;

  function handleCheck(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      onChange({
        id: definition.id,
        name: definition.name,
        category,
        variant: definition.variants.length > 0 ? definition.variants[0] : null,
        notes: '',
        quantity: 1,
        price: 0,
      });
    } else {
      onChange(null);
    }
  }

  function patch(partial: Partial<SelectedAccessory>) {
    if (!selected) return;
    onChange({ ...selected, ...partial });
  }

  return (
    <div className="py-3 border-b border-border last:border-0">
      {/* Checkbox + name */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheck}
          className="w-4 h-4 rounded border-border bg-background accent-primary cursor-pointer"
        />
        <span className="text-text-primary text-sm font-medium">{definition.name}</span>
      </label>

      {/* Detail fields — only when selected */}
      {isChecked && selected && (
        <div className="mt-3 ml-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Variant */}
          {definition.variants.length > 0 && (
            <div>
              <label className="block text-text-secondary text-xs mb-1">Variant</label>
              <select
                value={selected.variant ?? ''}
                onChange={(e) => patch({ variant: e.target.value || null })}
                className={INPUT_CLASS}
              >
                {definition.variants.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div className={definition.variants.length > 0 ? '' : 'sm:col-span-2'}>
            <label className="block text-text-secondary text-xs mb-1">Notes</label>
            <input
              type="text"
              value={selected.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder="Optional notes"
              className={INPUT_CLASS}
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-text-secondary text-xs mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              value={selected.quantity}
              onChange={(e) => patch({ quantity: Math.max(1, Number(e.target.value)) })}
              className={INPUT_CLASS}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-text-secondary text-xs mb-1">Price (₹)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={selected.price}
              onChange={(e) => patch({ price: Math.max(0, Number(e.target.value)) })}
              placeholder="0.00"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      )}
    </div>
  );
}
