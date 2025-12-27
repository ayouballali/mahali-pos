/**
 * Moroccan Grocery POS - Main Application
 * Production-ready architecture with Preact
 *
 * @version 1.0.0
 * @author Claude Code
 */

import { html, render, useState } from './lib/preact.js';
import { HomeTab } from './components/HomeTab.js';
import { SellTab } from './components/SellTab.js';
import { ProductsTab } from './components/ProductsTab.js';
import { ReportsTab } from './components/ReportsTab.js';
import { BottomNav } from './components/BottomNav.js';

/**
 * Main App Component
 * @returns {import('preact').VNode}
 */
function App() {
    const [activeTab, setActiveTab] = useState('home-tab');

    return html`
        <div class="content-wrapper">
            <${HomeTab} isActive=${activeTab === 'home-tab'} />
            <${SellTab} isActive=${activeTab === 'sell-tab'} />
            <${ProductsTab} isActive=${activeTab === 'products-tab'} />
            <${ReportsTab} isActive=${activeTab === 'reports-tab'} />
        </div>
        <${BottomNav} activeTab=${activeTab} onTabChange=${setActiveTab} />
    `;
}

// Initialize Application
render(html`<${App} />`, document.getElementById('app'));
