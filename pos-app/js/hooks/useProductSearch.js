/**
 * Custom Hook: useProductSearch
 * Shared logic for product search functionality
 *
 * @version 1.0.0
 */

import { useState, useEffect } from 'https://esm.sh/preact@10.19.3/hooks';

/**
 * Hook to search and filter products
 * @param {Array} products - Products array to search through
 * @returns {Object} { searchQuery, filteredProducts, handleSearch }
 */
export function useProductSearch(products) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState(products);

    useEffect(() => {
        setFilteredProducts(products);
    }, [products]);

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

    return {
        searchQuery,
        filteredProducts,
        handleSearch
    };
}
