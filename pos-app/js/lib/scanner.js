/**
 * Barcode Scanner Service
 * Abstracts barcode detection to allow easy swapping of scanner libraries
 *
 * Currently uses: Native BarcodeDetector API (Chrome/Edge)
 * Alternatives: ZXing, QuaggaJS, Dynamsoft, html5-qrcode
 *
 * Optimizations applied:
 * - Limited barcode formats (EAN-13, EAN-8, UPC-A only)
 * - Frame throttling (100ms between scans)
 * - Confidence checking (2 consecutive reads)
 * - Debounce for same barcode (handled in SellTab)
 */

// Scanner configuration
const SCANNER_CONFIG = {
    // Only formats needed for grocery products (faster detection)
    formats: ['ean_13', 'ean_8', 'upc_a'],

    // Number of consecutive reads required for confidence
    // Reduced to 1 since smaller scan area = more reliable detections
    requiredReads: 1,

    // Minimum barcode length
    minLength: 8,

    // Frame throttle interval in ms (don't process every frame)
    // Reduced for faster response with smaller crop area
    throttleMs: 80
};

/**
 * Validates a barcode string
 * @param {string} code - The barcode to validate
 * @returns {boolean} - Whether the barcode is valid
 */
export const isValidBarcode = (code) => {
    if (!code || code.length < SCANNER_CONFIG.minLength) return false;

    // EAN-13 (most common for grocery)
    if (/^\d{13}$/.test(code)) return true;
    // EAN-8 (small products)
    if (/^\d{8}$/.test(code)) return true;
    // UPC-A (imported products)
    if (/^\d{12}$/.test(code)) return true;

    return false;
};

/**
 * Checks if the current browser supports barcode detection
 * @returns {boolean}
 */
export const isScannerSupported = () => {
    return 'BarcodeDetector' in window;
};

/**
 * Get optimal camera constraints for barcode scanning
 * @param {string} facingMode - 'environment' (back) or 'user' (front)
 * @returns {Object} MediaStream constraints
 */
export const getCameraConstraints = (facingMode = 'environment') => ({
    video: {
        facingMode,
        // HD resolution (1280x720) - optimal for speed and accuracy
        width: { ideal: 1280 },
        height: { ideal: 720 },
        // Enable autofocus if available
        focusMode: { ideal: 'continuous' },
        // Prefer higher frameRate for smooth preview
        frameRate: { ideal: 30 }
    }
});

/**
 * Crop video frame to scan region (center rectangle)
 * Reduces pixels to analyze by 70-80%, significantly faster detection
 * Smaller area = better camera autofocus on barcode
 *
 * @param {HTMLVideoElement} video - Video element
 * @param {Object} options - Crop options
 * @returns {HTMLCanvasElement} Cropped canvas
 */
export const cropToScanRegion = (video, options = {}) => {
    const {
        // Matches the CSS scanner-frame: top 35%, bottom 35%, left 8%, right 8%
        topPercent = 35,
        bottomPercent = 35,
        leftPercent = 8,
        rightPercent = 8
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Calculate scan region dimensions
    const cropLeft = Math.floor(video.videoWidth * leftPercent / 100);
    const cropTop = Math.floor(video.videoHeight * topPercent / 100);
    const cropWidth = Math.floor(video.videoWidth * (100 - leftPercent - rightPercent) / 100);
    const cropHeight = Math.floor(video.videoHeight * (100 - topPercent - bottomPercent) / 100);

    // Set canvas to cropped size
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw cropped region
    ctx.drawImage(
        video,
        cropLeft, cropTop, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );

    return canvas;
};

/**
 * Creates a barcode scanner instance
 * This is the abstraction layer - swap implementation here to change libraries
 *
 * @returns {Object} Scanner instance with detect() method
 */
export const createScanner = () => {
    // ============================================
    // NATIVE BARCODE DETECTOR (Current Implementation)
    // ============================================
    if ('BarcodeDetector' in window) {
        const detector = new BarcodeDetector({
            formats: SCANNER_CONFIG.formats
        });

        return {
            name: 'NativeBarcodeDetector',

            /**
             * Detect barcodes in a video frame
             * @param {HTMLVideoElement} video
             * @returns {Promise<string|null>} Detected barcode or null
             */
            detect: async (video) => {
                try {
                    // Crop to center scan region to reduce pixels and speed up detection
                    const croppedCanvas = cropToScanRegion(video);
                    const barcodes = await detector.detect(croppedCanvas);
                    if (barcodes.length > 0) {
                        return barcodes[0].rawValue;
                    }
                } catch (e) {
                    // Detection failed silently
                }
                return null;
            },

            /**
             * Cleanup resources
             */
            destroy: () => {
                // Native detector doesn't need cleanup
            }
        };
    }

    // ============================================
    // FALLBACK: No scanner available
    // ============================================
    console.warn('BarcodeDetector not supported in this browser');
    return {
        name: 'Unsupported',
        detect: async () => null,
        destroy: () => {}
    };

    // ============================================
    // ALTERNATIVE: ZXing (uncomment to use)
    // npm install @zxing/library
    // ============================================
    /*
    import { BrowserMultiFormatReader } from '@zxing/library';

    const reader = new BrowserMultiFormatReader();

    return {
        name: 'ZXing',
        detect: async (video) => {
            try {
                const result = await reader.decodeFromVideoElement(video);
                return result?.getText() || null;
            } catch (e) {
                return null;
            }
        },
        destroy: () => {
            reader.reset();
        }
    };
    */

    // ============================================
    // ALTERNATIVE: QuaggaJS (uncomment to use)
    // npm install quagga
    // ============================================
    /*
    import Quagga from 'quagga';

    return {
        name: 'QuaggaJS',
        detect: async (video) => {
            return new Promise((resolve) => {
                Quagga.decodeSingle({
                    decoder: { readers: ['ean_reader', 'ean_8_reader'] },
                    locate: true,
                    src: video
                }, (result) => {
                    resolve(result?.codeResult?.code || null);
                });
            });
        },
        destroy: () => {
            Quagga.stop();
        }
    };
    */
};

/**
 * Creates a detection loop with confidence checking and throttling
 *
 * @param {Object} options
 * @param {HTMLVideoElement} options.video - Video element to scan
 * @param {Function} options.onDetect - Callback when barcode is confidently detected
 * @param {Function} options.onError - Optional error callback
 * @returns {Object} Controller with stop() method
 */
export const createDetectionLoop = ({ video, onDetect, onError }) => {
    const scanner = createScanner();
    let consecutiveReads = {};
    let isRunning = true;
    let isProcessing = false;
    let lastProcessTime = 0;

    const detect = async () => {
        if (!isRunning || !video.srcObject) return;

        const now = Date.now();

        // Throttle: skip if last process was too recent or still processing
        if (isProcessing || (now - lastProcessTime) < SCANNER_CONFIG.throttleMs) {
            if (isRunning && video.srcObject) {
                requestAnimationFrame(detect);
            }
            return;
        }

        isProcessing = true;
        lastProcessTime = now;

        try {
            const code = await scanner.detect(video);

            if (code && isValidBarcode(code)) {
                // Increment consecutive read count
                consecutiveReads[code] = (consecutiveReads[code] || 0) + 1;

                // Reset other codes
                Object.keys(consecutiveReads).forEach(k => {
                    if (k !== code) consecutiveReads[k] = 0;
                });

                // Check if we have enough confidence
                if (consecutiveReads[code] >= SCANNER_CONFIG.requiredReads) {
                    consecutiveReads[code] = 0;
                    onDetect(code);
                }
            }
        } catch (e) {
            if (onError) onError(e);
        }

        isProcessing = false;

        if (isRunning && video.srcObject) {
            requestAnimationFrame(detect);
        }
    };

    // Start detection
    detect();

    // Return controller
    return {
        stop: () => {
            isRunning = false;
            scanner.destroy();
        },

        reset: () => {
            consecutiveReads = {};
        },

        getScannerName: () => scanner.name
    };
};

/**
 * Get scanner configuration
 */
export const getScannerConfig = () => ({ ...SCANNER_CONFIG });

/**
 * Update scanner configuration
 * @param {Object} config - New configuration values
 */
export const updateScannerConfig = (config) => {
    Object.assign(SCANNER_CONFIG, config);
};
