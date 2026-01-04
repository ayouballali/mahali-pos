/**
 * Preact Library Exports
 * Centralized imports from CDN
 */

import { h, render } from 'https://esm.sh/preact@10.19.3';
import { useState, useEffect, useRef } from 'https://esm.sh/preact@10.19.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';

// Initialize htm with Preact
export const html = htm.bind(h);

// Re-export Preact functions
export { h, render, useState, useEffect, useRef };
