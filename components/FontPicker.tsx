"use client";

import { useRef } from 'react';

interface FontPickerProps {
    value: string;
    onChange: (fontName: string) => void;
    label: string;
}

const GOOGLE_FONTS = [
    'Inter', 'Roboto', 'Montserrat', 'Open Sans', 'Lato',
    'Poppins', 'Playfair Display', 'Merriweather', 'Source Sans Pro',
    'Raleway', 'Oswald', 'Nunito', 'Quicksand', 'Outfit',
    'JetBrains Mono', 'Space Mono', 'Didot', 'Helvetica Neue'
];

export default function FontPicker({ value, onChange, label }: FontPickerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Gerçek uygulamada burada font dosyasını yükleyip URL almamız gerekir
            // Şimdilik sadece dosya adını font ailesi olarak set ediyoruz
            const fontName = file.name.split('.')[0];
            onChange(fontName);

            // Fontu tarayıcıya eklemek için FileReader (Demo amaçlı)
            const reader = new FileReader();
            reader.onload = (event) => {
                const fontUrl = event.target?.result as string;
                const newStyle = document.createElement('style');
                newStyle.appendChild(document.createTextNode(`
                    @font-face {
                        font-family: '${fontName}';
                        src: url('${fontUrl}');
                    }
                `));
                document.head.appendChild(newStyle);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="mb-4">
            <label className="text-xs font-medium opacity-50 block mb-2 uppercase">{label}</label>
            <div className="flex gap-2">
                <select
                    value={GOOGLE_FONTS.includes(value) ? value : 'custom'}
                    onChange={(e) => {
                        if (e.target.value !== 'custom') onChange(e.target.value);
                    }}
                    className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#a62932] focus:outline-none transition-colors appearance-none"
                    style={{ fontFamily: value }}
                >
                    {GOOGLE_FONTS.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                    ))}
                    {!GOOGLE_FONTS.includes(value) && <option value="custom">Custom ({value})</option>}
                </select>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-xs"
                    title="Bilgisayardan Font Yükle"
                >
                    📁
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
            {!GOOGLE_FONTS.includes(value) && (
                <div className="mt-1 text-xs text-[#a62932]">⚠️ Custom font: {value}</div>
            )}
        </div>
    );
}
