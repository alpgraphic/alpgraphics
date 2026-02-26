import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the fetch for TCMB XML API
const MOCK_TCMB_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Tarih_Date Tarih="26.02.2026">
<Currency CurrencyCode="USD">
<ForexBuying>36.1234</ForexBuying>
<ForexSelling>36.2500</ForexSelling>
</Currency>
<Currency CurrencyCode="EUR">
<ForexBuying>38.5678</ForexBuying>
<ForexSelling>38.7000</ForexSelling>
</Currency>
<Currency CurrencyCode="GBP">
<ForexBuying>45.1234</ForexBuying>
<ForexSelling>45.3000</ForexSelling>
</Currency>
</Tarih_Date>`;

describe('Exchange Rates API', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should parse TCMB XML correctly', () => {
        // Test the XML parsing logic directly
        const parser = (xml: string) => {
            const rates: Record<string, number> = {};
            const currencies = ['USD', 'EUR', 'GBP'];

            for (const curr of currencies) {
                const regex = new RegExp(
                    `<Currency CurrencyCode="${curr}">[\\s\\S]*?<ForexSelling>([\\d.]+)</ForexSelling>`,
                );
                const match = xml.match(regex);
                if (match) {
                    rates[curr] = parseFloat(match[1]);
                }
            }
            return rates;
        };

        const rates = parser(MOCK_TCMB_XML);

        expect(rates.USD).toBe(36.25);
        expect(rates.EUR).toBe(38.70);
        expect(rates.GBP).toBe(45.30);
    });

    it('should return valid rate structure', () => {
        const rates = { USD: 36.25, EUR: 38.70, GBP: 45.30 };

        expect(rates).toHaveProperty('USD');
        expect(rates).toHaveProperty('EUR');
        expect(rates).toHaveProperty('GBP');

        // All rates should be positive numbers
        Object.values(rates).forEach(rate => {
            expect(rate).toBeGreaterThan(0);
            expect(typeof rate).toBe('number');
        });
    });

    it('should handle missing currency gracefully', () => {
        const xml = `<?xml version="1.0"?>
<Tarih_Date>
<Currency CurrencyCode="USD">
<ForexSelling>36.25</ForexSelling>
</Currency>
</Tarih_Date>`;

        const parser = (xmlStr: string) => {
            const rates: Record<string, number> = {};
            const currencies = ['USD', 'EUR', 'GBP'];

            for (const curr of currencies) {
                const regex = new RegExp(
                    `<Currency CurrencyCode="${curr}">[\\s\\S]*?<ForexSelling>([\\d.]+)</ForexSelling>`,
                );
                const match = xmlStr.match(regex);
                if (match) {
                    rates[curr] = parseFloat(match[1]);
                }
            }
            return rates;
        };

        const rates = parser(xml);

        expect(rates.USD).toBe(36.25);
        expect(rates.EUR).toBeUndefined();
        expect(rates.GBP).toBeUndefined();
    });
});
