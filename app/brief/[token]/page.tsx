"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { briefTemplates, BriefFormType, BriefQuestion } from "@/lib/briefTypes";

export default function BriefFormPage() {
    const params = useParams();
    const token = params.token as string;

    const [formData, setFormData] = useState<{
        accountId: string;
        formType: BriefFormType;
        accountName: string;
        accountCompany: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [responses, setResponses] = useState<Record<string, string | string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Fetch form data based on token
    useEffect(() => {
        const fetchFormData = async () => {
            try {
                const res = await fetch(`/api/brief/${token}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('Bu brief formu bulunamadı veya süresi dolmuş.');
                    } else {
                        setError('Form yüklenirken bir hata oluştu.');
                    }
                    setIsLoading(false);
                    return;
                }
                const data = await res.json();
                if (data.success) {
                    setFormData(data.data);
                } else {
                    setError(data.error || 'Form bulunamadı.');
                }
            } catch (err) {
                setError('Bağlantı hatası. Lütfen tekrar deneyin.');
            }
            setIsLoading(false);
        };

        fetchFormData();
    }, [token]);

    const template = useMemo(() => {
        if (!formData?.formType) return null;
        return briefTemplates.find(t => t.id === formData.formType);
    }, [formData]);

    const handleInputChange = (questionId: string, value: string | string[]) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handleMultiSelectToggle = (questionId: string, option: string) => {
        const current = (responses[questionId] as string[]) || [];
        if (current.includes(option)) {
            handleInputChange(questionId, current.filter(o => o !== option));
        } else {
            handleInputChange(questionId, [...current, option]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/brief/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses })
            });

            const data = await res.json();

            if (data.success) {
                setIsSubmitted(true);
            } else {
                setSubmitError(data.error || 'Gönderim başarısız');
            }
        } catch (err) {
            setSubmitError('Bağlantı hatası. Lütfen tekrar deneyin.');
        }

        setIsSubmitting(false);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f5f3e9] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#a62932] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm opacity-40">Form yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-[#f5f3e9] flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <div className="text-6xl mb-6">❌</div>
                    <h1 className="text-2xl font-bold mb-4">Form Bulunamadı</h1>
                    <p className="text-lg opacity-60 mb-8">{error}</p>
                    <a
                        href="https://alpgraphics.com"
                        className="inline-block px-8 py-4 bg-[#a62932] text-white font-bold rounded-lg hover:bg-[#c4323d] transition-colors"
                    >
                        Ana Sayfaya Dön
                    </a>
                </div>
            </div>
        );
    }

    // Success state
    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#f5f3e9] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md text-center"
                >
                    <div className="text-6xl mb-6">✅</div>
                    <h1 className="text-3xl font-[900] tracking-tight mb-4">Teşekkürler!</h1>
                    <p className="text-lg opacity-60 mb-8">
                        Brief formunuz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.
                    </p>
                    <a
                        href="https://alpgraphics.com"
                        className="inline-block px-8 py-4 bg-[#a62932] text-white font-bold rounded-lg hover:bg-[#c4323d] transition-colors"
                    >
                        alpgraphics.com
                    </a>
                </motion.div>
            </div>
        );
    }

    if (!template || !formData) {
        return (
            <div className="min-h-screen bg-[#f5f3e9] flex items-center justify-center">
                <p>Form bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f3e9] text-[#1a1a1a]">
            {/* Header */}
            <header className="border-b border-black/10 bg-white/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-[900] tracking-tight">alpgraphics</h1>
                        <p className="text-xs opacity-40 uppercase tracking-widest">Client Brief Form</p>
                    </div>
                    <div className="text-3xl">{template.icon}</div>
                </div>
            </header>

            {/* Form Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                {/* Client Info */}
                <div className="mb-8 p-4 bg-white/50 rounded-lg border border-black/5">
                    <p className="text-sm opacity-60">
                        <strong>{formData.accountCompany}</strong> için hazırlanmış brief formu
                    </p>
                </div>

                {/* Form Header */}
                <div className="mb-12">
                    <h2 className="text-4xl md:text-5xl font-[900] tracking-tight mb-4">
                        {template.name}
                    </h2>
                    <p className="text-lg opacity-60">
                        {template.description}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {template.questions.map((question, index) => (
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/80 rounded-xl p-6 border border-black/5"
                        >
                            <label className="block mb-4">
                                <span className="text-lg font-bold">
                                    {question.question}
                                    {question.required && <span className="text-[#a62932] ml-1">*</span>}
                                </span>
                            </label>

                            {question.type === 'text' && (
                                <input
                                    type="text"
                                    value={(responses[question.id] as string) || ''}
                                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                                    placeholder={question.placeholder}
                                    required={question.required}
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 bg-white focus:border-[#a62932] focus:outline-none transition-colors"
                                />
                            )}

                            {question.type === 'textarea' && (
                                <textarea
                                    value={(responses[question.id] as string) || ''}
                                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                                    placeholder={question.placeholder}
                                    required={question.required}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 bg-white focus:border-[#a62932] focus:outline-none transition-colors resize-none"
                                />
                            )}

                            {question.type === 'select' && (
                                <select
                                    value={(responses[question.id] as string) || ''}
                                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                                    required={question.required}
                                    className="w-full px-4 py-3 rounded-lg border border-black/10 bg-white focus:border-[#a62932] focus:outline-none transition-colors"
                                >
                                    <option value="">Seçiniz...</option>
                                    {question.options?.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            )}

                            {question.type === 'multiselect' && (
                                <div className="flex flex-wrap gap-2">
                                    {question.options?.map(option => {
                                        const isSelected = ((responses[question.id] as string[]) || []).includes(option);
                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => handleMultiSelectToggle(question.id, option)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected
                                                        ? 'bg-[#a62932] text-white'
                                                        : 'bg-black/5 hover:bg-black/10'
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {/* Submit Error */}
                    {submitError && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-center">
                            {submitError}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-8">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            onClick={() => setSubmitError(null)}
                            className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${isSubmitting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-[#a62932] hover:bg-[#c4323d] text-white shadow-lg shadow-[#a62932]/20'
                                }`}
                        >
                            {isSubmitting ? 'Gönderiliyor...' : 'Formu Gönder'}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-black/10 text-center">
                    <p className="text-sm opacity-40">
                        © 2026 alpgraphics. All rights reserved.
                    </p>
                </footer>
            </main>
        </div>
    );
}
