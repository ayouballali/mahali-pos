/**
 * Reports Tab Component
 * Displays sales reports with period selector
 *
 * @version 1.0.0
 */

import { html, useState } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { vibrate, formatCurrency } from '../utils/helpers.js';
import { getStatsByPeriod } from '../data/mockData.js';

/**
 * Reports Tab Component
 * @param {Object} props
 * @param {boolean} props.isActive - Whether this tab is currently active
 * @returns {import('preact').VNode}
 */
export function ReportsTab({ isActive }) {
    const [selectedPeriod, setSelectedPeriod] = useState('اليوم');

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        vibrate();
    };

    // Get stats for selected period
    const periodData = getStatsByPeriod(selectedPeriod);
    const { sales, profit, salesCount, profitMargin } = periodData;

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
                    <div class="report-value">${formatCurrency(sales, { decimals: 0 })}</div>
                </div>
            </div>

            <div class="report-card">
                <div class="report-icon">
                    <${Icons.DollarSign} />
                </div>
                <div class="report-content">
                    <div class="report-label">الربح (Profit)</div>
                    <div class="report-value">${formatCurrency(profit, { decimals: 0 })}</div>
                    <div class="report-percentage">${profitMargin}%</div>
                </div>
            </div>

            <div class="report-card">
                <div class="report-icon">
                    <${Icons.Receipt} />
                </div>
                <div class="report-content">
                    <div class="report-label">عدد المبيعات (Sales Count)</div>
                    <div class="report-value">${salesCount}</div>
                </div>
            </div>
        </div>
    `;
}
