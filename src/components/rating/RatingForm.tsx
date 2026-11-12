'use client';

import React from 'react';
import { useRatingFlow } from '@/hooks/useRatingFlow';
import { RatingStars } from './RatingStars';
import { CheckCircle2, AlertCircle, User, Sparkles, RotateCcw } from 'lucide-react';
import { ENV } from '@/config/env';

interface RatingFormProps {
  asesorIdentifier: string;
  isTestingMode?: boolean;
}

function getInitials(name: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function RatingForm({ asesorIdentifier, isTestingMode = false }: RatingFormProps) {
  const {
    asesor,
    isLoadingAsesor,
    estrellas,
    setEstrellas,
    comentario,
    setComentario,
    isSubmitting,
    error,
    submitted,
    cooldown,
    submitRating,
    resetForTesting,
  } = useRatingFlow({ asesorIdentifier });

  // 1. Estado: Cargando datos del asesor
  if (isLoadingAsesor) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium text-sm">Cargando información del asesor...</p>
      </div>
    );
  }

  // 2. Estado: Asesor no encontrado o QR inválido
  if (!asesor) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Código de atención no válido</h2>
        <p className="text-gray-600 text-sm max-w-sm mb-6">
          No pudimos identificar al asesor asociado a este código QR. Por favor solicita asistencia en el mostrador.
        </p>
        <div className="text-xs text-gray-400">
          Identificador: <code className="bg-gray-100 px-2 py-1 rounded">{asesorIdentifier || 'ninguno'}</code>
        </div>
      </div>
    );
  }

  // 3. Estado: Calificación enviada con éxito
  if (submitted) {
    return (
      <div className="min-h-[380px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">¡Muchas gracias!</h2>
        <p className="text-gray-600 text-xs sm:text-sm max-w-xs leading-relaxed">
          Tu calificación ha sido registrada. Tu opinión nos ayuda a brindarte siempre el mejor servicio en {ENV.companyName}.
        </p>

        {/* Solo visible en modo de prueba administrativo */}
        {isTestingMode && (
          <button
            type="button"
            onClick={resetForTesting}
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1.5 px-3 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 bg-white"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Volver a probar calificación</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Tarjeta de información del Asesor */}
      <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-blue-50/70 to-transparent border-b border-gray-100">
        {/* Avatar corporativo con iniciales e identidad Intereléctricos */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-slate-900 text-[#f2e205] border-2 border-[#f2e205]/40 flex items-center justify-center font-extrabold text-2xl tracking-wider ring-4 ring-white shadow-md select-none">
            {getInitials(asesor.nombre)}
          </div>
          <span
            className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
            title="Asesor disponible"
          />
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{asesor.nombre}</h1>
        {asesor.cargo && (
          <p className="text-xs text-slate-500 font-medium mt-0.5">{asesor.cargo}</p>
        )}
      </div>

      {/* Cuerpo del formulario o aviso de Cooldown */}
      <div className="p-6 flex flex-col gap-5">
        {!cooldown.canRate ? (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">¡Tu opinión ya fue recibida!</h3>
              <p className="text-xs text-slate-600 mt-1.5 max-w-xs leading-relaxed">
                Ya registramos tu calificación para <strong className="font-semibold text-slate-800">{asesor.nombre}</strong> hoy.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-500 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>¡Muchas gracias por tu visita!</span>
            </div>

            {/* Solo visible en modo de prueba administrativo */}
            {isTestingMode && (
              <button
                type="button"
                onClick={resetForTesting}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition py-1.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-white shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Desbloquear para probar de nuevo</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pregunta principal */}
            <div className="text-center">
              <h2 className="text-base font-bold text-slate-900">
                ¿Cómo calificarías la atención recibida?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona de 1 a 5 rayos de energía
              </p>
            </div>

            {/* Estrellas Interactivas */}
            <RatingStars
              value={estrellas}
              onChange={setEstrellas}
              disabled={isSubmitting}
            />

            {/* Campo de comentario opcional */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <label htmlFor="comentario" className="font-medium">
                  Comentario adicional <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <span className="text-[11px] text-gray-400">
                  {comentario.length}/500
                </span>
              </div>
              <textarea
                id="comentario"
                rows={3}
                maxLength={500}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                disabled={isSubmitting}
                placeholder="¿Qué te gustó o qué podemos hacer mejor? Déjanos tus observaciones..."
                className="w-full text-sm rounded-xl border border-gray-200 p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:bg-gray-50"
              />
            </div>

            {/* Mensaje de error si ocurre */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón de Enviar con Identidad Intereléctricos */}
            <button
              type="button"
              onClick={submitRating}
              disabled={isSubmitting || estrellas === 0}
              className={`w-full py-4 px-4 rounded-2xl font-bold text-sm tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                estrellas === 0 || isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-[#f2e205] hover:bg-[#dfd003] active:scale-[0.99] text-slate-900 shadow-md shadow-yellow-500/20 cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Enviando calificación...</span>
                </>
              ) : (
                <span>Enviar calificación</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

