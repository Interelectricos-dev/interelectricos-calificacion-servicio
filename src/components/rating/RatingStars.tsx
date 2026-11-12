'use client';

import React, { useState } from 'react';
import { Zap } from 'lucide-react';

interface RatingStarsProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const VOLTAGE_LABELS: Record<number, { text: string; badgeBg: string }> = {
  1: {
    text: 'Malo',
    badgeBg: 'bg-red-50 border-red-200 text-red-600',
  },
  2: {
    text: 'Regular',
    badgeBg: 'bg-orange-50 border-orange-200 text-orange-600',
  },
  3: {
    text: 'Bueno',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  4: {
    text: 'Muy bueno',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  5: {
    text: '¡Excelente! ⚡',
    badgeBg: 'bg-[#f2e205] border-yellow-400 text-slate-900 font-bold shadow-xs',
  },
};

export function RatingStars({ value, onChange, disabled = false }: RatingStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const activeRating = hovered !== null ? hovered : value;
  const labelInfo = activeRating > 0 ? VOLTAGE_LABELS[activeRating] : null;

  return (
    <div className="flex flex-col items-center gap-3 w-full select-none py-2">
      {/* Rayos Eléctricos libres sobre fondo limpio */}
      <div
        className="flex items-center justify-center gap-2 sm:gap-3.5 py-1"
        role="radiogroup"
        aria-label="Calificación de 1 a 5 rayos eléctricos"
      >
        {[1, 2, 3, 4, 5].map((level) => {
          const isFilled = level <= activeRating;

          return (
            <button
              key={level}
              type="button"
              disabled={disabled}
              onClick={() => onChange(level)}
              onMouseEnter={() => !disabled && setHovered(level)}
              onMouseLeave={() => !disabled && setHovered(null)}
              className={`p-2 sm:p-2.5 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#f2e205] active:scale-90 ${
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-115'
              }`}
              aria-label={`${level} rayo${level > 1 ? 's' : ''}`}
            >
              <Zap
                className={`w-9 h-9 sm:w-11 sm:h-11 transition-all duration-200 ${
                  isFilled
                    ? 'fill-[#f2e205] text-[#111827] drop-shadow-[0_0_12px_rgba(242,226,5,0.7)] scale-105'
                    : 'fill-transparent text-slate-300 hover:text-slate-400'
                }`}
                strokeWidth={isFilled ? 2.2 : 1.8}
              />
            </button>
          );
        })}
      </div>

      {/* Etiqueta dinámica de estado (Corta y limpia) */}
      <div className="h-7 flex items-center justify-center transition-all">
        {labelInfo ? (
          <div
            className={`px-3.5 py-0.5 rounded-full border text-xs sm:text-sm font-semibold transition-all animate-fadeIn ${labelInfo.badgeBg}`}
          >
            {labelInfo.text}
          </div>
        ) : (
          <span className="text-xs text-slate-400 flex items-center gap-1 font-normal">
            <Zap className="w-3.5 h-3.5 text-slate-400" />
            <span>Toca los rayos para calificar</span>
          </span>
        )}
      </div>
    </div>
  );
}
