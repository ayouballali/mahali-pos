/**
 * Home Tab Component
 * Displays dashboard with greeting, summary, and activity
 *
 * @version 2.0.0
 */

import { html, useState, useEffect } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { getGreeting, formatCurrency } from '../utils/helpers.js';
import { transactionDB } from '../lib/db.js';

/**
 * Home Tab Component
 * @param {Object} props
 * @param {boolean} props.isActive - Whether this tab is currently active
 * @returns {import('preact').VNode}
 */
export function HomeTab({ isActive }) {
    const [greeting, setGreeting] = useState(getGreeting());
    const [stats, setStats] = useState({
        sales: 0,
        profit: 0,
        salesCount: 0,
        itemsSold: 0
    });
    const [loading, setLoading] = useState(true);

    // Load today's stats from database
    const loadStats = async () => {
        try {
            const todayStats = await transactionDB.getStats('today');
            setStats({
                sales: todayStats.sales,
                profit: todayStats.profit,
                salesCount: todayStats.salesCount,
                itemsSold: todayStats.itemsSold
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Update greeting every minute
        const interval = setInterval(() => {
            setGreeting(getGreeting());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Load stats when tab becomes active
    useEffect(() => {
        if (isActive) {
            loadStats();
        }
    }, [isActive]);

    const { sales, profit, salesCount, itemsSold } = stats;

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

            <!-- Today's Summary Card -->
            <div class="summary-card">
                <div class="summary-header">اليوم (Today)</div>
                <div class="summary-stats">
                    <div class="stat">
                        <div class="stat-value">${loading ? '...' : formatCurrency(sales, { decimals: 0 })}</div>
                        <div class="stat-label">المبيعات<br />(Sales)</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat">
                        <div class="stat-value">${loading ? '...' : formatCurrency(profit, { decimals: 0 })}</div>
                        <div class="stat-label">الربح<br />(Profit)</div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="quick-stats">
                <h2 class="section-title">النشاط اليوم (Today's Activity)</h2>
                <div class="stat-row">
                    <span class="stat-icon">
                        <${Icons.ShoppingCart} />
                    </span>
                    <span class="stat-text">${salesCount} عملية بيع</span>
                    <span class="stat-text-en">(${salesCount} sales)</span>
                </div>
                <div class="stat-row">
                    <span class="stat-icon">
                        <${Icons.Package} />
                    </span>
                    <span class="stat-text">${itemsSold} منتج مباع</span>
                    <span class="stat-text-en">(${itemsSold} items sold)</span>
                </div>
            </div>
        </div>
    `;
}
