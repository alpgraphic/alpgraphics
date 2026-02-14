import { NextResponse } from 'next/server';

/**
 * TCMB (Türkiye Cumhuriyet Merkez Bankası) Exchange Rates API
 * 
 * Fetches daily exchange rates from TCMB
 * Updates: Once daily (11:30 Turkey time)
 */

interface TCMBCurrency {
    code: string;
    name: string;
    forexBuying: number;
    forexSelling: number;
    banknoteBuying: number;
    banknoteSelling: number;
}

interface ExchangeRatesResponse {
    success: boolean;
    rates: {
        USD: number;
        EUR: number;
        GBP: number;
    };
    lastUpdated: string;
    source: string;
}

// Cache for rates (update once daily)
let cachedRates: ExchangeRatesResponse | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

async function fetchTCMBRates(): Promise<{ USD: number; EUR: number; GBP: number }> {
    try {
        // TCMB provides XML feed
        const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error('TCMB API error');
        }

        const xmlText = await response.text();

        // Parse XML manually (simple extraction)
        const getRate = (code: string): number => {
            const regex = new RegExp(`<Currency.*?Kod="${code}"[^>]*>.*?<ForexSelling>([\\d.]+)</ForexSelling>`, 's');
            const match = xmlText.match(regex);
            return match ? parseFloat(match[1]) : 0;
        };

        const usd = getRate('USD');
        const eur = getRate('EUR');
        const gbp = getRate('GBP');

        // Validate rates are reasonable (above 1 TRY, below 1000 TRY)
        const isValid = (rate: number) => rate > 1 && rate < 1000;

        return {
            USD: isValid(usd) ? usd : 43.50, // Fallback (güncellendi: Şubat 2026)
            EUR: isValid(eur) ? eur : 51.30,
            GBP: isValid(gbp) ? gbp : 58.00,
        };
    } catch (error) {
        console.error('TCMB fetch error:', error);
        // Return fallback rates
        return {
            USD: 43.50,
            EUR: 51.30,
            GBP: 58.00,
        };
    }
}

export async function GET(): Promise<NextResponse<ExchangeRatesResponse>> {
    const now = Date.now();

    // Return cached if fresh
    if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
        return NextResponse.json(cachedRates);
    }

    // Fetch fresh rates
    const rates = await fetchTCMBRates();

    cachedRates = {
        success: true,
        rates,
        lastUpdated: new Date().toISOString(),
        source: 'TCMB',
    };
    lastFetchTime = now;

    return NextResponse.json(cachedRates);
}
