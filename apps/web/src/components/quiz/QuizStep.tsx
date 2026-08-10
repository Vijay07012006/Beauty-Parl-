'use client';

import { motion } from 'framer-motion';

interface Option {
  value: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface QuizStepProps {
  question: Question;
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export function QuizStep({ question, selectedValue, onSelect }: QuizStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-playfair font-bold text-foreground text-center">
        {question.text}
      </h2>
      <div className="grid grid-cols-1 gap-3.5">
        {question.options.map((option) => {
          const isSelected = option.value === selectedValue;
          return (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(option.value)}
              className={`w-full text-left p-4.5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                isSelected
                  ? 'bg-primary/5 border-primary text-foreground shadow-md ring-2 ring-primary/10'
                  : 'bg-card border-border/30 hover:border-primary/40 text-foreground hover:bg-secondary/10'
              }`}
            >
              <span className="font-semibold text-sm">{option.text}</span>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-border'
                }`}
              >
                {isSelected && <span className="text-[10px] font-bold">✓</span>}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
