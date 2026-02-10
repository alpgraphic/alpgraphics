/**
 * API Response Types & Utilities
 * Provides type-safe API responses and error handling
 */

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp?: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: any;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

/**
 * Creates a successful API response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    };
}

/**
 * Creates an error API response
 */
export function errorResponse(error: string | Error, code?: string): ApiResponse {
    const message = error instanceof Error ? error.message : error;
    
    return {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    };
}

/**
 * Validates required fields in request body
 */
export function validateRequired<T extends Record<string, any>>(
    body: T,
    fields: (keyof T)[]
): { valid: boolean; missing?: string[] } {
    const missing = fields.filter(field => {
        const value = body[field];
        return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
        return { valid: false, missing: missing as string[] };
    }

    return { valid: true };
}

/**
 * Type guard for checking if value is an error
 */
export function isError(value: any): value is Error {
    return value instanceof Error;
}

/**
 * Safely parse JSON with error handling
 */
export async function safeJsonParse<T = any>(
    text: string
): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
        const data = JSON.parse(text) as T;
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Invalid JSON'
        };
    }
}

/**
 * Retry mechanism for failed API calls
 */
export async function retryAsync<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryAsync(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}
