/**
 * storage.js
 * Handles local storage operations for high scores, user preferences, statistics, 
 * and persistent game state for Retro Snake Arcade.
 */

const STORAGE_KEYS = {
    HIGH_SCORES: 'snake_arcade_high_scores',
    SETTINGS: 'snake_arcade_settings',
    STATS: 'snake_arcade_stats'
};

const DEFAULT_SETTINGS = {
    soundEnabled: true,
    theme: 'retro',
    controls: 'arrows',
    particleEffects: true
};

const DEFAULT_STATS = {
    totalGamesPlayed: 0,
    totalScore: 0,
    applesEaten: 0,
    powerUpsCollected: 0,
    timePlayedSeconds: 0
};

// Default high scores for initial state
const DEFAULT_HIGH_SCORES = [
    { name: 'RETRO_GOD', score: 2500, date: '2023-10-15', level: 'Hard' },
    { name: 'CYBER_VIPER', score: 1850, date: '2023-10-18', level: 'Normal' },
    { name: 'PIXEL_EATER', score: 1200, date: '2023-10-20', level: 'Normal' },
    { name: 'SNAKE_CHARMER', score: 950, date: '2023-10-22', level: 'Easy' },
    { name: 'NOOB_COILED', score: 500, date: '2023-10-25', level: 'Easy' }
];

export const GameStorage = {
    /**
     * Retrieve all high scores from localStorage
     * @returns {Array} Array of high score objects sorted descending by score
     */
    getHighScores() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
            if (!data) {
                this.saveHighScores(DEFAULT_HIGH_SCORES);
                return DEFAULT_HIGH_SCORES;
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading high scores from localStorage:', error);
            return DEFAULT_HIGH_SCORES;
        }
    },

    /**
     * Save high scores array to localStorage
     * @param {Array} scores 
     */
    saveHighScores(scores) {
        try {
            // Sort descending and keep top 10
            const sorted = scores.sort((a, b) => b.score - a.score).slice(0, 10);
            localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(sorted));
        } catch (error) {
            console.error('Error saving high scores to localStorage:', error);
        }
    },

    /**
     * Add a new score and check if it qualifies for the high score list
     * @param {string} name Player name/initials
     * @param {number} score Final score achieved
     * @param {string} level Difficulty level played
     * @returns {boolean} True if it's a new high score entry
     */
    addHighScore(name, score, level = 'Normal') {
        if (!score || score <= 0) return false;
        
        const scores = this.getHighScores();
        const newEntry = {
            name: (name || 'ANONYMOUS').toUpperCase().slice(0, 10),
            score: parseInt(score, 10),
            date: new Date().toISOString().split('T')[0],
            level: level
        };

        scores.push(newEntry);
        scores.sort((a, b) => b.score - a.score);

        // Keep top 10
        const updated = scores.slice(0, 10);
        this.saveHighScores(updated);

        // Check if our entry made the cut
        return updated.some(entry => entry === newEntry || (entry.name === newEntry.name && entry.score === newEntry.score && entry.date === newEntry.date));
    },

    /**
     * Get user settings (sound, theme, controls)
     * @returns {Object} Settings object
     */
    getSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (!data) {
                this.saveSettings(DEFAULT_SETTINGS);
                return DEFAULT_SETTINGS;
            }
            return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        } catch (error) {
            console.error('Error reading settings from localStorage:', error);
            return DEFAULT_SETTINGS;
        }
    },

    /**
     * Save updated settings object
     * @param {Object} settings 
     */
    saveSettings(settings) {
        try {
            const current = this.getSettings();
            const updated = { ...current, ...settings };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving settings to localStorage:', error);
        }
    },

    /**
     * Get overall arcade statistics
     * @returns {Object} Stats object
     */
    getStats() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.STATS);
            if (!data) {
                this.saveStats(DEFAULT_STATS);
                return DEFAULT_STATS;
            }
            return { ...DEFAULT_STATS, ...JSON.parse(data) };
        } catch (error) {
            console.error('Error reading stats from localStorage:', error);
            return DEFAULT_STATS;
        }
    },

    /**
     * Update/increment statistics after a game finishes
     * @param {Object} gameSessionStats 
     */
    updateStats(gameSessionStats) {
        try {
            const current = this.getStats();
            const updated = {
                totalGamesPlayed: current.totalGamesPlayed + 1,
                totalScore: current.totalScore + (gameSessionStats.score || 0),
                applesEaten: current.applesEaten + (gameSessionStats.apples || 0),
                powerUpsCollected: current.powerUpsCollected + (gameSessionStats.powerUps || 0),
                timePlayedSeconds: current.timePlayedSeconds + (gameSessionStats.timeSeconds || 0)
            };
            localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('Error updating stats in localStorage:', error);
        }
    },

    /**
     * Clear all stored game data (Reset factory settings)
     */
    clearAllData() {
        try {
            localStorage.removeItem(STORAGE_KEYS.HIGH_SCORES);
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            localStorage.removeItem(STORAGE_KEYS.STATS);
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};