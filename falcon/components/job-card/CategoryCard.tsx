'use client';

/**
 * CategoryCard — collapsible accessory category section.
 *
 * - Expand/collapse toggle with Framer Motion animation.
 * - Renders an AccessoryRow for each accessory in the category.
 * - Manages selected accessories state and calls onChange with the updated list.
 *
 * Requirements: 3.3, 3.4
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import AccessoryRow from './AccessoryRow';
import type { AccessoryDefinition, SelectedAccessory, AccessoryCategory } from '@/types';

interface CategoryCardProps {
  title: string;
  category: AccessoryCategory;
  accessories: AccessoryDefinition[];
  selected: SelectedAccessory[];
  onChange: (updated: SelectedAccessory[]) => void;
}

export default function CategoryCard({
  title,
  category,
  accessories,
  selected,
  onChange,
}: CategoryCardProps) {
  const [open, setOpen] = useState(false);
  const selectedCount = selected.length;

  function handleRowChange(
    definition: AccessoryDefinition,
    updated: SelectedAccessory | null
  ) {
    if (updated === null) {
      // Remove
      onChange(selected.filter((s) => s.id !== definition.id));
    } else {
      // Add or replace
      const exists = selected.some((s) => s.id === definition.id);
      if (exists) {
        onChange(selected.map((s) => (s.id === definition.id ? updated : s)));
      } else {
        onChange([...selected, updated]);
      }
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-2 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-text-primary font-semibold text-sm">{title}</span>
          {selectedCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">
              {selectedCount}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-text-muted"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>

      {/* Accessory list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-2 border-t border-border">
              {accessories.map((def) => (
                <AccessoryRow
                  key={def.id}
                  definition={def}
                  category={category}
                  selected={selected.find((s) => s.id === def.id)}
                  onChange={(updated) => handleRowChange(def, updated)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
