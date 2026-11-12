'use client';

import { useState, useEffect, useCallback } from 'react';
import { Asesor, asesorService } from '@/modules/asesores';
import { calificacionService, RateLimitStatus } from '@/modules/calificaciones';
import confetti from 'canvas-confetti';

interface UseRatingFlowProps {
  asesorIdentifier: string;
}

export function useRatingFlow({ asesorIdentifier }: UseRatingFlowProps) {
  const [asesor, setAsesor] = useState<Asesor | null>(null);
  const [isLoadingAsesor, setIsLoadingAsesor] = useState(true);
  const [estrellas, setEstrellas] = useState<number>(0);
  const [comentario, setComentario] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState<RateLimitStatus>({ canRate: true });

  // Cargar asesor
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoadingAsesor(true);
      setError(null);
      try {
        const data = await asesorService.getAsesorForRating(asesorIdentifier);
        if (isMounted) {
          setAsesor(data);
          if (data) {
            const status = calificacionService.canDeviceRate(data.id);
            setCooldown(status);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar los datos del asesor');
        }
      } finally {
        if (isMounted) setIsLoadingAsesor(false);
      }
    }

    if (asesorIdentifier) {
      load();
    } else {
      setIsLoadingAsesor(false);
    }

    return () => {
      isMounted = false;
    };
  }, [asesorIdentifier]);

  // Enviar calificación
  const submitRating = useCallback(async () => {
    if (!asesor) {
      setError('No se ha detectado el asesor a calificar.');
      return;
    }

    if (estrellas < 1 || estrellas > 5) {
      setError('Por favor selecciona cuántas estrellas le das a la atención.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await calificacionService.submitRating({
        asesorId: asesor.id,
        estrellas,
        comentario,
      });

      if (!result.success) {
        setError(result.error || 'No se pudo registrar la calificación.');
        if (result.remainingMinutes) {
          setCooldown({ canRate: false, remainingMinutes: result.remainingMinutes });
        }
        return;
      }

      // Éxito: disparar confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#38bdf8', '#fbbf24', '#22c55e'],
        });
      } catch {
        // En caso de que confetti falle, no bloquear el flujo
      }

      setSubmitted(true);
      setCooldown({ canRate: false, remainingMinutes: 180 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado al enviar la calificación.');
    } finally {
      setIsSubmitting(false);
    }
  }, [asesor, estrellas, comentario]);

  const resetForTesting = useCallback(() => {
    if (asesor) {
      calificacionService.resetCooldown(asesor.id);
      setCooldown({ canRate: true });
      setSubmitted(false);
      setEstrellas(0);
      setComentario('');
      setError(null);
    }
  }, [asesor]);

  return {
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
  };
}

