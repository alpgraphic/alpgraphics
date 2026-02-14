'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="text-center max-w-md px-6">
                <div className="text-6xl mb-6 opacity-20">⚠</div>
                <h2 className="text-2xl font-bold mb-3">Bir şeyler ters gitti</h2>
                <p className="text-sm opacity-50 mb-8">
                    Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
                </p>
                <button
                    onClick={reset}
                    className="px-8 py-3 bg-[#a62932] text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-[#c4323d] transition-all hover:scale-105 active:scale-95"
                >
                    Tekrar Dene
                </button>
            </div>
        </div>
    );
}
