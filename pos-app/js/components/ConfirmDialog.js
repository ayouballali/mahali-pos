/**
 * Confirmation Dialog Component
 * Clean, mobile-friendly confirmation dialog
 *
 * @version 1.0.0
 */

import { html } from '../lib/preact.js';

/**
 * Confirmation Dialog Component
 * @param {Object} props
 * @param {string} props.message - The confirmation message
 * @param {string} props.confirmText - Text for confirm button (default: "متابعة")
 * @param {string} props.cancelText - Text for cancel button (default: "إلغاء")
 * @param {boolean} props.danger - If true, confirm button is styled as danger (red)
 * @param {Function} props.onConfirm - Called when user confirms
 * @param {Function} props.onCancel - Called when user cancels
 * @returns {import('preact').VNode}
 */
export function ConfirmDialog({
    message,
    confirmText = 'متابعة',
    cancelText = 'إلغاء',
    danger = false,
    onConfirm,
    onCancel
}) {
    return html`
        <div class="dialog-overlay" onClick=${onCancel}>
            <div class="dialog-container" onClick=${(e) => e.stopPropagation()}>
                <div class="dialog-content">
                    <p class="dialog-message">${message}</p>
                </div>
                <div class="dialog-actions">
                    <button class="dialog-btn dialog-btn-cancel" onClick=${onCancel}>
                        ${cancelText}
                    </button>
                    <button class="dialog-btn ${danger ? 'dialog-btn-danger' : 'dialog-btn-confirm'}" onClick=${onConfirm}>
                        ${confirmText}
                    </button>
                </div>
            </div>
        </div>
    `;
}
