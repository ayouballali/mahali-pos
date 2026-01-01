/**
 * Sell Tab Component - Continuous Scanning Mode
 * Full-screen scanner with cart, quick add, and checkout
 *
 * @version 3.0.0
 */

import { html, useState, useEffect, useRef } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { productDB, transactionDB } from '../lib/db.js';
import { formatCurrency, vibrate } from '../utils/helpers.js';
import { useProducts } from '../hooks/useProducts.js';
import { useProductSearch } from '../hooks/useProductSearch.js';

export function SellTab({ isActive }) {
    const { products, loading, reloadProducts } = useProducts();
    const { searchQuery, filteredProducts, handleSearch } = useProductSearch(products);
    const [cart, setCart] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Scanner states
    const [showScanner, setShowScanner] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerFrozen, setScannerFrozen] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');
    const lastScannedRef = useRef(null);
    const streamRef = useRef(null);

    // Scanner sub-modals
    const [showScannerCart, setShowScannerCart] = useState(false);
    const [notFoundBarcode, setNotFoundBarcode] = useState(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddData, setQuickAddData] = useState({ name: '', price: '' });

    // Toast notification
    const [toast, setToast] = useState(null);

    // Item editor (for both sell tab and scanner cart)
    const [selectedItem, setSelectedItem] = useState(null);

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Stop scanner when modal closes or tab becomes inactive
    useEffect(() => {
        if (!showScanner || !isActive) {
            stopScanner();
        }
    }, [showScanner, isActive]);

    // Handle back button to close modals instead of exiting app
    useEffect(() => {
        const handleBackButton = (e) => {
            // Check if any modal is open and close it instead of navigating back
            if (selectedItem) {
                e.preventDefault();
                setSelectedItem(null);
                history.pushState(null, '', location.href);
                return;
            }
            if (showQuickAdd) {
                e.preventDefault();
                setShowQuickAdd(false);
                history.pushState(null, '', location.href);
                return;
            }
            if (notFoundBarcode) {
                e.preventDefault();
                setNotFoundBarcode(null);
                history.pushState(null, '', location.href);
                return;
            }
            if (showScannerCart) {
                e.preventDefault();
                setShowScannerCart(false);
                history.pushState(null, '', location.href);
                return;
            }
            if (showScanner) {
                e.preventDefault();
                closeScanner();
                history.pushState(null, '', location.href);
                return;
            }
        };

        // Push initial state so we can intercept back button
        if (showScanner || showScannerCart || notFoundBarcode || showQuickAdd || selectedItem) {
            history.pushState(null, '', location.href);
            window.addEventListener('popstate', handleBackButton);
        }

        return () => {
            window.removeEventListener('popstate', handleBackButton);
        };
    }, [showScanner, showScannerCart, notFoundBarcode, showQuickAdd, selectedItem]);

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2000);
    };

    // Play scanner beep sound
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

    // Scanner functions
    const openScanner = () => {
        vibrate();
        setShowScanner(true);
        setTimeout(() => startScanner(), 200);
    };

    const closeScanner = () => {
        stopScanner();
        setShowScanner(false);
        setShowScannerCart(false);
        setNotFoundBarcode(null);
        setShowQuickAdd(false);
    };

    const startScanner = async (facing = facingMode) => {
        try {
            const video = document.getElementById('scanner-video');
            if (!video) return;

            if (!window.isSecureContext) {
                alert('الكاميرا تتطلب اتصال آمن (HTTPS)');
                return;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('الكاميرا غير مدعومة في هذا المتصفح');
                return;
            }

            // Stop existing stream first
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing }
            });
            streamRef.current = stream;
            video.srcObject = stream;
            await video.play();
            setScannerActive(true);
            setFlashOn(false); // Reset flash when camera changes

            if ('BarcodeDetector' in window) {
                detectBarcodes(video);
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

    const stopScanner = () => {
        const video = document.getElementById('scanner-video');
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

    // Toggle flash/torch
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

    // Switch between front and back camera
    const switchCamera = () => {
        vibrate();
        const newFacing = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacing);
        startScanner(newFacing);
    };

    // Barcode detection with confidence checking
    const detectBarcodes = async (video) => {
        const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] });
        let consecutiveReads = {};
        const REQUIRED_READS = 2; // Reduced from 3 for faster scanning

        const isValidBarcode = (code) => {
            if (!code || code.length < 4) return false;
            if (/^\d{13}$/.test(code)) return true;
            if (/^\d{8}$/.test(code)) return true;
            if (/^\d{12}$/.test(code)) return true;
            if (/^[A-Za-z0-9\-\.]+$/.test(code) && code.length >= 6) return true;
            return false;
        };

        const detect = async () => {
            if (!video.srcObject) return;

            try {
                const barcodes = await detector.detect(video);
                if (barcodes.length > 0) {
                    const code = barcodes[0].rawValue;

                    if (isValidBarcode(code)) {
                        consecutiveReads[code] = (consecutiveReads[code] || 0) + 1;
                        Object.keys(consecutiveReads).forEach(k => {
                            if (k !== code) consecutiveReads[k] = 0;
                        });

                        if (consecutiveReads[code] >= REQUIRED_READS) {
                            consecutiveReads[code] = 0;

                            // Skip if this barcode was just scanned (prevents multiple beeps)
                            if (lastScannedRef.current === code) {
                                // Don't return - just skip processing but keep detection running
                            } else {
                                // Freeze video and play beep
                                setScannerFrozen(true);
                                playBeep();
                                video.pause();

                                // Process barcode after short delay
                                setTimeout(() => {
                                    handleBarcodeScanned(code);
                                    // Unfreeze after 300ms
                                    setTimeout(() => {
                                        setScannerFrozen(false);
                                        if (video.srcObject) {
                                            video.play();
                                        }
                                    }, 300);
                                }, 100);
                            }
                        }
                    }
                }
            } catch (e) {}

            if (video.srcObject) {
                requestAnimationFrame(detect);
            }
        };

        detect();
    };

    // Handle scanned barcode - fetch fresh from DB to get newly added products
    const handleBarcodeScanned = async (barcode) => {
        // Use ref to prevent duplicate scans (ref is accessible in detection loop)
        if (lastScannedRef.current === barcode) return;
        lastScannedRef.current = barcode;
        // Short delay (1.5 seconds) - prevents rapid duplicates but allows re-scanning
        setTimeout(() => { lastScannedRef.current = null; }, 1500);

        // Fetch fresh from database to catch newly added products
        const freshProducts = await productDB.getAll();
        const product = freshProducts.find(p => p.barcode === barcode);

        if (product) {
            vibrate();
            addToCart(product);
            showToast(`${product.name} - ${formatCurrency(product.salePrice)}`);
        } else {
            vibrate([100, 50, 100]);
            setNotFoundBarcode(barcode);
        }
    };

    // Add product to cart
    const addToCart = (product) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.product.id === product.id);
            if (existingItem) {
                return currentCart.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...currentCart, { product, quantity: 1 }];
            }
        });
    };

    // Update quantity
    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            setCart(currentCart => currentCart.filter(item => item.product.id !== productId));
            setSelectedItem(null);
        } else {
            setCart(currentCart =>
                currentCart.map(item =>
                    item.product.id === productId
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            );
            if (selectedItem && selectedItem.product.id === productId) {
                setSelectedItem({ ...selectedItem, quantity: newQuantity });
            }
        }
    };

    // Quick add product
    const handleQuickAdd = async () => {
        if (!quickAddData.name || !quickAddData.price) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        const price = parseFloat(quickAddData.price);
        if (isNaN(price) || price <= 0) {
            alert('السعر غير صحيح');
            return;
        }

        try {
            const newProduct = {
                name: quickAddData.name,
                barcode: notFoundBarcode,
                salePrice: price,
                costPrice: price,
                stock: 100,
                trackStock: false,
                createdAt: new Date().toISOString()
            };

            const id = await productDB.add(newProduct);
            newProduct.id = id;

            // Add to cart
            addToCart(newProduct);
            showToast(`${newProduct.name} - ${formatCurrency(price)}`);

            // Reset and close quick add
            setQuickAddData({ name: '', price: '' });
            setShowQuickAdd(false);
            setNotFoundBarcode(null);
            reloadProducts();
        } catch (error) {
            console.error('Error adding product:', error);
            alert('حدث خطأ أثناء إضافة المنتج');
        }
    };

    // Complete sale
    const handleCompleteSale = async () => {
        if (cart.length === 0) return;

        setIsProcessing(true);
        vibrate();

        try {
            const transaction = {
                items: cart.map(item => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    quantity: item.quantity,
                    price: item.product.salePrice,
                    subtotal: item.product.salePrice * item.quantity
                })),
                total: subtotal,
                status: 'completed',
                date: new Date().toISOString()
            };

            await transactionDB.add(transaction);

            for (const item of cart) {
                const product = item.product;
                const newStock = (product.stock || 0) - item.quantity;
                await productDB.update(product.id, { stock: newStock });
            }

            alert(`✓ تم البيع\n${formatCurrency(subtotal)}`);
            setCart([]);
            setShowScannerCart(false);
            closeScanner();
            reloadProducts();

        } catch (error) {
            console.error('Error completing sale:', error);
            alert('حدث خطأ أثناء إتمام العملية');
        } finally {
            setIsProcessing(false);
        }
    };

    // Get quantity in cart for a product
    const getCartQuantity = (productId) => {
        const item = cart.find(item => item.product.id === productId);
        return item ? item.quantity : 0;
    };

    return html`
        <div class="tab-content ${isActive ? 'active' : ''}" id="sell-tab">
            <!-- Header with Search -->
            <div class="sell-header">
                <input
                    type="text"
                    class="sell-search"
                    placeholder="ابحث عن منتج..."
                    value=${searchQuery}
                    onInput=${(e) => handleSearch(e.target.value)}
                />
                <button class="btn-icon-only scan-btn" onClick=${openScanner}>
                    <${Icons.Barcode} />
                </button>
            </div>

            <!-- Products List -->
            <div class="sell-products-list">
                ${filteredProducts.length === 0 ? html`
                    <div class="empty-state">
                        <div class="empty-icon"><${Icons.Package} /></div>
                        <p class="empty-text">لا توجد منتجات</p>
                    </div>
                ` : filteredProducts.map(product => {
                    const qtyInCart = getCartQuantity(product.id);
                    return html`
                        <div
                            class="sell-product-item ${qtyInCart > 0 ? 'in-cart' : ''}"
                            key=${product.id}
                            onClick=${() => { vibrate(); addToCart(product); }}
                        >
                            <div class="sell-product-image">
                                ${product.image ? html`<img src=${product.image} alt=${product.name} />` : html`<${Icons.Package} />`}
                            </div>
                            <div class="sell-product-info">
                                <div class="sell-product-name">${product.name}</div>
                                <div class="sell-product-price">${formatCurrency(product.salePrice)}</div>
                            </div>
                            ${qtyInCart > 0 && html`<div class="sell-product-badge">${qtyInCart}</div>`}
                        </div>
                    `;
                })}
            </div>

            <!-- Cart Bar -->
            ${cart.length > 0 && html`
                <div class="sell-cart-bar">
                    <div class="sell-cart-info">
                        <span class="sell-cart-count">${totalItems} منتج</span>
                        <span class="sell-cart-total">${formatCurrency(subtotal)}</span>
                    </div>
                    <div class="sell-cart-actions">
                        <button
                            class="sell-cart-view"
                            onClick=${() => setShowScannerCart(true)}
                        >
                            <${Icons.ShoppingCart} />
                        </button>
                        <button
                            class="sell-cart-checkout"
                            onClick=${handleCompleteSale}
                            disabled=${isProcessing}
                        >
                            ${isProcessing ? 'جاري...' : 'ادفع'}
                        </button>
                    </div>
                </div>
            `}

            <!-- Full Screen Scanner -->
            ${showScanner && html`
                <div class="scanner-fullscreen">
                    <!-- Scanner Header -->
                    <div class="scanner-header">
                        <button class="scanner-cart-btn" onClick=${() => setShowScannerCart(true)}>
                            <${Icons.ShoppingCart} />
                            ${totalItems > 0 && html`<span class="scanner-cart-badge ${toast ? 'bounce' : ''}">${totalItems}</span>`}
                        </button>
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
                        <video id="scanner-video" class="scanner-video" autoplay playsinline muted></video>

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
                                <button class="scanner-activate-btn" onClick=${startScanner}>إعادة المحاولة</button>
                            </div>
                        `}

                        ${scannerActive && !scannerFrozen && html`<div class="scan-line"></div>`}

                        ${scannerFrozen && html`<div class="scanner-freeze-overlay"></div>`}

                        <div class="scanner-frame">
                            <div class="scanner-corner top-left"></div>
                            <div class="scanner-corner top-right"></div>
                            <div class="scanner-corner bottom-left"></div>
                            <div class="scanner-corner bottom-right"></div>
                        </div>
                    </div>

                    <!-- Toast Notification -->
                    ${toast && html`
                        <div class="scanner-toast ${toast.type}">
                            <span class="toast-icon">✓</span>
                            <span class="toast-message">${toast.message}</span>
                        </div>
                    `}

                    <!-- Product Not Found Modal -->
                    ${notFoundBarcode && !showQuickAdd && html`
                        <div class="scanner-overlay">
                            <div class="not-found-modal">
                                <h3>منتج غير موجود</h3>
                                <p class="not-found-barcode">${notFoundBarcode}</p>
                                <div class="not-found-actions">
                                    <button class="btn-skip" onClick=${() => setNotFoundBarcode(null)}>تخطي</button>
                                    <button class="btn-quick-add" onClick=${() => setShowQuickAdd(true)}>إضافة سريع</button>
                                </div>
                            </div>
                        </div>
                    `}

                    <!-- Quick Add Form -->
                    ${showQuickAdd && html`
                        <div class="scanner-overlay">
                            <div class="quick-add-modal">
                                <h3>إضافة منتج جديد</h3>
                                <div class="quick-add-form">
                                    <div class="form-group">
                                        <label>الباركود</label>
                                        <input type="text" value=${notFoundBarcode} disabled class="form-input" />
                                    </div>
                                    <div class="form-group">
                                        <label>اسم المنتج *</label>
                                        <input
                                            type="text"
                                            class="form-input"
                                            value=${quickAddData.name}
                                            onInput=${(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
                                            placeholder="أدخل اسم المنتج"
                                        />
                                    </div>
                                    <div class="form-group">
                                        <label>سعر البيع *</label>
                                        <input
                                            type="number"
                                            class="form-input"
                                            value=${quickAddData.price}
                                            onInput=${(e) => setQuickAddData({ ...quickAddData, price: e.target.value })}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                    <div class="quick-add-actions">
                                        <button class="btn-cancel" onClick=${() => { setShowQuickAdd(false); setNotFoundBarcode(null); }}>إلغاء</button>
                                        <button class="btn-save" onClick=${handleQuickAdd}>حفظ ومتابعة</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `}

                    <!-- Scanner Cart Modal -->
                    ${showScannerCart && html`
                        <div class="scanner-overlay">
                            <div class="scanner-cart-modal">
                                <div class="scanner-cart-header">
                                    <h3>السلة</h3>
                                    <button class="btn-icon-only" onClick=${() => setShowScannerCart(false)}>×</button>
                                </div>

                                <div class="scanner-cart-items">
                                    ${cart.length === 0 ? html`
                                        <p class="cart-empty">السلة فارغة</p>
                                    ` : cart.map(item => html`
                                        <div class="scanner-cart-item" key=${item.product.id} onClick=${() => setSelectedItem(item)}>
                                            <div class="cart-item-info">
                                                <span class="cart-item-name">${item.product.name}</span>
                                                <span class="cart-item-qty">×${item.quantity}</span>
                                            </div>
                                            <span class="cart-item-price">${formatCurrency(item.product.salePrice * item.quantity)}</span>
                                        </div>
                                    `)}
                                </div>

                                <div class="scanner-cart-footer">
                                    <div class="cart-total-row">
                                        <span>المجموع</span>
                                        <span class="cart-total-value">${formatCurrency(subtotal)}</span>
                                    </div>
                                    <button class="btn-continue-scan" onClick=${() => setShowScannerCart(false)}>
                                        متابعة المسح
                                    </button>
                                    <button
                                        class="btn-pay"
                                        onClick=${handleCompleteSale}
                                        disabled=${cart.length === 0 || isProcessing}
                                    >
                                        ${isProcessing ? 'جاري...' : `ادفع ${formatCurrency(subtotal)}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `}

                    <!-- Item Editor (in scanner) -->
                    ${selectedItem && showScannerCart && html`
                        <div class="scanner-overlay" onClick=${() => setSelectedItem(null)}>
                            <div class="item-editor-modal" onClick=${(e) => e.stopPropagation()}>
                                <div class="item-editor-header">
                                    <span class="item-editor-name">${selectedItem.product.name}</span>
                                    <span class="item-editor-price">${formatCurrency(selectedItem.product.salePrice)}</span>
                                </div>
                                <div class="item-editor-qty">
                                    <button class="qty-btn" onClick=${() => updateQuantity(selectedItem.product.id, selectedItem.quantity - 1)}>−</button>
                                    <span class="qty-value">${selectedItem.quantity}</span>
                                    <button class="qty-btn" onClick=${() => updateQuantity(selectedItem.product.id, selectedItem.quantity + 1)}>+</button>
                                </div>
                                <div class="item-editor-subtotal">
                                    ${formatCurrency(selectedItem.product.salePrice * selectedItem.quantity)}
                                </div>
                                <div class="item-editor-actions">
                                    <button class="btn-remove" onClick=${() => updateQuantity(selectedItem.product.id, 0)}>حذف</button>
                                    <button class="btn-done" onClick=${() => setSelectedItem(null)}>تم</button>
                                </div>
                            </div>
                        </div>
                    `}
                </div>
            `}

            <!-- Item Editor (outside scanner - for sell tab cart) -->
            ${selectedItem && !showScanner && html`
                <div class="modal-overlay" onClick=${() => setSelectedItem(null)}>
                    <div class="item-editor-modal" onClick=${(e) => e.stopPropagation()}>
                        <div class="item-editor-header">
                            <span class="item-editor-name">${selectedItem.product.name}</span>
                            <span class="item-editor-price">${formatCurrency(selectedItem.product.salePrice)}</span>
                        </div>
                        <div class="item-editor-qty">
                            <button class="qty-btn" onClick=${() => updateQuantity(selectedItem.product.id, selectedItem.quantity - 1)}>−</button>
                            <span class="qty-value">${selectedItem.quantity}</span>
                            <button class="qty-btn" onClick=${() => updateQuantity(selectedItem.product.id, selectedItem.quantity + 1)}>+</button>
                        </div>
                        <div class="item-editor-subtotal">
                            ${formatCurrency(selectedItem.product.salePrice * selectedItem.quantity)}
                        </div>
                        <div class="item-editor-actions">
                            <button class="btn-remove" onClick=${() => updateQuantity(selectedItem.product.id, 0)}>حذف</button>
                            <button class="btn-done" onClick=${() => setSelectedItem(null)}>تم</button>
                        </div>
                    </div>
                </div>
            `}

            <!-- Cart Modal (outside scanner) -->
            ${showScannerCart && !showScanner && html`
                <div class="modal-overlay" onClick=${() => setShowScannerCart(false)}>
                    <div class="scanner-cart-modal" onClick=${(e) => e.stopPropagation()}>
                        <div class="scanner-cart-header">
                            <h3>السلة</h3>
                            <button class="btn-icon-only" onClick=${() => setShowScannerCart(false)}>×</button>
                        </div>
                        <div class="scanner-cart-items">
                            ${cart.length === 0 ? html`
                                <p class="cart-empty">السلة فارغة</p>
                            ` : cart.map(item => html`
                                <div class="scanner-cart-item" key=${item.product.id} onClick=${() => setSelectedItem(item)}>
                                    <div class="cart-item-info">
                                        <span class="cart-item-name">${item.product.name}</span>
                                        <span class="cart-item-qty">×${item.quantity}</span>
                                    </div>
                                    <span class="cart-item-price">${formatCurrency(item.product.salePrice * item.quantity)}</span>
                                </div>
                            `)}
                        </div>
                        <div class="scanner-cart-footer">
                            <div class="cart-total-row">
                                <span>المجموع</span>
                                <span class="cart-total-value">${formatCurrency(subtotal)}</span>
                            </div>
                            <button
                                class="btn-pay"
                                onClick=${handleCompleteSale}
                                disabled=${cart.length === 0 || isProcessing}
                            >
                                ${isProcessing ? 'جاري...' : `ادفع ${formatCurrency(subtotal)}`}
                            </button>
                        </div>
                    </div>
                </div>
            `}
        </div>
    `;
}
