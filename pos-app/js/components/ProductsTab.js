/**
 * Products Tab Component
 * Displays product list or empty state
 *
 * @version 1.0.0
 */

import { html, useState, useEffect } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { AddProductTab } from './AddProductTab.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { productDB } from '../lib/db.js';
import { formatCurrency, vibrate } from '../utils/helpers.js';

/**
 * Products Tab Component
 * @param {Object} props
 * @param {boolean} props.isActive - Whether this tab is active
 * @param {Function} props.setCanNavigateAway - Set navigation guard callback
 * @param {Function} props.confirmNavigation - Confirm pending navigation
 * @returns {import('preact').VNode}
 */
export function ProductsTab({ isActive, setCanNavigateAway, confirmNavigation }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // Close add product form when tab becomes inactive
    useEffect(() => {
        if (!isActive && showAddProduct) {
            // User navigated away - close the form
            setShowAddProduct(false);
            setHasUnsavedChanges(false);
            setShowConfirmDialog(false);
        }
    }, [isActive, showAddProduct]);

    // Register/unregister navigation guard
    useEffect(() => {
        if (showAddProduct && hasUnsavedChanges && setCanNavigateAway) {
            // Register guard that shows custom dialog
            setCanNavigateAway(() => () => {
                setShowConfirmDialog(true);
                setPendingNavigation('tab-change');
                return false; // Block navigation initially
            });
        } else if (setCanNavigateAway) {
            // Remove guard
            setCanNavigateAway(null);
        }

        // Cleanup on unmount
        return () => {
            if (setCanNavigateAway) {
                setCanNavigateAway(null);
            }
        };
    }, [showAddProduct, hasUnsavedChanges, setCanNavigateAway]);

    // Load products from IndexedDB
    useEffect(() => {
        if (isActive) {
            loadProducts();
        }
    }, [isActive]);

    /**
     * Load all products from database
     */
    const loadProducts = async () => {
        try {
            setLoading(true);
            const allProducts = await productDB.getAll();
            setProducts(allProducts);
            setFilteredProducts(allProducts);
        } catch (error) {
            console.error('Error loading products:', error);
            // Fail gracefully - show empty state
            setProducts([]);
            setFilteredProducts([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle search query changes
     */
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredProducts(products);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(lowerQuery) ||
            (product.barcode && product.barcode.includes(query))
        );
        setFilteredProducts(filtered);
    };

    /**
     * Toggle search visibility
     */
    const toggleSearch = () => {
        vibrate();
        setShowSearch(!showSearch);
        if (showSearch) {
            setSearchQuery('');
            setFilteredProducts(products);
        }
    };

    /**
     * Handle add product button
     */
    const handleAddClick = () => {
        vibrate();
        setShowAddProduct(true);
    };

    /**
     * Handle back from add product
     */
    const handleBack = (unsavedChanges = false) => {
        if (unsavedChanges) {
            setShowConfirmDialog(true);
            setPendingNavigation('back-button');
        } else {
            vibrate();
            setShowAddProduct(false);
            setHasUnsavedChanges(false);
        }
    };

    /**
     * Handle dialog confirmation
     */
    const handleConfirmDiscard = () => {
        vibrate();
        setShowConfirmDialog(false);
        setShowAddProduct(false);
        setHasUnsavedChanges(false);

        // If this was from tab navigation, complete the navigation
        if (pendingNavigation === 'tab-change' && confirmNavigation) {
            confirmNavigation();
        }

        setPendingNavigation(null);
    };

    /**
     * Handle dialog cancellation
     */
    const handleCancelDiscard = () => {
        vibrate();
        setShowConfirmDialog(false);
        setPendingNavigation(null);
    };

    /**
     * Handle save product
     */
    const handleSaveProduct = async (product) => {
        try {
            await productDB.add(product);
            await loadProducts();
            setShowAddProduct(false);
            setHasUnsavedChanges(false);
            vibrate();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('حدث خطأ أثناء حفظ المنتج');
        }
    };

    /**
     * Track unsaved changes from AddProductTab
     */
    const handleUnsavedChangesUpdate = (hasChanges) => {
        setHasUnsavedChanges(hasChanges);
    };

    // Show Add Product screen
    if (showAddProduct) {
        return html`
            <${AddProductTab}
                onBack=${handleBack}
                onSave=${handleSaveProduct}
                onUnsavedChangesUpdate=${handleUnsavedChangesUpdate}
            />
            ${showConfirmDialog && html`
                <${ConfirmDialog}
                    message="لديك تغييرات غير محفوظة. هل تريد المتابعة والتجاهل؟"
                    confirmText="تجاهل"
                    cancelText="العودة"
                    onConfirm=${handleConfirmDiscard}
                    onCancel=${handleCancelDiscard}
                />
            `}
        `;
    }

    // Show products list or empty state
    return html`
        <div class="tab-content ${isActive ? 'active' : ''}" id="products-tab">
            <div class="tab-header">
                <h2 class="tab-title">المنتجات</h2>
                <div class="tab-header-actions">
                    <button class="btn-icon-only" onClick=${handleAddClick}>
                        <${Icons.Plus} />
                    </button>
                    <button class="btn-icon-only" onClick=${toggleSearch}>
                        <${Icons.Search} />
                    </button>
                </div>
            </div>

            ${showSearch && html`
                <div class="search-container">
                    <input
                        type="text"
                        class="search-input"
                        placeholder="ابحث عن منتج بالاسم أو الباركود..."
                        value=${searchQuery}
                        onInput=${(e) => handleSearch(e.target.value)}
                        autofocus
                    />
                </div>
            `}

            ${loading ? html`
                <div class="empty-state">
                    <p>جاري التحميل...</p>
                </div>
            ` : products.length === 0 ? html`
                <!-- Empty State -->
                <div class="empty-state">
                    <div class="empty-icon">
                        <${Icons.Package} />
                    </div>
                    <h3 class="empty-title">لا توجد منتجات بعد</h3>
                    <p class="empty-text">ابدأ بإضافة منتجك الأول</p>
                    <button class="btn-primary-outline" onClick=${handleAddClick}>
                        <span class="btn-icon-inline">
                            <${Icons.Plus} />
                        </span>
                        إضافة منتج
                    </button>
                </div>
            ` : html`
                <!-- Products List -->
                <div class="products-list">
                    ${filteredProducts.map(product => html`
                        <div class="product-card" key=${product.id}>
                            <div class="product-image">
                                ${product.image ? html`
                                    <img src=${product.image} alt=${product.name} />
                                ` : html`
                                    <${Icons.Package} />
                                `}
                            </div>
                            <div class="product-info">
                                <div class="product-name">${product.name}</div>
                                <div class="product-stock">${product.stock || 0} في المخزون</div>
                            </div>
                            <div class="product-price">
                                ${formatCurrency(product.salePrice)}
                            </div>
                        </div>
                    `)}
                </div>
            `}

            ${showConfirmDialog && html`
                <${ConfirmDialog}
                    message="لديك تغييرات غير محفوظة. هل تريد المتابعة والتجاهل؟"
                    confirmText="تجاهل"
                    cancelText="العودة"
                    onConfirm=${handleConfirmDiscard}
                    onCancel=${handleCancelDiscard}
                />
            `}
        </div>
    `;
}
