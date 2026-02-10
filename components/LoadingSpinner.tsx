'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

export default function LoadingSpinner({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16'
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-4">
            <motion.div
                className={`${sizes[size]} border-2 border-[#a62932]/20 border-t-[#a62932] rounded-full`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {text && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium opacity-60"
                >
                    {text}
                </motion.p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}

// Skeleton loading for cards
export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse rounded-xl bg-current/5 ${className}`}>
            <div className="aspect-video bg-current/10 rounded-t-xl" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-current/10 rounded w-3/4" />
                <div className="h-3 bg-current/10 rounded w-1/2" />
            </div>
        </div>
    );
}

// Skeleton loading for list items
export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-current/5">
                    <div className="w-10 h-10 rounded-full bg-current/10" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-current/10 rounded w-1/3" />
                        <div className="h-3 bg-current/10 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}
