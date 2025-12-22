// ==========================================
// UTILS - Capi Countdown
// ==========================================
// Funciones compartidas entre módulos
// ==========================================

// Debug mode - set to true for development logs
const DEBUG = false;

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Debug log - only outputs when DEBUG is true
 * @param  {...any} args - Arguments to log
 */
function debugLog(...args) {
    if (DEBUG) console.log(...args);
}

/**
 * Generate a random ID
 * @param {number} length - Length of ID (default 9)
 * @returns {string} Random alphanumeric ID
 */
function generateId(length = 9) {
    return Math.random().toString(36).substr(2, length);
}

/**
 * Get or create user ID from localStorage
 * @returns {string} User ID
 */
function getUserId() {
    let userId = localStorage.getItem('capi_user_id');
    if (!userId) {
        userId = 'user_' + generateId();
        localStorage.setItem('capi_user_id', userId);
    }
    return userId;
}

/**
 * Format a timestamp to locale time string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted time (HH:MM)
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a timestamp to locale date string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Expose globally for non-module scripts
window.escapeHtml = escapeHtml;
window.debugLog = debugLog;
window.generateId = generateId;
window.getUserId = getUserId;
window.formatTime = formatTime;
window.formatDate = formatDate;
window.DEBUG = DEBUG;
