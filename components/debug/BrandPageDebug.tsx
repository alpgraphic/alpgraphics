/**
 * Brand Page Debug Component
 * Shows published brand pages for testing
 */

"use client";

import { useAgency } from "@/context/AgencyContext";
import { useEffect, useState } from "react";

export default function BrandPageDebug() {
    const { projects } = useAgency();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check for debug query param
        const params = new URLSearchParams(window.location.search);
        if (params.get('debug') === 'brand-pages') {
            setIsOpen(true);
        }
    }, []);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9998] bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors text-xs font-mono"
            >
                🐛 Debug Brand Pages
            </button>
        );
    }

    const brandPages = projects.filter(p => 
        p.category === 'Brand Page' || p.category === 'Brand Value'
    );

    const publishedBrandPages = brandPages.filter(p =>
        p.isPagePublished === true || p.status === 'Completed'
    );

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-white border-2 border-blue-500 rounded-lg shadow-2xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
                <h3 className="font-bold text-lg">🐛 Brand Pages Debug</h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-black"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
                {/* Summary */}
                <div className="bg-gray-100 p-3 rounded">
                    <div className="font-bold mb-2">📊 Summary:</div>
                    <div>Total Projects: {projects.length}</div>
                    <div>Brand Pages (all): {brandPages.length}</div>
                    <div className="text-green-600 font-bold">
                        Published Brand Pages: {publishedBrandPages.length}
                    </div>
                </div>

                {/* All Brand Pages */}
                <div>
                    <div className="font-bold mb-2">📄 All Brand Pages:</div>
                    {brandPages.length === 0 ? (
                        <div className="text-gray-500 italic">No brand pages found</div>
                    ) : (
                        <div className="space-y-2">
                            {brandPages.map(p => (
                                <div
                                    key={p.id}
                                    className={`p-2 rounded border-2 ${
                                        p.isPagePublished || p.status === 'Completed'
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-300 bg-gray-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold">{p.title}</div>
                                        {(p.isPagePublished || p.status === 'Completed') && (
                                            <span className="text-green-600">✅ PUBLISHED</span>
                                        )}
                                    </div>
                                    <div className="text-gray-600 space-y-1">
                                        <div>ID: {p.id}</div>
                                        <div>Category: {p.category}</div>
                                        <div>Status: {p.status}</div>
                                        <div>
                                            isPagePublished: {p.isPagePublished ? 'true ✅' : 'false ❌'}
                                        </div>
                                        <div>
                                            Has brandData: {p.brandData ? 'true ✅' : 'false ❌'}
                                        </div>
                                        <div className="mt-2 pt-2 border-t">
                                            Will show in Work: {
                                                (p.category === 'Brand Page' || p.category === 'Brand Value') &&
                                                (p.isPagePublished === true || p.status === 'Completed')
                                                    ? '✅ YES'
                                                    : '❌ NO'
                                            }
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* LocalStorage Check */}
                <div className="bg-yellow-50 border border-yellow-300 p-3 rounded">
                    <div className="font-bold mb-2">💾 LocalStorage Check:</div>
                    <button
                        onClick={() => {
                            const data = localStorage.getItem('agency_data_v3');
                            if (data) {
                                const parsed = JSON.parse(data);
                                console.log('📦 LocalStorage data:', parsed);
                                console.log('📦 Projects:', parsed.projects);
                                alert('Check console for full data');
                            }
                        }}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs"
                    >
                        Log to Console
                    </button>
                </div>

                {/* Actions */}
                <div className="bg-blue-50 border border-blue-300 p-3 rounded">
                    <div className="font-bold mb-2">🔧 Quick Actions:</div>
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                window.location.href = '/admin/dashboard';
                            }}
                            className="w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
                        >
                            → Go to Admin Dashboard
                        </button>
                        <button
                            onClick={() => {
                                window.location.href = '/?section=work';
                            }}
                            className="w-full bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
                        >
                            → Check Work Section
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('This will refresh the page. Continue?')) {
                                    window.location.reload();
                                }
                            }}
                            className="w-full bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
                        >
                            🔄 Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
