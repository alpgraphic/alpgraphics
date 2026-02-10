"use client";

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
    message?: string;
}

export function LoadingSpinner({ size = 'md', fullScreen = false, message }: LoadingSpinnerProps) {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-4">
            <motion.div
                className={`${sizes[size]} border-4 border-current/20 border-t-[#a62932] rounded-full`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {message && (
                <p className="text-sm font-medium opacity-60 animate-pulse">{message}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center"
            >
                {spinner}
            </motion.div>
        );
    }

    return spinner;
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
            <LoadingSpinner size="lg" message={message} />
        </div>
    );
}
