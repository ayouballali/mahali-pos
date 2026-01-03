/**
 * Reports Tab Component
 * Displays sales reports with period selector
 *
 * @version 2.0.0
 */

import { html, useState, useEffect } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { vibrate, formatCurrency } from '../utils/helpers.js';
import { transactionDB } from '../lib/db.js';

// Map Arabic period names to DB period keys
const periodMap = {
    'اليوم': 'today',
    'الأسبوع': 'week',
    'الشهر': 'month'
};

/**
 * Reports Tab Component
 * @param {Object} props
 * @param {boolean} props.isActive - Whether this tab is currently active
 * @returns {import('preact').VNode}
 */
export function ReportsTab({ isActive }) {
    const [selectedPeriod, setSelectedPeriod] = useState('اليوم');
    const [stats, setStats] = useState({
        sales: 0,
        profit: 0,
        salesCount: 0,
        itemsSold: 0,
        profitMargin: 0
    });
    const [loading, setLoading] = useState(true);

    // Load stats from database
    const loadStats = async (period) => {
        setLoading(true);
        try {
            const dbPeriod = periodMap[period] || 'today';
            const periodStats = await transactionDB.getStats(dbPeriod);
            setStats({
                sales: periodStats.sales,
                profit: periodStats.profit,
                salesCount: periodStats.salesCount,
                itemsSold: periodStats.itemsSold,
                profitMargin: periodStats.profitMargin
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        vibrate();
        loadStats(period);
    };

    // Load stats when tab becomes active or period changes
    useEffect(() => {
        if (isActive) {
            loadStats(selectedPeriod);
        }
    }, [isActive]);

    const { sales, profit, salesCount, itemsSold, profitMargin } = stats;

    return html`
        <div class="tab-content ${isActive ? 'active' : ''}" id="reports-tab">
            <div class="tab-header">
                <h2 class="tab-title">التقارير</h2>
            </div>

            <!-- Period Selector -->
            <div class="period-selector">
                <button
                    class="${selectedPeriod === 'اليوم' ? 'period-btn active' : 'period-btn'}"
                    onClick=${() => handlePeriodChange('اليوم')}
                >
                    اليوم
                </button>
                <button
                    class="${selectedPeriod === 'الأسبوع' ? 'period-btn active' : 'period-btn'}"
                    onClick=${() => handlePeriodChange('الأسبوع')}
                >
                    الأسبوع
                </button>
                <button
                    class="${selectedPeriod === 'الشهر' ? 'period-btn active' : 'period-btn'}"
                    onClick=${() => handlePeriodChange('الشهر')}
                >
                    الشهر
                </button>
            </div>

            <!-- Report Cards -->
            <div class="report-card">
                <div class="report-icon">
                    <${Icons.TrendingUp} />
                </div>
                <div class="report-content">
                    <div class="report-label">المبيعات (Sales)</div>
                    <div class="report-value">${loading ? '...' : formatCurrency(sales, { decimals: 0 })}</div>
                </div>
            </div>

            <div class="report-card">
                <div class="report-icon">
                    <${Icons.DollarSign} />
                </div>
                <div class="report-content">
                    <div class="report-label">الربح (Profit)</div>
                    <div class="report-value">${loading ? '...' : formatCurrency(profit, { decimals: 0 })}</div>
                    <div class="report-percentage">${profitMargin}%</div>
                </div>
            </div>

            <div class="report-card">
                <div class="report-icon">
                    <${Icons.Receipt} />
                </div>
                <div class="report-content">
                    <div class="report-label">عدد المبيعات (Sales Count)</div>
                    <div class="report-value">${loading ? '...' : salesCount}</div>
                </div>
            </div>

            <div class="report-card">
                <div class="report-icon">
                    <${Icons.Package} />
                </div>
                <div class="report-content">
                    <div class="report-label">المنتجات المباعة (Items Sold)</div>
                    <div class="report-value">${loading ? '...' : itemsSold}</div>
                </div>
            </div>
        </div>
    `;
}
