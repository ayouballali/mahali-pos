/**
 * Bottom Navigation Component
 * Fixed bottom navigation bar with 5 tabs
 */

import { html } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { vibrate } from '../utils/helpers.js';

export function BottomNav({ activeTab, onTabChange }) {
    const navItems = [
        { id: 'home-tab', icon: Icons.Home, label: 'الرئيسية', isPrimary: false },
        { id: 'products-tab', icon: Icons.Package, label: 'المنتجات', isPrimary: false },
        { id: 'sell-tab', icon: Icons.ShoppingCart, label: 'بيع', isPrimary: true },
        { id: 'reports-tab', icon: Icons.BarChart, label: 'التقارير', isPrimary: false },
        { id: 'settings-tab', icon: Icons.Settings, label: 'الإعدادات', isPrimary: false },
    ];

    const handleNavClick = (tabId) => {
        onTabChange(tabId);
        vibrate();
    };

    return html`
        <nav class="bottom-nav">
            ${navItems.map(item => html`
                <button
                    key=${item.id}
                    class="${item.isPrimary ? 'nav-item nav-item-primary' : 'nav-item'} ${activeTab === item.id ? 'active' : ''}"
                    onClick=${() => handleNavClick(item.id)}
                >
                    ${item.isPrimary
                        ? html`<span class="nav-icon-large"><${item.icon} /></span>`
                        : html`<span class="nav-icon"><${item.icon} /></span>`
                    }
                    <span class="nav-label">${item.label}</span>
                </button>
            `)}
        </nav>
    `;
}
