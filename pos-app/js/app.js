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
    const [canNavigateAway, setCanNavigateAway] = useState(null);
    const [pendingTab, setPendingTab] = useState(null);

    const handleTabChange = (newTab) => {
        // If we have a navigation guard, ask it first
        if (canNavigateAway) {
            setPendingTab(newTab);
            const canNavigate = canNavigateAway();
            if (!canNavigate) return; // Blocked - waiting for user confirmation
        }
        setActiveTab(newTab);
    };

    // Function for ProductsTab to confirm navigation
    const confirmNavigation = () => {
        if (pendingTab) {
            setActiveTab(pendingTab);
            setPendingTab(null);
        }
    };

    return html`
        <div class="content-wrapper">
            <${HomeTab} isActive=${activeTab === 'home-tab'} />
            <${SellTab} isActive=${activeTab === 'sell-tab'} />
            <${ProductsTab}
                isActive=${activeTab === 'products-tab'}
                setCanNavigateAway=${setCanNavigateAway}
                confirmNavigation=${confirmNavigation}
            />
            <${ReportsTab} isActive=${activeTab === 'reports-tab'} />
        </div>
        <${BottomNav} activeTab=${activeTab} onTabChange=${handleTabChange} />
    `;
}

// Initialize Application
render(html`<${App} />`, document.getElementById('app'));
