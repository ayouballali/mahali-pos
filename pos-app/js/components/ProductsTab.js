/**
 * Products Tab Component
 * Displays product list or empty state
 *
 * @version 1.0.0
 */

import { html, useState, useEffect } from '../lib/preact.js';
import { Icons } from './Icons.js';
import { AddProductTab } from './AddProductTab.js';
import { EditProductTab } from './EditProductTab.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { productDB } from '../lib/db.js';
import { formatCurrency, vibrate } from '../utils/helpers.js';
import { useProducts } from '../hooks/useProducts.js';
import { useProductSearch } from '../hooks/useProductSearch.js';

/**
 * Products Tab Component
 * @param {Object} props
 * @param {boolean} props.isActive - Whether this tab is active
 * @param {Function} props.setCanNavigateAway - Set navigation guard callback
 * @param {Function} props.confirmNavigation - Confirm pending navigation
 * @returns {import('preact').VNode}
 */
export function ProductsTab({ isActive, setCanNavigateAway, confirmNavigation }) {
    const { products, loading, reloadProducts } = useProducts();
    const { searchQuery, filteredProducts, handleSearch } = useProductSearch(products);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null); // Product being edited
    const [showSearch, setShowSearch] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // Close add/edit product form when tab becomes inactive
    useEffect(() => {
        if (!isActive && (showAddProduct || editingProduct)) {
            // User navigated away - close the form
            setShowAddProduct(false);
            setEditingProduct(null);
            setHasUnsavedChanges(false);
            setShowConfirmDialog(false);
        }
    }, [isActive, showAddProduct, editingProduct]);

    // Reload products when tab becomes active (picks up products added from other tabs)
    useEffect(() => {
        if (isActive && !showAddProduct && !editingProduct) {
            reloadProducts();
        }
    }, [isActive]);

    // Handle Android back button for add/edit product form
    useEffect(() => {
        if (showAddProduct || editingProduct) {
            // Add a history entry when opening add/edit product form
            window.history.pushState({ productFormOpen: true }, '');

            // Handle back button
            const handlePopState = () => {
                if (hasUnsavedChanges) {
                    // Show confirmation dialog
                    setShowConfirmDialog(true);
                    setPendingNavigation('back-button');
                    // Push state back so we stay on the page until user confirms
                    window.history.pushState({ productFormOpen: true }, '');
                } else {
                    // No unsaved changes - just close the form
                    setShowAddProduct(false);
                    setEditingProduct(null);
                }
            };

            window.addEventListener('popstate', handlePopState);

            // Cleanup
            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [showAddProduct, editingProduct, hasUnsavedChanges]);

    // Register/unregister navigation guard
    useEffect(() => {
        if ((showAddProduct || editingProduct) && hasUnsavedChanges && setCanNavigateAway) {
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
    }, [showAddProduct, editingProduct, hasUnsavedChanges, setCanNavigateAway]);


    /**
     * Handle add product button
     */
    const handleAddClick = () => {
        vibrate();
        setShowAddProduct(true);
    };

    /**
     * Handle edit product click
     */
    const handleEditClick = (product) => {
        vibrate();
        setEditingProduct(product);
    };

    /**
     * Handle back from add/edit product
     */
    const handleBack = (unsavedChanges = false) => {
        if (unsavedChanges) {
            setShowConfirmDialog(true);
            setPendingNavigation('back-button');
        } else {
            vibrate();
            setShowAddProduct(false);
            setEditingProduct(null);
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
        setEditingProduct(null);
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
     * Handle save new product
     */
    const handleSaveProduct = async (product) => {
        try {
            await productDB.add(product);
            await reloadProducts();
            setShowAddProduct(false);
            setHasUnsavedChanges(false);
            vibrate();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('حدث خطأ أثناء حفظ المنتج');
        }
    };

    /**
     * Handle update existing product
     */
    const handleUpdateProduct = async (product) => {
        try {
            await productDB.update(product.id, product);
            await reloadProducts();
            setEditingProduct(null);
            setHasUnsavedChanges(false);
            vibrate();
        } catch (error) {
            console.error('Error updating product:', error);
            alert('حدث خطأ أثناء تحديث المنتج');
        }
    };

    /**
     * Handle delete product
     */
    const handleDeleteProduct = async (productId) => {
        try {
            await productDB.delete(productId);
            await reloadProducts();
            setEditingProduct(null);
            setHasUnsavedChanges(false);
            vibrate();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('حدث خطأ أثناء حذف المنتج');
        }
    };

    /**
     * Track unsaved changes from AddProductTab/EditProductTab
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

    // Show Edit Product screen
    if (editingProduct) {
        return html`
            <${EditProductTab}
                product=${editingProduct}
                onBack=${handleBack}
                onSave=${handleUpdateProduct}
                onDelete=${handleDeleteProduct}
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
                    <button class="btn-icon-only" onClick=${() => { vibrate(); setShowSearch(!showSearch); if (showSearch) handleSearch(''); }}>
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
                        <div class="product-card" key=${product.id} onClick=${() => handleEditClick(product)}>
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

            <!-- FAB - only show when products exist (empty state has its own add button) -->
            ${products.length > 0 && html`
                <button
                    class="fab"
                    onClick=${handleAddClick}
                    title="إضافة منتج"
                >
                    <span>إضافة</span>
                    <${Icons.Plus} />
                </button>
            `}
        </div>
    `;
}
