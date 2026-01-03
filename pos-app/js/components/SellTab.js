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
import { createDetectionLoop, isScannerSupported } from '../lib/scanner.js';

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
    const detectionLoopRef = useRef(null);

    // Scanner sub-modals
    const [showScannerCart, setShowScannerCart] = useState(false);
    const [notFoundBarcode, setNotFoundBarcode] = useState(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddData, setQuickAddData] = useState({ name: '', price: '' });

    // Toast notification
    const [toast, setToast] = useState(null);

    // Scanner visual feedback
    const [scanFlash, setScanFlash] = useState(null); // 'success' | 'notfound' | null
    const [showHint, setShowHint] = useState(false);
    const hintTimerRef = useRef(null);

    // Tap-to-focus
    const [focusPoint, setFocusPoint] = useState(null); // { x, y } position for focus indicator

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

    // Reload products when tab becomes active (picks up changes from other tabs)
    useEffect(() => {
        if (isActive) {
            reloadProducts();
        }
    }, [isActive]);

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
    const showToast = (message, type = 'success', duration = 2000) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), duration);
    };

    // Reset hint timer - shows hint after 5 seconds of no scan
    const resetHintTimer = () => {
        setShowHint(false);
        if (hintTimerRef.current) {
            clearTimeout(hintTimerRef.current);
        }
        hintTimerRef.current = setTimeout(() => {
            setShowHint(true);
        }, 5000);
    };

    // Clear hint timer on unmount or scanner close
    const clearHintTimer = () => {
        if (hintTimerRef.current) {
            clearTimeout(hintTimerRef.current);
            hintTimerRef.current = null;
        }
        setShowHint(false);
    };

    // Play scanner beep sound
    const playBeep = (type = 'success') => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (type === 'success') {
                // Success: Short high-pitched beep (1800Hz)
                oscillator.frequency.value = 1800;
                oscillator.type = 'square';
                gainNode.gain.value = 0.3;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
            } else if (type === 'notfound') {
                // Not found: Lower pitch double beep (800Hz)
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.25;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.08);
                
                // Second beep
                setTimeout(() => {
                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioContext.destination);
                    osc2.frequency.value = 800;
                    osc2.type = 'sine';
                    gain2.gain.value = 0.25;
                    osc2.start();
                    osc2.stop(audioContext.currentTime + 0.08);
                }, 100);
            }
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
        clearHintTimer();
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
                video: {
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    // Request continuous autofocus for better barcode scanning
                    focusMode: { ideal: 'continuous' }
                }
            });

            // Apply 1.5x zoom if supported (helps with barcode scanning)
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
                // Zoom not supported, continue without it
            }
            streamRef.current = stream;
            video.srcObject = stream;
            await video.play();
            setScannerActive(true);
            setFlashOn(false); // Reset flash when camera changes

            // Start barcode detection using abstracted scanner service
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

    const stopScanner = () => {
        // Stop detection loop
        if (detectionLoopRef.current) {
            detectionLoopRef.current.stop();
            detectionLoopRef.current = null;
        }
        // Stop video stream
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

    // Tap-to-focus - triggers camera autofocus on tapped point
    const handleTapToFocus = async (e) => {
        if (!streamRef.current) return;

        const video = document.getElementById('scanner-video');
        if (!video) return;

        // Get tap position relative to video element
        const rect = video.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Show focus indicator at tap position
        setFocusPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        vibrate(30);

        // Hide focus indicator after animation
        setTimeout(() => setFocusPoint(null), 1000);

        // Try to focus camera at tapped point
        try {
            const track = streamRef.current.getVideoTracks()[0];
            if (!track) return;

            const capabilities = track.getCapabilities();

            // Check if point-of-interest focus is supported
            if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
                // Some devices support pointsOfInterest for tap-to-focus
                const constraints = {
                    advanced: [{
                        focusMode: 'manual'
                    }]
                };

                // If pointsOfInterest is supported, use it
                if ('pointsOfInterest' in capabilities) {
                    constraints.advanced[0].pointsOfInterest = [{ x, y }];
                }

                await track.applyConstraints(constraints);

                // After focusing, switch back to continuous focus after a delay
                setTimeout(async () => {
                    try {
                        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                            await track.applyConstraints({
                                advanced: [{ focusMode: 'continuous' }]
                            });
                        }
                    } catch (e) {
                        // Ignore - continuous may not be supported
                    }
                }, 2000);
            } else if (capabilities.focusMode && capabilities.focusMode.includes('single-shot')) {
                // Trigger single-shot autofocus (re-focus)
                await track.applyConstraints({
                    advanced: [{ focusMode: 'single-shot' }]
                });
            }
        } catch (err) {
            // Focus not supported on this device - visual feedback still shows
            console.log('Tap-to-focus not supported:', err.message);
        }
    };

    // Start barcode detection loop using abstracted scanner service
    const startDetectionLoop = (video) => {
        // Stop existing loop if any
        if (detectionLoopRef.current) {
            detectionLoopRef.current.stop();
        }

        // Start hint timer (shows after 5 seconds of no scan)
        resetHintTimer();

        // Create new detection loop
        detectionLoopRef.current = createDetectionLoop({
            video,
            onDetect: (code) => {
                // Skip if this barcode was just scanned (prevents multiple beeps)
                if (lastScannedRef.current === code) return;

                // Reset hint timer on successful detection
                resetHintTimer();

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
        });
    };

    // Handle scanned barcode - fetch fresh from DB to get newly added products
    const handleBarcodeScanned = async (barcode) => {
        // Use ref to prevent duplicate scans (ref is accessible in detection loop)
        if (lastScannedRef.current === barcode) return;
        lastScannedRef.current = barcode;
        // 2 second cooldown - prevents rapid duplicates but allows re-scanning different barcodes
        setTimeout(() => { lastScannedRef.current = null; }, 2000);

        // Fetch fresh from database to catch newly added products
        const freshProducts = await productDB.getAll();
        const product = freshProducts.find(p => p.barcode === barcode);

        if (product) {
            // Success feedback
            vibrate(100); // Short haptic
            setScanFlash('success');
            setTimeout(() => setScanFlash(null), 300);
            addToCart(product);
            showToast(`${product.name} - ${formatCurrency(product.salePrice)}`, 'success');
        } else {
            // Not found feedback
            vibrate([100, 50, 100]); // Double vibration pattern
            playBeep('notfound'); // Different sound tone
            setScanFlash('notfound');
            setTimeout(() => setScanFlash(null), 300);
            showToast('منتج غير موجود', 'notfound');
            setTimeout(() => setNotFoundBarcode(barcode), 500);
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
            // Calculate profit for this transaction
            const totalProfit = cart.reduce((sum, item) => {
                const costPrice = item.product.costPrice || item.product.salePrice;
                const profit = (item.product.salePrice - costPrice) * item.quantity;
                return sum + profit;
            }, 0);

            const transaction = {
                items: cart.map(item => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    quantity: item.quantity,
                    price: item.product.salePrice,
                    costPrice: item.product.costPrice || item.product.salePrice,
                    subtotal: item.product.salePrice * item.quantity
                })),
                total: subtotal,
                profit: totalProfit,
                itemCount: totalItems,
                status: 'completed',
                date: new Date().toISOString()
            };

            await transactionDB.add(transaction);

            for (const item of cart) {
                const product = item.product;
                const newStock = (product.stock || 0) - item.quantity;
                await productDB.update(product.id, { stock: newStock });
            }

            // Close scanner and cart modals
            setShowScannerCart(false);
            closeScanner();

            // Show success toast (stays visible for 4 seconds after scanner closes)
            showToast(`✓ تم البيع - ${formatCurrency(subtotal)}`, 'success', 4000);

            // Clear cart and reload products
            setCart([]);
            reloadProducts();

        } catch (error) {
            console.error('Error completing sale:', error);
            showToast('حدث خطأ أثناء إتمام العملية', 'error');
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
            <div class="products-list">
                ${filteredProducts.length === 0 ? html`
                    <div class="empty-state">
                        <div class="empty-icon"><${Icons.Package} /></div>
                        <p class="empty-text">لا توجد منتجات</p>
                    </div>
                ` : filteredProducts.map(product => {
                    const qtyInCart = getCartQuantity(product.id);
                    return html`
                        <div
                            class="product-card ${qtyInCart > 0 ? 'in-cart' : ''}"
                            key=${product.id}
                            onClick=${() => { vibrate(); addToCart(product); }}
                        >
                            <div class="product-image">
                                ${product.image ? html`<img src=${product.image} alt=${product.name} />` : html`<${Icons.Package} />`}
                            </div>
                            <div class="product-info">
                                <div class="product-name">${product.name}</div>
                                <div class="product-stock">${product.stock || 0} في المخزون</div>
                            </div>
                            <div class="product-price">
                                ${formatCurrency(product.salePrice)}
                            </div>
                            ${qtyInCart > 0 && html`<div class="product-badge">${qtyInCart}</div>`}
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
                    <div class="scanner-camera" onClick=${handleTapToFocus}>
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

                        <div class="scanner-frame ${scanFlash ? `flash-${scanFlash}` : ''}">
                            <div class="scanner-corner top-left"></div>
                            <div class="scanner-corner top-right"></div>
                            <div class="scanner-corner bottom-left"></div>
                            <div class="scanner-corner bottom-right"></div>
                        </div>

                        ${showHint && html`
                            <div class="scanner-hint">
                                قرّب الباركود من المنطقة المحددة
                            </div>
                        `}

                        <!-- Tap-to-focus indicator -->
                        ${focusPoint && html`
                            <div
                                class="focus-indicator"
                                style="left: ${focusPoint.x}px; top: ${focusPoint.y}px;"
                            ></div>
                        `}
                    </div>

                    <!-- Bottom Action Buttons -->
                    <div class="scanner-bottom-actions">
                        <button
                            class="scanner-bottom-btn cart-btn"
                            onClick=${() => setShowScannerCart(true)}
                        >
                            <${Icons.ShoppingCart} />
                            <span>السلة</span>
                            ${totalItems > 0 && html`<span class="btn-badge">${totalItems}</span>`}
                        </button>
                        <button
                            class="scanner-bottom-btn pay-btn"
                            onClick=${handleCompleteSale}
                            disabled=${cart.length === 0 || isProcessing}
                        >
                            <span class="pay-amount">${cart.length > 0 ? formatCurrency(subtotal) : 'ادفع'}</span>
                        </button>
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
                                <button class="item-editor-close" onClick=${() => setSelectedItem(null)}>×</button>
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
                        <button class="item-editor-close" onClick=${() => setSelectedItem(null)}>×</button>
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

            <!-- Global Toast (outside scanner) -->
            ${toast && !showScanner && html`
                <div class="sell-toast ${toast.type}">
                    <span class="toast-message">${toast.message}</span>
                </div>
            `}
        </div>
    `;
}
