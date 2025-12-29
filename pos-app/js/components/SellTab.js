/**
 * Sell Tab Component - Loyverse Style
 * Product list with cart system
 *
 * @version 2.0.0
 */

import { html, useState } from '../lib/preact.js';
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

    // Add product to cart
    const addToCart = (product) => {
        vibrate();
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.product.id === product.id);

            if (existingItem) {
                // Increment quantity
                return currentCart.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                // Add new item
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
            // Create transaction
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

            // Show success
            alert(`✓ تم البيع\n${formatCurrency(subtotal)}`);

            // Clear cart
            setCart([]);
            handleSearch('');

            // Reload products to refresh stock
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
                <button class="btn-icon-only scan-btn">
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

            <!-- Cart Bar (Bottom) -->
            ${cart.length > 0 && html`
                <div class="sell-cart-bar">
                    <div class="cart-summary-info">
                        <div class="cart-items-count">${totalItems} عناصر</div>
                        <div class="cart-total-amount">${formatCurrency(subtotal)}</div>
                    </div>
                    <button class="btn-view-cart" onClick=${() => setSelectedItem('cart')}>
                        عرض السلة
                    </button>
                </div>
            `}

            <!-- Cart View Modal -->
            ${selectedItem === 'cart' && html`
                <div class="modal-overlay" onClick=${() => setSelectedItem(null)}>
                    <div class="modal-container cart-modal" onClick=${(e) => e.stopPropagation()}>
                        <div class="modal-header">
                            <button class="btn-icon-only" onClick=${() => setSelectedItem(null)}>
                                <${Icons.ArrowRight} />
                            </button>
                            <h3>السلة (${totalItems})</h3>
                            <div style="width: 40px;"></div>
                        </div>

                        <div class="cart-items-list">
                            ${cart.map(item => html`
                                <div
                                    class="cart-item-row"
                                    key=${item.product.id}
                                    onClick=${() => setSelectedItem(item)}
                                >
                                    <div class="cart-item-details">
                                        <div class="cart-item-name">${item.product.name} × ${item.quantity}</div>
                                        <div class="cart-item-price">${formatCurrency(item.product.salePrice * item.quantity)}</div>
                                    </div>
                                </div>
                            `)}
                        </div>

                        <div class="cart-footer">
                            <div class="cart-total-row">
                                <span>المجموع (Total)</span>
                                <span class="cart-total-value">${formatCurrency(subtotal)}</span>
                            </div>
                            <button
                                class="btn-charge"
                                onClick=${handleCompleteSale}
                                disabled=${isProcessing}
                            >
                                ${isProcessing ? 'جاري المعالجة...' : `ادفع ${formatCurrency(subtotal)}`}
                            </button>
                            <button class="btn-cancel-sale" onClick=${handleCancelSale}>
                                إلغاء العملية (Cancel Sale)
                            </button>
                        </div>
                    </div>
                </div>
            `}

            <!-- Item Editor Modal -->
            ${selectedItem && selectedItem !== 'cart' && html`
                <div class="modal-overlay" onClick=${() => setSelectedItem(null)}>
                    <div class="modal-container item-editor-modal" onClick=${(e) => e.stopPropagation()}>
                        <div class="modal-header">
                            <button class="btn-icon-only" onClick=${() => setSelectedItem(null)}>×</button>
                            <h3>${selectedItem.product.name}</h3>
                            <button class="btn-text-save" onClick=${() => setSelectedItem(null)}>حفظ</button>
                        </div>

                        <div class="item-editor-body">
                            <div class="editor-section">
                                <label class="editor-label">الكمية (Quantity)</label>
                                <div class="quantity-controls">
                                    <button
                                        class="qty-btn"
                                        onClick=${() => updateQuantity(selectedItem.quantity - 1)}
                                    >−</button>
                                    <input
                                        type="number"
                                        class="qty-input"
                                        value=${selectedItem.quantity}
                                        onInput=${(e) => updateQuantity(parseInt(e.target.value) || 1)}
                                    />
                                    <button
                                        class="qty-btn"
                                        onClick=${() => updateQuantity(selectedItem.quantity + 1)}
                                    >+</button>
                                </div>
                            </div>

                            <button class="btn-remove" onClick=${removeFromCart}>
                                حذف من السلة (REMOVE FROM TICKET)
                            </button>
                        </div>
                    </div>
                </div>
            `}
        </div>
    `;
}
