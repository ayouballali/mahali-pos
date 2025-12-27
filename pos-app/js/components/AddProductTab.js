/**
 * Add Product Tab Component
 * Clean mobile-first form for adding new products
 *
 * @version 1.0.0
 */

import { html, useState } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { formatCurrency, calculateProfitMargin, vibrate } from '../utils/helpers.js';

/**
 * Add Product Tab Component
 * @param {Object} props
 * @param {Function} props.onBack - Callback to return to products list
 * @param {Function} props.onSave - Callback when product is saved
 * @returns {import('preact').VNode}
 */
export function AddProductTab({ onBack, onSave }) {
    console.log('AddProductTab rendered!');

    // Form state
    const [barcode, setBarcode] = useState('');
    const [productName, setProductName] = useState('');
    const [saleType, setSaleType] = useState('الوحدة'); // 'الوحدة' or 'الوزن'
    const [costPrice, setCostPrice] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [productImage, setProductImage] = useState(null); // Base64 image data
    const [errors, setErrors] = useState({});

    // Calculate profit
    const cost = parseFloat(costPrice) || 0;
    const sale = parseFloat(salePrice) || 0;
    const profit = sale - cost;
    const profitMargin = calculateProfitMargin(cost, sale);

    /**
     * Validate form
     */
    const validate = () => {
        const newErrors = {};

        if (!productName.trim()) {
            newErrors.productName = 'اسم المنتج مطلوب';
        }

        if (!costPrice || cost <= 0) {
            newErrors.costPrice = 'سعر الشراء مطلوب';
        }

        if (!salePrice || sale <= 0) {
            newErrors.salePrice = 'سعر البيع مطلوب';
        }

        if (sale < cost) {
            newErrors.salePrice = 'سعر البيع أقل من سعر الشراء';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handle save
     */
    const handleSave = () => {
        if (!validate()) {
            vibrate(50);
            return;
        }

        const product = {
            id: `prod_${Date.now()}`,
            barcode: barcode.trim() || null,
            name: productName.trim(),
            saleType,
            costPrice: cost,
            salePrice: sale,
            image: productImage, // Store base64 image
            stock: 0,
            createdAt: new Date().toISOString(),
        };

        vibrate();
        onSave(product);
    };

    /**
     * Handle image upload with compression
     */
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('الرجاء اختيار صورة');
            return;
        }

        // Read and compress image
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas for compression
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calculate new dimensions (max 1200px on longest side)
                let width = img.width;
                let height = img.height;
                const maxSize = 1200;

                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress (0.8 quality for good balance)
                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

                setProductImage(compressedBase64);
                vibrate();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    /**
     * Remove image
     */
    const handleRemoveImage = () => {
        setProductImage(null);
        vibrate();
    };

    /**
     * Handle barcode scan (placeholder for future implementation)
     */
    const handleScan = () => {
        vibrate();
        // TODO: Implement barcode scanning
        alert('مسح الباركود سيتم إضافته قريباً');
    };

    /**
     * Toggle sale type
     */
    const toggleSaleType = (type) => {
        setSaleType(type);
        vibrate();
    };

    return html`
        <div class="tab-content active" id="add-product-tab">
            <!-- Header -->
            <div class="tab-header">
                <button class="btn-icon-only" onClick=${onBack}>
                    <${Icons.ArrowRight} />
                </button>
                <h2 class="tab-title">إضافة منتج</h2>
                <div style="width: 40px;"></div>
            </div>

            <!-- Form -->
            <div class="add-product-form">
                <!-- 1. Barcode (Optional) -->
                <div class="form-group">
                    <label class="form-label">
                        الباركود
                        <span class="form-label-optional">(اختياري)</span>
                    </label>
                    <div class="input-with-button">
                        <input
                            type="text"
                            class="form-input"
                            placeholder="6111000000001"
                            value=${barcode}
                            onInput=${(e) => setBarcode(e.target.value)}
                        />
                        <button class="input-button" onClick=${handleScan}>
                            <${Icons.Camera} />
                        </button>
                    </div>
                </div>

                <!-- 1.5. Product Image (Optional) -->
                <div class="form-group">
                    <label class="form-label">
                        صورة المنتج
                        <span class="form-label-optional">(اختياري)</span>
                    </label>

                    ${productImage ? html`
                        <!-- Image Preview -->
                        <div class="image-preview">
                            <img src=${productImage} alt="Product preview" class="preview-image" />
                            <button class="remove-image-btn" onClick=${handleRemoveImage} type="button">
                                ×
                            </button>
                        </div>
                    ` : html`
                        <!-- Image Upload Options -->
                        <div class="image-upload-grid">
                            <label class="image-upload-option">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange=${handleImageUpload}
                                    style="display: none;"
                                />
                                <${Icons.Camera} />
                                <span>التقط صورة</span>
                            </label>
                            <label class="image-upload-option">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange=${handleImageUpload}
                                    style="display: none;"
                                />
                                <${Icons.Image} />
                                <span>من المعرض</span>
                            </label>
                        </div>
                    `}
                </div>

                <!-- 2. Product Name (Required) -->
                <div class="form-group ${errors.productName ? 'has-error' : ''}">
                    <label class="form-label">
                        اسم المنتج
                        <span class="form-label-required">*</span>
                    </label>
                    <input
                        type="text"
                        class="form-input"
                        placeholder="مثال: سكر"
                        value=${productName}
                        onInput=${(e) => setProductName(e.target.value)}
                    />
                    ${errors.productName && html`
                        <span class="form-error">${errors.productName}</span>
                    `}
                </div>

                <!-- 3. Sale Type Toggle -->
                <div class="form-group">
                    <label class="form-label">يباع بـ</label>
                    <div class="toggle-group">
                        <button
                            class="${saleType === 'الوحدة' ? 'toggle-btn active' : 'toggle-btn'}"
                            onClick=${() => toggleSaleType('الوحدة')}
                        >
                            <${Icons.Package} />
                            <span>الوحدة</span>
                        </button>
                        <button
                            class="${saleType === 'الوزن' ? 'toggle-btn active' : 'toggle-btn'}"
                            onClick=${() => toggleSaleType('الوزن')}
                        >
                            <${Icons.Scale} />
                            <span>الوزن</span>
                        </button>
                    </div>
                </div>

                <!-- 4. Cost Price (Required) -->
                <div class="form-group ${errors.costPrice ? 'has-error' : ''}">
                    <label class="form-label">
                        سعر الشراء
                        <span class="form-label-required">*</span>
                    </label>
                    <div class="input-with-unit">
                        <input
                            type="number"
                            class="form-input"
                            placeholder="0.00"
                            value=${costPrice}
                            onInput=${(e) => setCostPrice(e.target.value)}
                            step="0.01"
                            min="0"
                        />
                        <span class="input-unit">DH</span>
                    </div>
                    ${errors.costPrice && html`
                        <span class="form-error">${errors.costPrice}</span>
                    `}
                </div>

                <!-- 5. Sale Price (Required) -->
                <div class="form-group ${errors.salePrice ? 'has-error' : ''}">
                    <label class="form-label">
                        سعر البيع
                        <span class="form-label-required">*</span>
                    </label>
                    <div class="input-with-unit">
                        <input
                            type="number"
                            class="form-input"
                            placeholder="0.00"
                            value=${salePrice}
                            onInput=${(e) => setSalePrice(e.target.value)}
                            step="0.01"
                            min="0"
                        />
                        <span class="input-unit">DH</span>
                    </div>
                    ${errors.salePrice && html`
                        <span class="form-error">${errors.salePrice}</span>
                    `}
                </div>

                <!-- Live Profit Preview -->
                ${cost > 0 && sale > 0 && html`
                    <div class="profit-preview ${profit < 0 ? 'negative' : ''}">
                        <div class="profit-preview-icon">
                            ${profit >= 0 ? html`<${Icons.TrendingUp} />` : html`<${Icons.TrendingDown} />`}
                        </div>
                        <div class="profit-preview-content">
                            <span class="profit-preview-label">الربح المتوقع</span>
                            <span class="profit-preview-value">
                                ${formatCurrency(profit, { decimals: 2 })}
                                <span class="profit-preview-percent">(${profitMargin}%)</span>
                            </span>
                        </div>
                    </div>
                `}
            </div>

            <!-- Save Button (Fixed at Bottom) -->
            <div class="form-actions">
                <button class="btn-primary" onClick=${handleSave}>
                    <${Icons.Plus} />
                    <span>حفظ المنتج</span>
                </button>
            </div>
        </div>
    `;
}
