/**
 * Edit Product Tab Component
 * Form for editing existing products
 *
 * @version 1.0.0
 */

import { html, useState, useEffect, useRef } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { formatCurrency, calculateProfitMargin, vibrate } from '../utils/helpers.js';
import { createDetectionLoop, isScannerSupported } from '../lib/scanner.js';
import { ConfirmDialog } from './ConfirmDialog.js';

/**
 * Edit Product Tab Component
 * @param {Object} props
 * @param {Object} props.product - The product to edit
 * @param {Function} props.onBack - Callback to return to products list
 * @param {Function} props.onSave - Callback when product is saved
 * @param {Function} props.onDelete - Callback when product is deleted
 * @param {Function} props.onUnsavedChangesUpdate - Callback to notify parent of unsaved changes
 * @returns {import('preact').VNode}
 */
export function EditProductTab({ product, onBack, onSave, onDelete, onUnsavedChangesUpdate }) {

    // Form state - initialize with product data
    const [barcode, setBarcode] = useState(product.barcode || '');
    const [productName, setProductName] = useState(product.name || '');
    const [saleType, setSaleType] = useState(product.saleType || 'الوحدة');
    const [costPrice, setCostPrice] = useState(product.costPrice?.toString() || '');
    const [salePrice, setSalePrice] = useState(product.salePrice?.toString() || '');
    const [productImage, setProductImage] = useState(product.image || null);
    const [stock, setStock] = useState(product.stock?.toString() || '0');
    const [errors, setErrors] = useState({});

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Scanner state
    const [showScanner, setShowScanner] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');
    const streamRef = useRef(null);
    const detectionLoopRef = useRef(null);

    // Track original values to detect changes
    const originalValues = useRef({
        barcode: product.barcode || '',
        name: product.name || '',
        saleType: product.saleType || 'الوحدة',
        costPrice: product.costPrice?.toString() || '',
        salePrice: product.salePrice?.toString() || '',
        image: product.image || null,
        stock: product.stock?.toString() || '0'
    });

    // Calculate profit
    const cost = parseFloat(costPrice) || 0;
    const sale = parseFloat(salePrice) || 0;
    const profit = sale - cost;
    const profitMargin = calculateProfitMargin(cost, sale);

    // Check for unsaved changes
    const hasChanges = () => {
        const orig = originalValues.current;
        return (
            barcode !== orig.barcode ||
            productName !== orig.name ||
            saleType !== orig.saleType ||
            costPrice !== orig.costPrice ||
            salePrice !== orig.salePrice ||
            productImage !== orig.image ||
            stock !== orig.stock
        );
    };

    // Notify parent about unsaved changes
    useEffect(() => {
        if (onUnsavedChangesUpdate) {
            onUnsavedChangesUpdate(hasChanges());
        }
    }, [barcode, productName, saleType, costPrice, salePrice, productImage, stock]);

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

        const updatedProduct = {
            ...product,
            barcode: barcode.trim() || null,
            name: productName.trim(),
            saleType,
            costPrice: cost,
            salePrice: sale,
            image: productImage,
            stock: parseInt(stock) || 0,
            updatedAt: new Date().toISOString(),
        };

        vibrate();
        onSave(updatedProduct);
    };

    /**
     * Handle delete
     */
    const handleDelete = () => {
        vibrate();
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        vibrate();
        setShowDeleteConfirm(false);
        onDelete(product.id);
    };

    const cancelDelete = () => {
        vibrate();
        setShowDeleteConfirm(false);
    };

    /**
     * Handle image upload with compression
     */
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('الرجاء اختيار صورة');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

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
     * Open barcode scanner
     */
    const openScanner = () => {
        vibrate();
        setShowScanner(true);
        setTimeout(() => startScanner(), 200);
    };

    /**
     * Close scanner and cleanup
     */
    const closeScanner = () => {
        stopScanner();
        setShowScanner(false);
    };

    /**
     * Start camera and scanner
     */
    const startScanner = async (facing = facingMode) => {
        try {
            const video = document.getElementById('edit-barcode-scanner-video');
            if (!video) return;

            if (!window.isSecureContext) {
                alert('الكاميرا تتطلب اتصال آمن (HTTPS)');
                return;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('الكاميرا غير مدعومة في هذا المتصفح');
                return;
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            try {
                const track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities();
                if (capabilities.zoom) {
                    const minZoom = capabilities.zoom.min;
                    const maxZoom = capabilities.zoom.max;
                    const targetZoom = Math.min(1.5, maxZoom);
                    if (targetZoom > minZoom) {
                        await track.applyConstraints({ advanced: [{ zoom: targetZoom }] });
                    }
                }
            } catch (e) {
                // Zoom not supported
            }

            streamRef.current = stream;
            video.srcObject = stream;
            await video.play();
            setScannerActive(true);
            setFlashOn(false);

            if (isScannerSupported()) {
                startDetectionLoop(video);
            }
        } catch (err) {
            setScannerActive(false);
            if (err.name === 'NotAllowedError') {
                alert('يرجى السماح بالوصول للكاميرا');
            } else if (err.name === 'NotFoundError') {
                alert('لا توجد كاميرا متاحة');
            }
        }
    };

    /**
     * Stop scanner
     */
    const stopScanner = () => {
        if (detectionLoopRef.current) {
            detectionLoopRef.current.stop();
            detectionLoopRef.current = null;
        }
        const video = document.getElementById('edit-barcode-scanner-video');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setScannerActive(false);
        setFlashOn(false);
    };

    /**
     * Toggle flash
     */
    const toggleFlash = async () => {
        try {
            if (!streamRef.current) return;
            const track = streamRef.current.getVideoTracks()[0];
            if (!track) return;

            const capabilities = track.getCapabilities();
            if (!capabilities.torch) {
                alert('الفلاش غير مدعوم في هذا الجهاز');
                return;
            }

            const newFlashState = !flashOn;
            await track.applyConstraints({
                advanced: [{ torch: newFlashState }]
            });
            setFlashOn(newFlashState);
            vibrate();
        } catch (err) {
            console.error('Flash toggle error:', err);
        }
    };

    /**
     * Switch camera
     */
    const switchCamera = () => {
        vibrate();
        const newFacing = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacing);
        startScanner(newFacing);
    };

    /**
     * Start barcode detection loop
     */
    const startDetectionLoop = (video) => {
        if (detectionLoopRef.current) {
            detectionLoopRef.current.stop();
        }

        detectionLoopRef.current = createDetectionLoop({
            video,
            onDetect: (code) => {
                vibrate(100);
                playBeep();
                setBarcode(code);
                closeScanner();
            }
        });
    };

    /**
     * Play success beep
     */
    const playBeep = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 1800;
            oscillator.type = 'square';
            gainNode.gain.value = 0.3;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported
        }
    };

    /**
     * Toggle sale type
     */
    const toggleSaleType = (type) => {
        setSaleType(type);
        vibrate();
    };

    /**
     * Handle back button with unsaved changes check
     */
    const handleBackClick = () => {
        onBack(hasChanges());
    };

    return html`
        <div class="tab-content active" id="edit-product-tab">
            <!-- Header -->
            <div class="tab-header">
                <button class="btn-icon-only" onClick=${handleBackClick}>
                    <${Icons.ArrowRight} />
                </button>
                <h2 class="tab-title">تعديل المنتج</h2>
                <button class="btn-icon-only delete-btn" onClick=${handleDelete}>
                    <${Icons.Trash} />
                </button>
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
                        <button class="input-button" onClick=${openScanner}>
                            <${Icons.Barcode} />
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

                <!-- 6. Stock -->
                <div class="form-group">
                    <label class="form-label">المخزون</label>
                    <div class="input-with-unit">
                        <input
                            type="number"
                            class="form-input"
                            placeholder="0"
                            value=${stock}
                            onInput=${(e) => setStock(e.target.value)}
                            min="0"
                        />
                        <span class="input-unit">وحدة</span>
                    </div>
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
                    حفظ التغييرات
                </button>
            </div>

            <!-- Delete Confirmation Dialog -->
            ${showDeleteConfirm && html`
                <${ConfirmDialog}
                    message="هل أنت متأكد من حذف هذا المنتج؟"
                    confirmText="حذف"
                    cancelText="إلغاء"
                    onConfirm=${confirmDelete}
                    onCancel=${cancelDelete}
                    danger=${true}
                />
            `}

            <!-- Barcode Scanner Modal -->
            ${showScanner && html`
                <div class="scanner-fullscreen">
                    <!-- Scanner Header -->
                    <div class="scanner-header">
                        <div></div>
                        <div class="scanner-header-controls">
                            <button class="scanner-control-btn ${flashOn ? 'active' : ''}" onClick=${toggleFlash}>
                                <${Icons.Flash} />
                            </button>
                            <button class="scanner-control-btn" onClick=${switchCamera}>
                                <${Icons.CameraSwitch} />
                            </button>
                        </div>
                        <button class="scanner-close-btn" onClick=${closeScanner}>
                            <${Icons.Close} />
                        </button>
                    </div>

                    <!-- Camera View -->
                    <div class="scanner-camera">
                        <video id="edit-barcode-scanner-video" class="scanner-video" autoplay playsinline muted></video>

                        <!-- Dark overlay around scan area -->
                        <div class="scanner-dark-overlay">
                            <div class="scanner-dark-overlay-top"></div>
                            <div class="scanner-dark-overlay-bottom"></div>
                            <div class="scanner-dark-overlay-left"></div>
                            <div class="scanner-dark-overlay-right"></div>
                        </div>

                        ${!scannerActive && html`
                            <div class="scanner-placeholder">
                                <div class="scanner-placeholder-icon"><${Icons.Barcode} /></div>
                                <p>جاري تفعيل الكاميرا...</p>
                                <button class="scanner-activate-btn" onClick=${() => startScanner()}>إعادة المحاولة</button>
                            </div>
                        `}

                        ${scannerActive && html`<div class="scan-line"></div>`}

                        <div class="scanner-frame">
                            <div class="scanner-corner top-left"></div>
                            <div class="scanner-corner top-right"></div>
                            <div class="scanner-corner bottom-left"></div>
                            <div class="scanner-corner bottom-right"></div>
                        </div>
                    </div>

                    <!-- Scanner Instructions -->
                    <div class="scanner-instructions">
                        <p>وجّه الكاميرا نحو الباركود</p>
                    </div>
                </div>
            `}
        </div>
    `;
}
