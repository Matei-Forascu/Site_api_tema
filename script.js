/**
 * Duck Gallery Dashboard
 * Fetches random duck images from https://random-d.uk/api/v2/random
 * Features: Logging system, error handling, statistics tracking
 */

// =============================
// CONFIGURATION
// =============================

const CONFIG = {
    API_URL: 'https://random-d.uk/api/v2/random',
    TIMEOUT_MS: 10000,
};

// =============================
// STATE MANAGEMENT
// =============================

const appState = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    currentFilter: 'all',
    isLoading: false,
};

// =============================
// DOM ELEMENTS
// =============================

const elements = {
    fetchBtn: document.getElementById('fetchBtn'),
    clearConsoleBtn: document.getElementById('clearConsoleBtn'),
    duckImage: document.getElementById('duckImage'),
    imageContainer: document.getElementById('imageContainer'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorAlert: document.getElementById('errorAlert'),
    errorMessage: document.getElementById('errorMessage'),
    consoleOutput: document.getElementById('consoleOutput'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    requestCount: document.getElementById('requestCount'),
    successRate: document.getElementById('successRate'),
};

// =============================
// LOGGING SYSTEM
// =============================

/**
 * Logger object for managing console output with different log levels
 */
const logger = {
    /**
     * Log an info message
     * @param {string} message - Message to log
     * @param {object} data - Optional data to log
     */
    info: function(message, data = null) {
        this.log('info', message, data);
    },

    /**
     * Log a success message
     * @param {string} message - Message to log
     * @param {object} data - Optional data to log
     */
    success: function(message, data = null) {
        this.log('success', message, data);
    },

    /**
     * Log an error message
     * @param {string} message - Message to log
     * @param {object} data - Optional data to log
     */
    error: function(message, data = null) {
        this.log('error', message, data);
    },

    /**
     * Core logging function
     * @param {string} type - Log type (info, success, error)
     * @param {string} message - Message to log
     * @param {object} data - Optional data
     */
    log: function(type, message, data = null) {
        // Create log entry with timestamp
        const timestamp = this.getFormattedTime();
        const logMessage = data ? `${message} | ${JSON.stringify(data)}` : message;

        // Log to browser console
        console[type === 'error' ? 'error' : 'log'](
            `[${timestamp}] [${type.toUpperCase()}] ${logMessage}`
        );

        // Add to UI console
        this.addToUI(type, timestamp, logMessage);
    },

    /**
     * Get formatted time string
     * @returns {string} Formatted time HH:MM:SS
     */
    getFormattedTime: function() {
        const now = new Date();
        return [
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0'),
            String(now.getSeconds()).padStart(2, '0'),
        ].join(':');
    },

    /**
     * Add log entry to UI console
     * @param {string} type - Log type
     * @param {string} timestamp - Formatted timestamp
     * @param {string} message - Log message
     */
    addToUI: function(type, timestamp, message) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.setAttribute('data-type', type);

        logEntry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-type ${type}">${type}</span>
            <span class="log-message ${type}">${this.escapeHtml(message)}</span>
        `;

        // Apply filter
        if (appState.currentFilter !== 'all' && appState.currentFilter !== type) {
            logEntry.style.display = 'none';
        }

        elements.consoleOutput.appendChild(logEntry);
        elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
};

// =============================
// STATUS MANAGEMENT
// =============================

/**
 * Update status indicator
 * @param {string} status - Status text
 * @param {string} color - Color style (primary, success, error)
 */
function updateStatus(status, color = 'primary') {
    elements.statusText.textContent = status;
    
    const colorMap = {
        'primary': '#00ff88',
        'success': '#00ff88',
        'error': '#ff4757',
        'loading': '#00b4d8'
    };

    elements.statusDot.style.backgroundColor = colorMap[color] || colorMap.primary;
}

// =============================
// UI UPDATES
// =============================

/**
 * Update statistics display
 */
function updateStats() {
    elements.requestCount.textContent = appState.totalRequests;
    
    const successRate = appState.totalRequests === 0 
        ? 0 
        : Math.round((appState.successfulRequests / appState.totalRequests) * 100);
    
    elements.successRate.textContent = `${successRate}%`;
}

/**
 * Show loading state
 */
function showLoading() {
    appState.isLoading = true;
    elements.fetchBtn.disabled = true;
    elements.loadingSpinner.style.display = 'flex';
    elements.duckImage.style.display = 'none';
    elements.errorAlert.style.display = 'none';
    updateStatus('Loading...', 'loading');
    logger.info('Fetching duck image...');
}

/**
 * Hide loading state
 */
function hideLoading() {
    appState.isLoading = false;
    elements.loadingSpinner.style.display = 'none';
    elements.fetchBtn.disabled = false;
}

/**
 * Display error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    hideLoading();
    elements.errorAlert.style.display = 'flex';
    elements.errorMessage.textContent = message;
    elements.duckImage.style.display = 'none';
    updateStatus('Error', 'error');
    logger.error(message);
    appState.failedRequests++;
    updateStats();
}

/**
 * Display duck image
 * @param {string} imageUrl - URL of the duck image
 */
function displayImage(imageUrl) {
    hideLoading();
    elements.duckImage.src = imageUrl;
    elements.duckImage.style.display = 'block';
    elements.errorAlert.style.display = 'none';
    updateStatus('Ready', 'success');
    logger.success('Duck image loaded successfully', { url: imageUrl });
    appState.successfulRequests++;
    updateStats();
}

// =============================
// API INTERACTION
// =============================

/**
 * Fetch random duck image from API
 * Implements timeout and error handling
 */
async function fetchRandomDuck() {
    // Prevent multiple simultaneous requests
    if (appState.isLoading) {
        logger.error('A request is already in progress');
        return;
    }

    showLoading();
    appState.totalRequests++;

    try {
        // Create an AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

        logger.info('Requesting API', { url: CONFIG.API_URL });

        // Fetch from API
        const response = await fetch(CONFIG.API_URL, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            }
        });

        clearTimeout(timeoutId);

        // Check response status
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}: ${response.statusText}`);
        }

        // Parse response
        const data = await response.json();

        // Validate response data
        if (!data.url) {
            throw new Error('Invalid API response: missing URL');
        }

        logger.info('API response received', { statusCode: response.status });

        // Display the image
        displayImage(data.url);

    } catch (error) {
        // Handle different error types
        let errorMessage = 'Failed to fetch duck image';

        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout - API took too long to respond';
            logger.error('Request timeout', { timeout: `${CONFIG.TIMEOUT_MS}ms` });
        } else if (error instanceof TypeError) {
            errorMessage = 'Network error - Unable to reach the API';
            logger.error('Network error', { message: error.message });
        } else if (error instanceof SyntaxError) {
            errorMessage = 'Invalid response format from API';
            logger.error('Parse error', { message: error.message });
        } else {
            logger.error('Fetch error', { message: error.message });
        }

        showError(errorMessage);
    }
}

// =============================
// CONSOLE FILTER
// =============================

/**
 * Filter console logs by type
 * @param {string} filterType - Filter type (all, info, success, error)
 */
function filterLogs(filterType) {
    appState.currentFilter = filterType;
    const logEntries = document.querySelectorAll('.log-entry');

    logEntries.forEach(entry => {
        if (filterType === 'all') {
            entry.style.display = 'flex';
        } else {
            entry.style.display = entry.getAttribute('data-type') === filterType ? 'flex' : 'none';
        }
    });

    logger.info(`Console filtered to: ${filterType}`);
}

/**
 * Clear all console logs
 */
function clearConsoleLogs() {
    const logEntries = document.querySelectorAll('.log-entry');
    
    // Keep the first entry for context
    logEntries.forEach((entry, index) => {
        if (index > 0) {
            entry.remove();
        }
    });

    logger.info('Console cleared');
}

// =============================
// EVENT LISTENERS
// =============================

// Fetch button click
elements.fetchBtn.addEventListener('click', fetchRandomDuck);

// Clear console button click
elements.clearConsoleBtn.addEventListener('click', clearConsoleLogs);

// Console filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // Apply filter
        const filterType = this.getAttribute('data-filter');
        filterLogs(filterType);
    });
});

// =============================
// INITIALIZATION
// =============================

/**
 * Initialize the application
 */
function init() {
    logger.info('Application initialized successfully');
    logger.info('API endpoint: ' + CONFIG.API_URL);
    updateStatus('Ready', 'primary');
    updateStats();
    logger.info('Click "Get Random Duck" to fetch an image');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
