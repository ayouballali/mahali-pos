/**
 * Custom Hook: useProducts
 * Shared logic for product loading and management
 *
 * @version 1.0.0
 */

import { useState, useEffect } from 'https://esm.sh/preact@10.19.3/hooks';
import { productDB } from '../lib/db.js';

/**
 * Hook to load and manage products
 * @returns {Object} { products, loading, error, reloadProducts }
 */
export function useProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const allProducts = await productDB.getAll();
            setProducts(allProducts);
        } catch (err) {
            console.error('Error loading products:', err);
            setError('فشل تحميل المنتجات');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    return {
        products,
        loading,
        error,
        reloadProducts: loadProducts
    };
}
