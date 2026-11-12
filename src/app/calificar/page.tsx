'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RatingForm } from '@/components/rating/RatingForm';
import { Zap } from 'lucide-react';
import { ENV } from '@/config/env';

function RatingContent() {
  const searchParams = useSearchParams();
  // Permite tanto "?asesor=carlos-mendez" como "?id=carlos-mendez"
  const asesorIdentifier = searchParams.get('asesor') || searchParams.get('id') || '';
  const isTestingMode = searchParams.get('mode') === 'test';

  return <RatingForm asesorIdentifier={asesorIdentifier} isTestingMode={isTestingMode} />;
}

export default function CalificarPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Header corporativo con Logo Oficial */}
      <header className="w-full max-w-md mx-auto flex items-center justify-center py-3">
        <Link href="/" className="transition hover:opacity-95">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-interelectricos.png"
            alt={ENV.companyName}
            className="h-10 w-auto object-contain drop-shadow-xs"
          />
        </Link>
      </header>

      {/* Contenedor tipo Tarjeta Móvil */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden my-auto">
        <Suspense
          fallback={
            <div className="p-12 text-center text-gray-400 text-sm">
              Cargando formulario...
            </div>
          }
        >
          <RatingContent />
        </Suspense>
      </div>

      {/* Footer discreto */}
      <footer className="w-full max-w-md mx-auto text-center py-4 text-[11px] text-gray-400">
        Tu opinión es confidencial y nos permite mejorar continuamente.
      </footer>
    </main>
  );
}

