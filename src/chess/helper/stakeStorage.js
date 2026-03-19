// Stake storage utilities for local storage management

const STAKE_KEY = 'chessStake';
const STAKE_HISTORY_KEY = 'chessStakeHistory';

/**
 * Save stake data to localStorage
 * @param {Object} stakeData - The stake data to save
 */
export const saveStakeData = (stakeData) => {
    try {
        localStorage.setItem(STAKE_KEY, JSON.stringify(stakeData));
        
        // Also save to history
        const history = getStakeHistory();
        history.unshift({
            ...stakeData,
            id: Date.now(),
            savedAt: new Date().toISOString()
        });
        
        // Keep only last 10 stakes in history
        if (history.length > 10) {
            history.splice(10);
        }
        
        localStorage.setItem(STAKE_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving stake data:', error);
    }
};

/**
 * Get current stake data from localStorage
 * @returns {Object|null} The current stake data or null if not found
 */
export const getStakeData = () => {
    try {
        const stakeData = localStorage.getItem(STAKE_KEY);
        return stakeData ? JSON.parse(stakeData) : null;
    } catch (error) {
        console.error('Error getting stake data:', error);
        return null;
    }
};

/**
 * Get stake history from localStorage
 * @returns {Array} Array of previous stakes
 */
export const getStakeHistory = () => {
    try {
        const history = localStorage.getItem(STAKE_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error getting stake history:', error);
        return [];
    }
};

/**
 * Update stake status (e.g., when game ends)
 * @param {string} status - New status ('active', 'won', 'lost', 'cancelled')
 * @param {Object} additionalData - Any additional data to save
 */
export const updateStakeStatus = (status, additionalData = {}) => {
    try {
        const stakeData = getStakeData();
        if (stakeData) {
            const updatedStake = {
                ...stakeData,
                status,
                ...additionalData,
                updatedAt: Date.now()
            };
            saveStakeData(updatedStake);
        }
    } catch (error) {
        console.error('Error updating stake status:', error);
    }
};

/**
 * Clear current stake data
 */
export const clearStakeData = () => {
    try {
        localStorage.removeItem(STAKE_KEY);
    } catch (error) {
        console.error('Error clearing stake data:', error);
    }
};

/**
 * Get dummy player balance for demo purposes
 * @returns {number} Dummy balance in STRK
 */
export const getDummyBalance = () => {
    try {
        const balance = localStorage.getItem('dummyBalance');
        // If no balance exists, set it to 150 STRK
        if (!balance) {
            updateDummyBalance(150.0);
            return 150.0;
        }
        return parseFloat(balance);
    } catch (error) {
        console.error('Error getting dummy balance:', error);
        return 150.0;
    }
};

/**
 * Update dummy player balance
 * @param {number} newBalance - New balance amount
 */
export const updateDummyBalance = (newBalance) => {
    try {
        localStorage.setItem('dummyBalance', newBalance.toString());
    } catch (error) {
        console.error('Error updating dummy balance:', error);
    }
};

/**
 * Reset dummy player balance to 150 STRK
 */
export const resetDummyBalance = () => {
    try {
        localStorage.setItem('dummyBalance', '150.0');
    } catch (error) {
        console.error('Error resetting dummy balance:', error);
    }
};

/**
 * Simulate stake transaction (for demo purposes)
 * @param {number} amount - Amount to stake
 * @returns {Promise<Object>} Transaction result
 */
export const simulateStakeTransaction = async (amount) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const currentBalance = getDummyBalance();
    
    if (currentBalance < amount) {
        throw new Error('Insufficient balance');
    }
    
    // Update balance
    updateDummyBalance(currentBalance - amount);
    
    return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        amount,
        newBalance: currentBalance - amount
    };
};

/**
 * Simulate reward claim (for demo purposes)
 * @param {number} rewardAmount - Amount to claim as reward
 * @returns {Promise<Object>} Transaction result
 */
export const simulateRewardClaim = async (rewardAmount) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const currentBalance = getDummyBalance();
    updateDummyBalance(currentBalance + rewardAmount);
    
    return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        rewardAmount,
        newBalance: currentBalance + rewardAmount
    };
};
