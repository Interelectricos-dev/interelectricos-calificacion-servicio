'use client';

import React, { useEffect, useState } from 'react';
import { Asesor, asesorService } from '@/modules/asesores';
import { X, Pencil, AlertCircle, QrCode } from 'lucide-react';

interface EditAsesorModalProps {
  asesor: Asesor | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditAsesorModal({ asesor, isOpen, onClose, onUpdated }: EditAsesorModalProps) {
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (asesor) {
      setNombre(asesor.nombre);
      setCargo(asesor.cargo || 'Asesor Comercial');
      setError(null);
    }
  }, [asesor]);

  if (!isOpen || !asesor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del asesor es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await asesorService.updateAsesor(asesor.id, {
        nombre: nombre.trim(),
        cargo: cargo.trim() || 'Asesor Comercial',
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar asesor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#f2e205] flex items-center justify-center font-bold">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Editar Asesor</h2>
              <p className="text-[11px] text-slate-400">Actualiza los datos de atención</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Andrés Camilo Torres"
              className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#f2e205] focus:border-slate-900 transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Cargo o Especialidad
            </label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ej. Asesor Técnico Comercial"
              className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#f2e205] focus:border-slate-900 transition"
            />
          </div>

          {/* Información fija del QR */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5 text-xs text-slate-500">
            <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="leading-tight">
              <span className="font-semibold text-slate-700 block">Código QR: {asesor.codigoSlug}</span>
              <span className="text-[10px] text-slate-400">El QR físico no cambia al editar el nombre</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nombre.trim()}
              className="px-5 py-2.5 text-xs font-bold bg-[#f2e205] hover:bg-[#dfd003] text-slate-900 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

