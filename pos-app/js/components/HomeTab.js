/**
 * Home Tab Component
 * Displays dashboard with greeting, summary, and activity
 *
 * @version 1.0.0
 */

import { html, useState, useEffect } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { getGreeting, formatCurrency } from '../utils/helpers.js';
import { todayStats } from '../data/mockData.js';

/**
 * Home Tab Component
 * @param {Object} props
 * @param {boolean} props.isActive - Whether this tab is currently active
 * @returns {import('preact').VNode}
 */
export function HomeTab({ isActive }) {
    const [greeting, setGreeting] = useState(getGreeting());

    useEffect(() => {
        // Update greeting every minute
        const interval = setInterval(() => {
            setGreeting(getGreeting());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Get stats from mock data
    const { sales, profit } = todayStats;

    return html`
        <div class="tab-content ${isActive ? 'active' : ''}" id="home-tab">
            <!-- Brand Icon - Top Corner -->
            <div class="brand-corner">
                <${Icons.MahaliIcon} />
            </div>

            <!-- Greeting -->
            <div class="greeting">
                <h1>${greeting}</h1>
            </div>

            <!-- Main Actions -->
            <div class="main-actions">
                <h2 class="section-title">ابدأ البيع (Start Sale)</h2>

                <button class="action-btn action-btn-primary">
                    <div class="action-icon">
                        <${Icons.Camera} />
                    </div>
                    <div class="action-content">
                        <div class="action-title">مسح الباركود</div>
                        <div class="action-subtitle">Scan Barcode</div>
                    </div>
                </button>

                <button class="action-btn action-btn-secondary">
                    <div class="action-icon">
                        <${Icons.ShoppingCart} />
                    </div>
                    <div class="action-content">
                        <div class="action-title">اختيار يدوي</div>
                        <div class="action-subtitle">Manual Selection</div>
                    </div>
                </button>

                <button class="action-btn action-btn-tertiary">
                    <div class="action-icon">
                        <${Icons.Receipt} />
                    </div>
                    <div class="action-content">
                        <div class="action-title">تسجيل سريع</div>
                        <div class="action-subtitle">Quick Cash In</div>
                    </div>
                </button>
            </div>

            <!-- Today's Summary Card -->
            <div class="summary-card">
                <div class="summary-header">اليوم (Today)</div>
                <div class="summary-stats">
                    <div class="stat">
                        <div class="stat-value">${formatCurrency(sales, { decimals: 0 })}</div>
                        <div class="stat-label">المبيعات<br />(Sales)</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat">
                        <div class="stat-value">${formatCurrency(profit, { decimals: 0 })}</div>
                        <div class="stat-label">الربح<br />(Profit)</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
