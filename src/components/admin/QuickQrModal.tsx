'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Asesor } from '@/modules/asesores';
import { X, Printer, ExternalLink, Layers } from 'lucide-react';
import { ENV } from '@/config/env';

interface QuickQrModalProps {
  asesor: Asesor | null;
  onClose: () => void;
}

export function QuickQrModal({ asesor, onClose }: QuickQrModalProps) {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!asesor) return null;

  const url = `${origin}/calificar?asesor=${encodeURIComponent(asesor.codigoSlug)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn print:static print:inset-auto print:bg-white print:p-0 print:block">
      {/* Tarjeta / Ficha que se imprime */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center print:shadow-none print:border-2 print:border-dashed print:border-slate-400 print:rounded-2xl print:max-w-[140mm] print:aspect-square print:justify-between print:mx-auto print:my-12">
        {/* Barra superior del Modal (Oculta al imprimir) */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4 print:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código QR de Atención</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo Oficial */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-interelectricos.png"
          alt={ENV.companyName}
          className="h-8 w-auto object-contain mb-3 print:h-9 print:mb-2"
        />

        {/* Título en impresión */}
        <div className="hidden print:block mb-2">
          <h3 className="font-black text-slate-900 text-base">¿Cómo fue tu atención hoy?</h3>
          <p className="text-xs text-slate-500">Escanea con tu celular y califica</p>
        </div>

        {/* Contenedor QR */}
        <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex flex-col items-center mb-3 print:border-slate-300 print:my-auto">
          <QRCodeSVG value={url} size={165} level="H" />
          <span className="text-[10px] text-slate-400 font-mono mt-1.5">
            ID: {asesor.codigoSlug}
          </span>
        </div>

        {/* Nombre y Cargo */}
        <div className="w-full bg-slate-50 rounded-2xl py-2 px-3 border border-slate-100 text-center print:bg-slate-50">
          <h3 className="font-extrabold text-slate-900 text-base tracking-tight">{asesor.nombre}</h3>
          <p className="text-xs font-semibold text-slate-500">{asesor.cargo || 'Asesor Comercial'}</p>
        </div>

        {/* Botones de Acción (Ocultos al imprimir) */}
        <div className="w-full flex flex-col gap-2 mt-5 print:hidden">
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Probar Formulario</span>
            </a>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#f2e205] hover:bg-[#dfd003] text-slate-900 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ficha</span>
            </button>
          </div>

          <Link
            href="/admin/qr"
            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1 py-1"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Abrir generador múltiple (2 o 4 por hoja)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
