/**
 * File Upload Service with Base64 Storage
 * 
 * Features:
 * - Base64 encoding for file storage
 * - File validation (size, type)
 * - Image compression
 * - Progress tracking
 * 
 * Note: For production, consider implementing cloud storage (Vercel Blob, S3, etc.)
 */

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
    size?: number;
    format?: string;
    storage?: 'cloud' | 'base64';
}

export interface UploadOptions {
    maxSize?: number; // in bytes
    allowedFormats?: string[];
    folder?: string;
    compress?: boolean;
    quality?: number; // 0-100 for compression
}

const DEFAULT_OPTIONS: UploadOptions = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
    compress: false,
    quality: 85
};

/**
 * Check if Vercel Blob is configured (currently disabled)
 */
function isCloudStorageEnabled(): boolean {
    // Cloud storage disabled - using base64 only
    return false;
}

/**
 * Validates file before upload
 */
export function validateFile(file: File, options: UploadOptions = {}): { valid: boolean; error?: string } {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Check file size
    if (opts.maxSize && file.size > opts.maxSize) {
        return {
            valid: false,
            error: `File too large. Maximum size is ${(opts.maxSize / 1024 / 1024).toFixed(1)}MB`
        };
    }

    // Check file type
    if (opts.allowedFormats && !opts.allowedFormats.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${opts.allowedFormats.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Uploads file to Vercel Blob Storage (or base64 fallback)
 */
export async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Validate
    const validation = validateFile(file, opts);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error
        };
    }

    try {
        // Try Vercel Blob if configured
        if (isCloudStorageEnabled()) {
            return await uploadToCloud(file, opts);
        } else {
            console.warn('⚠️ Vercel Blob not configured, falling back to base64');
            return await uploadToBase64(file);
        }
    } catch (error) {
        console.error('Upload error:', error);

        // Fallback to base64 on cloud error
        console.warn('☁️ Cloud upload failed, falling back to base64');
        return await uploadToBase64(file);
    }
}

/**
 * Upload to Cloud Storage (placeholder - not implemented)
 * For production, implement Vercel Blob, AWS S3, or other cloud storage here
 */
async function uploadToCloud(_file: File, _options: UploadOptions): Promise<UploadResult> {
    // Cloud storage not configured - this should not be called
    // as isCloudStorageEnabled() returns false
    return {
        success: false,
        error: 'Cloud storage not configured'
    };
}

/**
 * Fallback: Upload to base64
 */
async function uploadToBase64(file: File): Promise<UploadResult> {
    try {
        const base64 = await fileToBase64(file);

        return {
            success: true,
            url: base64,
            size: file.size,
            format: file.type,
            storage: 'base64'
        };
    } catch (error) {
        console.error('Base64 conversion error:', error);
        throw error;
    }
}

/**
 * Uploads multiple files
 */
export async function uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => uploadFile(file, options));
    return Promise.all(uploadPromises);
}

/**
 * Helper: Convert file to base64
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Helper: Compress image (client-side)
 */
export async function compressImage(file: File, quality: number = 85): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');

                // Calculate new dimensions (max 2000px)
                const MAX_SIZE = 2000;
                let width = img.width;
                let height = img.height;

                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = (height / width) * MAX_SIZE;
                        width = MAX_SIZE;
                    } else {
                        width = (width / height) * MAX_SIZE;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    },
                    file.type,
                    quality / 100
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Get file info without uploading
 */
export async function getFileInfo(file: File): Promise<{
    name: string;
    size: number;
    type: string;
    sizeFormatted: string;
    dimensions?: { width: number; height: number };
}> {
    const sizeInMB = (file.size / 1024 / 1024).toFixed(2);

    const info = {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeFormatted: `${sizeInMB}MB`
    };

    // Get image dimensions if it's an image
    if (file.type.startsWith('image/')) {
        try {
            const dimensions = await getImageDimensions(file);
            return { ...info, dimensions };
        } catch {
            return info;
        }
    }

    return info;
}

/**
 * Helper: Get image dimensions
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Delete file from cloud storage
 */
export async function deleteFile(url: string): Promise<boolean> {
    try {
        // Only delete cloud URLs
        if (!url.includes('vercel-storage') && !url.includes('blob.vercel-storage')) {
            return true;
        }

        const response = await fetch('/api/upload/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        return response.ok;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
}
