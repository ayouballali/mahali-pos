/**
 * Sell Tab Component
 * Displays options to start a sale (scan or manual entry)
 */

import { html } from '../lib/preact.js';
import { Icons } from './Icons.js';

export function SellTab({ isActive }) {
    return html`
        <div class="tab-content ${isActive ? 'active' : ''}" id="sell-tab">
            <div class="tab-center">
                <div class="sell-screen">
                    <div class="sell-icon">
                        <${Icons.Camera} />
                    </div>
                    <h2 class="sell-title">ابدأ البيع</h2>
                    <p class="sell-subtitle">امسح الباركود أو أضف منتج يدوياً</p>
                    <button class="btn-primary btn-scan">
                        <span class="btn-icon-inline">
                            <${Icons.Camera} />
                        </span>
                        <span class="btn-text">مسح الباركود</span>
                        <div class="btn-subtitle">(Scan Barcode)</div>
                    </button>
                    <button class="btn-secondary-outline">
                        <span class="btn-icon-inline">
                            <${Icons.Keyboard} />
                        </span>
                        <span class="btn-text">إدخال يدوي</span>
                        <div class="btn-subtitle-small">(Manual Entry)</div>
                    </button>
                </div>
            </div>
        </div>
    `;
}
