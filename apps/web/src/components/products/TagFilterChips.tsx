'use client';

import { motion } from 'framer-motion';

interface Tag {
  id: number;
  name: string;
  icon?: string;
  category?: 'ingredient' | 'benefit' | 'concern';
}

interface TagFilterChipsProps {
  tags: Tag[];
  selectedTags: string[];
  onChange: (selected: string[]) => void;
}

export function TagFilterChips({ tags, selectedTags, onChange }: TagFilterChipsProps) {
  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter(t => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex gap-2.5 pb-2 min-w-max">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <motion.button
              key={tag.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleTag(tag.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 shadow-sm cursor-pointer select-none
                ${isSelected 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-100 shadow-lg' 
                  : 'bg-card border-border/60 text-foreground hover:bg-secondary/40 hover:border-primary/20'
                }`}
            >
              {tag.icon && <span className="text-sm">{tag.icon}</span>}
              <span>{tag.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
