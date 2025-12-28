/**
 * SVG Icon Components
 * Modern, clean icons for the POS app
 */

import { html } from '../lib/preact.js';

export const Icons = {
    Home: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
    `,

    Package: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
    `,

    Camera: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
        </svg>
    `,

    Barcode: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Barcode scanner frame -->
            <path d="M3 7V5a2 2 0 0 1 2-2h3"/>
            <path d="M21 7V5a2 2 0 0 0-2-2h-3"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-3"/>
            <path d="M3 17v2a2 2 0 0 0 2 2h3"/>
            <!-- Scan line -->
            <line x1="7" y1="12" x2="17" y2="12"/>
        </svg>
    `,

    Image: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
        </svg>
    `,

    BarChart: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="20" x2="12" y2="10"/>
            <line x1="18" y1="20" x2="18" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="16"/>
        </svg>
    `,

    Settings: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    `,

    Search: () => html`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
        </svg>
    `,

    TrendingUp: () => html`
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
        </svg>
    `,

    DollarSign: () => html`
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
    `,

    Receipt: () => html`
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
            <path d="M12 17.5v2m0-13v2"/>
        </svg>
    `,

    ShoppingCart: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
    `,

    Keyboard: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
        </svg>
    `,

    Plus: () => html`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
    `,

    Wave: () => html`
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 5-7 5 7 7 7 5-7 7-7"/>
        </svg>
    `,

    // Mahali Logo - Local grocery store icon with Moroccan feel
    MahaliLogo: () => html`
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <!-- Store building shape -->
            <path d="M8 44h32V20H8v24z" fill="#22c55e" opacity="0.1"/>
            <path d="M8 44h32V20H8v24z" stroke="#22c55e" stroke-width="2"/>

            <!-- Awning/roof with Moroccan pattern -->
            <path d="M4 20l20-12 20 12H4z" fill="#22c55e"/>
            <path d="M4 20l20-12 20 12" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>

            <!-- Decorative Moroccan arches -->
            <path d="M14 28c0-2 1-3 2-3s2 1 2 3" stroke="#22c55e" stroke-width="1.5" fill="none"/>
            <path d="M30 28c0-2 1-3 2-3s2 1 2 3" stroke="#22c55e" stroke-width="1.5" fill="none"/>

            <!-- Shop windows -->
            <rect x="12" y="30" width="6" height="8" rx="1" fill="#fff" stroke="#22c55e" stroke-width="1.5"/>
            <rect x="30" y="30" width="6" height="8" rx="1" fill="#fff" stroke="#22c55e" stroke-width="1.5"/>

            <!-- Door -->
            <rect x="20" y="32" width="8" height="12" rx="1" fill="#fff" stroke="#22c55e" stroke-width="2"/>
            <circle cx="25" cy="38" r="1" fill="#22c55e"/>

            <!-- Star detail (Moroccan star) -->
            <path d="M24 12l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3-2.5-2h3z" fill="#fbbf24"/>
        </svg>
    `,

    // Simplified Mahali icon for small sizes
    MahaliIcon: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 22h20V10H2v12z" stroke="currentColor" stroke-width="2"/>
            <path d="M1 10l11-6 11 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="9" y="16" width="6" height="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 6l.5 1.5h1.5l-1.2 1 .5 1.5-1.3-1-1.3 1 .5-1.5-1.2-1h1.5z" fill="currentColor"/>
        </svg>
    `,

    // Arrow Right (for back button in RTL)
    ArrowRight: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
        </svg>
    `,

    // Scale (for weight-based products)
    Scale: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Balance scale with two pans -->
            <line x1="12" y1="4" x2="12" y2="10"/>
            <line x1="6" y1="10" x2="18" y2="10"/>
            <path d="M6 10l-3 6h6l-3-6z"/>
            <path d="M18 10l-3 6h6l-3-6z"/>
            <line x1="12" y1="10" x2="12" y2="20"/>
            <line x1="8" y1="20" x2="16" y2="20"/>
        </svg>
    `,

    // Trending Down (for negative profit)
    TrendingDown: () => html`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
            <polyline points="17 18 23 18 23 12"/>
        </svg>
    `,
};
