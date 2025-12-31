/**
 * Sell Tab Component - Loyverse Style
 * Product list with cart system and scanner modal
 *
 * @version 2.1.0
 */

import { html, useState, useEffect } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { productDB, transactionDB } from '../lib/db.js';
import { formatCurrency, vibrate } from '../utils/helpers.js';
import { useProducts } from '../hooks/useProducts.js';
import { useProductSearch } from '../hooks/useProductSearch.js';

/**
 * Sell Tab Component
 * @param {Object} props
 * @param {boolean} props.isActive - Whether this tab is active
 * @returns {import('preact').VNode}
 */
export function SellTab({ isActive }) {
    const { products, loading, reloadProducts } = useProducts();
    const { searchQuery, filteredProducts, handleSearch } = useProductSearch(products);
    const [cart, setCart] = useState([]); // Array of { product, quantity }
    const [selectedItem, setSelectedItem] = useState(null); // For quantity editor
    const [isProcessing, setIsProcessing] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [lastScanned, setLastScanned] = useState(null);

    // Stop scanner when modal closes or tab becomes inactive
    useEffect(() => {
        if (!showScanner || !isActive) {
            stopScanner();
        }
    }, [showScanner, isActive]);

    // Scanner functions
    const openScanner = () => {
        vibrate();
        setShowScanner(true);
        // Start scanner after modal renders
        setTimeout(() => startScanner(), 200);
    };

    const closeScanner = () => {
        stopScanner();
        setShowScanner(false);
    };

    const startScanner = async () => {
        try {
            const video = document.getElementById('scanner-video');
            if (!video) {
                console.log('Video element not found');
                return;
            }

            // Check if running on secure context (HTTPS or localhost)
            if (!window.isSecureContext) {
                console.log('Not a secure context - camera requires HTTPS');
                alert('الكاميرا تتطلب اتصال آمن (HTTPS)\nCamera requires HTTPS connection');
                return;
            }

            // Check if camera is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.log('Camera API not supported');
                alert('الكاميرا غير مدعومة في هذا المتصفح');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            video.srcObject = stream;
            await video.play();
            setScannerActive(true);
            console.log('Scanner started successfully');

            // Start barcode detection if available
            if ('BarcodeDetector' in window) {
                detectBarcodes(video);
            }
        } catch (err) {
            console.log('Camera error:', err.name, err.message);
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
        setScannerActive(false);
    };

    // Barcode detection loop
    const detectBarcodes = async (video) => {
        const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] });

        const detect = async () => {
            if (!video.srcObject) return;

            try {
                const barcodes = await detector.detect(video);
                if (barcodes.length > 0) {
                    const code = barcodes[0].rawValue;
                    handleBarcodeScanned(code);
                }
            } catch (e) {
                // Detection failed, continue
            }

            if (video.srcObject) {
                requestAnimationFrame(detect);
            }
        };

        detect();
    };

    // Handle scanned barcode
    const handleBarcodeScanned = (barcode) => {
        // Prevent duplicate scans within 2 seconds
        if (lastScanned === barcode) return;
        setLastScanned(barcode);
        setTimeout(() => setLastScanned(null), 2000);

        // Find product by barcode
        const product = products.find(p => p.barcode === barcode);

        if (product) {
            vibrate();
            addToCart(product);
        } else {
            vibrate([100, 50, 100]);
            alert(`منتج غير موجود\nBarcode: ${barcode}`);
        }
    };

    // Add product to cart
    const addToCart = (product) => {
        vibrate();
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

    // Open quantity editor for item
    const openItemEditor = (cartItem) => {
        vibrate();
        setSelectedItem(cartItem);
    };

    // Update quantity in editor
    const updateQuantity = (newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart();
            return;
        }

        vibrate();
        setCart(currentCart =>
            currentCart.map(item =>
                item.product.id === selectedItem.product.id
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
        setSelectedItem({ ...selectedItem, quantity: newQuantity });
    };

    // Remove item from cart
    const removeFromCart = () => {
        vibrate();
        setCart(currentCart =>
            currentCart.filter(item => item.product.id !== selectedItem.product.id)
        );
        setSelectedItem(null);
    };

    // Cancel entire sale
    const handleCancelSale = () => {
        if (!confirm('هل تريد إلغاء عملية البيع؟\nCancel entire sale?')) {
            return;
        }
        vibrate();
        setCart([]);
        setSelectedItem(null);
        handleSearch('');
    };

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Complete sale
    const handleCompleteSale = async () => {
        if (cart.length === 0) {
            alert('السلة فارغة');
            return;
        }

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

            // Update stock levels
            for (const item of cart) {
                const product = item.product;
                const newStock = (product.stock || 0) - item.quantity;
                await productDB.update(product.id, { stock: newStock });
            }

            alert(`✓ تم البيع\n${formatCurrency(subtotal)}`);
            setCart([]);
            handleSearch('');
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
                    placeholder="ابحث عن منتج... (Search product)"
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
                        <div class="empty-icon">
                            <${Icons.Package} />
                        </div>
                        <p class="empty-text">لا توجد منتجات</p>
                    </div>
                ` : filteredProducts.map(product => {
                    const qtyInCart = getCartQuantity(product.id);
                    return html`
                        <div
                            class="sell-product-item ${qtyInCart > 0 ? 'in-cart' : ''}"
                            key=${product.id}
                            onClick=${() => addToCart(product)}
                        >
                            <div class="sell-product-image">
                                ${product.image ? html`
                                    <img src=${product.image} alt=${product.name} />
                                ` : html`
                                    <${Icons.Package} />
                                `}
                            </div>
                            <div class="sell-product-info">
                                <div class="sell-product-name">${product.name}</div>
                                <div class="sell-product-price">${formatCurrency(product.salePrice)}</div>
                            </div>
                            ${qtyInCart > 0 && html`
                                <div class="sell-product-badge">${qtyInCart}</div>
                            `}
                        </div>
                    `;
                })}
            </div>

            <!-- Cart Bar -->
            ${cart.length > 0 && html`
                <div class="sell-cart-bar" onClick=${() => setSelectedItem(cart[0])}>
                    <div class="sell-cart-info">
                        <span class="sell-cart-count">${totalItems} منتج</span>
                        <span class="sell-cart-total">${formatCurrency(subtotal)}</span>
                    </div>
                    <button
                        class="sell-cart-checkout"
                        onClick=${(e) => { e.stopPropagation(); handleCompleteSale(); }}
                        disabled=${isProcessing}
                    >
                        ${isProcessing ? 'جاري...' : 'إتمام البيع'}
                    </button>
                </div>
            `}

            <!-- Scanner Modal -->
            ${showScanner && html`
                <div class="modal-overlay" onClick=${closeScanner}>
                    <div class="scanner-modal" onClick=${(e) => e.stopPropagation()}>
                        <div class="scanner-modal-header">
                            <button class="btn-icon-only" onClick=${closeScanner}>
                                <${Icons.ArrowRight} />
                            </button>
                            <h3>مسح الباركود</h3>
                            <div style="width: 40px;"></div>
                        </div>

                        <div class="scanner-container">
                            <video id="scanner-video" class="scanner-video" autoplay playsinline muted></video>

                            ${!scannerActive && html`
                                <div class="scanner-placeholder">
                                    <div class="scanner-placeholder-icon">
                                        <${Icons.Barcode} />
                                    </div>
                                    <p>جاري تفعيل الكاميرا...</p>
                                    <button class="scanner-activate-btn" onClick=${startScanner}>
                                        إعادة المحاولة
                                    </button>
                                </div>
                            `}

                            ${scannerActive && html`
                                <div class="scan-line"></div>
                            `}

                            <div class="scanner-frame">
                                <div class="scanner-corner top-left"></div>
                                <div class="scanner-corner top-right"></div>
                                <div class="scanner-corner bottom-left"></div>
                                <div class="scanner-corner bottom-right"></div>
                            </div>

                            ${lastScanned && html`
                                <div class="scan-notification">
                                    ✓ تمت الإضافة
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `}

            <!-- Item Editor Modal -->
            ${selectedItem && html`
                <div class="modal-overlay" onClick=${() => setSelectedItem(null)}>
                    <div class="item-editor-modal" onClick=${(e) => e.stopPropagation()}>
                        <div class="item-editor-header">
                            <span class="item-editor-name">${selectedItem.product.name}</span>
                            <span class="item-editor-price">${formatCurrency(selectedItem.product.salePrice)}</span>
                        </div>

                        <div class="item-editor-qty">
                            <button class="qty-btn" onClick=${() => updateQuantity(selectedItem.quantity - 1)}>−</button>
                            <span class="qty-value">${selectedItem.quantity}</span>
                            <button class="qty-btn" onClick=${() => updateQuantity(selectedItem.quantity + 1)}>+</button>
                        </div>

                        <div class="item-editor-subtotal">
                            ${formatCurrency(selectedItem.product.salePrice * selectedItem.quantity)}
                        </div>

                        <div class="item-editor-actions">
                            <button class="btn-remove" onClick=${removeFromCart}>
                                حذف
                            </button>
                            <button class="btn-done" onClick=${() => setSelectedItem(null)}>
                                تم
                            </button>
                        </div>
                    </div>
                </div>
            `}
        </div>
    `;
}
