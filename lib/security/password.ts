/**
 * Password strength validation utility
 * Implements secure password policies
 */

export interface PasswordValidationResult {
    valid: boolean;
    score: number; // 0-100
    errors: string[];
    suggestions: string[];
}

// Common weak passwords to reject
const COMMON_PASSWORDS = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'password1', 'iloveyou', 'sunshine', 'princess',
    'football', 'baseball', 'soccer', 'hockey', 'batman',
    'trustno1', 'dragon', 'master', 'hello', 'charlie',
    'donald', 'login', 'passw0rd', 'shadow', 'ashley',
    'sifre', 'sifre123', 'parola', '123456789', 'qwerty123',
];

// Sequential patterns to detect
const SEQUENTIAL_PATTERNS = [
    'abcdef', 'bcdefg', 'cdefgh', 'defghi', 'efghij',
    'qwerty', 'asdfgh', 'zxcvbn', '123456', '234567',
    '345678', '456789', '567890', 'fedcba', '654321',
];

/**
 * Validate password strength
 */
export function validatePassword(password: string, email?: string): PasswordValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check (minimum 8 characters)
    if (password.length < 8) {
        errors.push('Şifre en az 8 karakter olmalıdır');
    } else {
        score += 20;
        if (password.length >= 12) {
            score += 10;
        }
        if (password.length >= 16) {
            score += 10;
        }
    }

    // Maximum length (prevent DoS)
    if (password.length > 128) {
        errors.push('Şifre 128 karakterden uzun olamaz');
    }

    // Contains lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push('Şifre en az 1 küçük harf içermelidir');
        suggestions.push('Küçük harf ekleyin');
    } else {
        score += 15;
    }

    // Contains uppercase letter
    if (!/[A-Z]/.test(password)) {
        suggestions.push('Büyük harf ekleyerek güvenliği artırabilirsiniz');
    } else {
        score += 15;
    }

    // Contains number
    if (!/\d/.test(password)) {
        errors.push('Şifre en az 1 rakam içermelidir');
    } else {
        score += 15;
    }

    // Contains special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        suggestions.push('Özel karakter (!@#$%^&*) ekleyerek güvenliği artırabilirsiniz');
    } else {
        score += 15;
    }

    // Check for common passwords
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
        errors.push('Bu şifre çok yaygın, lütfen daha güçlü bir şifre seçin');
        score = Math.min(score, 20);
    }

    // Check for common passwords with number suffix
    const basePassword = lowerPassword.replace(/\d+$/, '');
    if (COMMON_PASSWORDS.includes(basePassword)) {
        errors.push('Bu şifre yaygın bir şifrenin varyasyonu, lütfen farklı bir şifre seçin');
        score = Math.min(score, 30);
    }

    // Check for sequential patterns
    for (const pattern of SEQUENTIAL_PATTERNS) {
        if (lowerPassword.includes(pattern)) {
            errors.push('Şifre ardışık karakter kalıpları içermemeli');
            score = Math.max(score - 20, 0);
            break;
        }
    }

    // Check for repeated characters (e.g., "aaa", "111")
    if (/(.)\1{2,}/.test(password)) {
        suggestions.push('Tekrarlanan karakterlerden kaçının');
        score = Math.max(score - 10, 0);
    }

    // Check if password contains email/username
    if (email) {
        const emailPrefix = email.split('@')[0].toLowerCase();
        if (emailPrefix.length > 3 && lowerPassword.includes(emailPrefix)) {
            errors.push('Şifre e-posta adresinizin bir parçasını içermemeli');
            score = Math.max(score - 20, 0);
        }
    }

    // Entropy calculation (rough estimate)
    const uniqueChars = new Set(password).size;
    if (uniqueChars < password.length * 0.5) {
        suggestions.push('Daha çeşitli karakterler kullanın');
        score = Math.max(score - 10, 0);
    }

    // Cap score at 100
    score = Math.min(score, 100);

    return {
        valid: errors.length === 0,
        score,
        errors,
        suggestions,
    };
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): { label: string; color: string } {
    if (score < 30) {
        return { label: 'Çok Zayıf', color: 'red' };
    }
    if (score < 50) {
        return { label: 'Zayıf', color: 'orange' };
    }
    if (score < 70) {
        return { label: 'Orta', color: 'yellow' };
    }
    if (score < 90) {
        return { label: 'Güçlü', color: 'green' };
    }
    return { label: 'Çok Güçlü', color: 'emerald' };
}

/**
 * Generate a secure random password (cryptographically secure)
 */
export function generateSecurePassword(length: number = 16): string {
    const crypto = require('crypto');
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=';
    const all = lowercase + uppercase + numbers + special;

    const randomIndex = (max: number): number => {
        const bytes = crypto.randomBytes(4);
        return bytes.readUInt32BE(0) % max;
    };

    let chars: string[] = [];

    // Ensure at least one of each type
    chars.push(lowercase[randomIndex(lowercase.length)]);
    chars.push(uppercase[randomIndex(uppercase.length)]);
    chars.push(numbers[randomIndex(numbers.length)]);
    chars.push(special[randomIndex(special.length)]);

    // Fill rest randomly
    for (let i = chars.length; i < length; i++) {
        chars.push(all[randomIndex(all.length)]);
    }

    // Fisher-Yates shuffle with crypto random
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomIndex(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
}
