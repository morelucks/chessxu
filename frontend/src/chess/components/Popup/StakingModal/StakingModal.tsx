import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../contexts/Context';
import { setupNewGame } from '../../../reducer/actions/game';
import { saveStakeData, getDummyBalance, resetDummyBalance } from '../../../helper/stakeStorage';
import { winProbabilityPercent, projectEloAfterWin } from '../../../utils/eloUtils';
import { useCeloChess } from '../../../../hooks/useCeloChess';
import useAppStore from '../../../../zustand/store';
import celoService from '../../../services/celoService';
import './StakingModal.css';

const StakingModal = ({ onClosePopup }) => {
    const { appState: { gameMode }, dispatch } = useAppContext();
    const celo = useCeloChess();
    const address = useAppStore((state) => state.address);
    const [stakeAmount, setStakeAmount] = useState('');
    const [isValidAmount, setIsValidAmount] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [playerBalance, setPlayerBalance] = useState(0);
    const [chessBalance, setChessBalance] = useState(0);
    const [isStxMode, setIsStxMode] = useState(true); // true = CELO, false = CHESS

    // Predefined stake amounts for quick selection
    const quickStakes = [10, 15, 20, 25, 30];

    useEffect(() => {
        if (address) {
            // Fetch Celo native balance
            celoService.getNativeBalance(address as `0x${string}`)
                .then((bal) => {
                    setPlayerBalance(Number(bal) / 1e18);
                })
                .catch((err) => {
                    console.error("Error fetching CELO balance:", err);
                    setPlayerBalance(0);
                });

            // Fetch CHESS token balance on Celo dynamically
            celoService.publicClient.readContract({
                address: celoService.getContractAddress(),
                abi: [{
                    name: 'chessxuToken',
                    type: 'function',
                    stateMutability: 'view',
                    inputs: [],
                    outputs: [{ type: 'address' }]
                }],
                functionName: 'chessxuToken',
            })
            .then((tokenAddress) => {
                if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
                    return celoService.getStableTokenBalance(address as `0x${string}`, tokenAddress);
                }
                return 0n;
            })
            .then((tokenBal) => {
                setChessBalance(Number(tokenBal));
            })
            .catch((err) => {
                console.error("Error fetching Celo custom token balance:", err);
                setChessBalance(0);
            });
        }
    }, [address]);

    useEffect(() => {
        const amount = parseFloat(stakeAmount);
        const currentBalance = isStxMode ? playerBalance : chessBalance / 1e18;
        setIsValidAmount(amount > 0 && amount <= currentBalance && amount <= 1000 && !isNaN(amount));
    }, [stakeAmount, playerBalance, chessBalance, isStxMode]);

    const handleQuickStake = (amount) => {
        setStakeAmount(amount.toString());
    };

    const handleStakeChange = (e) => {
        const value = e.target.value;
        // Allow only numbers and one decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setStakeAmount(value);
        }
    };

    const handleStartGame = async () => {
        if (!isValidAmount) return;
        setIsSubmitting(true);
        try {
            const amount = parseFloat(stakeAmount);

            celo.createGame(stakeAmount, isStxMode)
                .then(() => {
                    saveStakeData({ amount, timestamp: Date.now(), gameMode: 'pvp', status: 'active', isStx: isStxMode });
                    dispatch(setupNewGame('pvp'));
                    onClosePopup();
                    setIsSubmitting(false);
                })
                .catch(() => setIsSubmitting(false));
        } catch (error) {
            console.error('Error starting game:', error);
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        onClosePopup();
    };

    return (
        <div className="popup--inner popup--inner__center staking-modal">
            <div className="staking-header">
                <h1>🤝 Player vs Player</h1>
                <p>Stake an amount to kick off a PvP match!</p>
                <div className="balance-display">
                    <span className="balance-label">Your Balance:</span>
                    <span className="balance-amount">
                        {isStxMode 
                          ? `${playerBalance.toFixed(2)} CELO` 
                          : `${(chessBalance / 1e18).toFixed(2)} CHESS`}
                    </span>
                </div>
                <div className="token-toggle" style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button 
                        className={`btn-toggle ${isStxMode ? 'active' : ''}`}
                        onClick={() => setIsStxMode(true)}
                        style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: isStxMode ? '#3b82f6' : '#1e293b', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        CELO
                    </button>
                    <button 
                        className={`btn-toggle ${!isStxMode ? 'active' : ''}`}
                        onClick={() => setIsStxMode(false)}
                        style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: !isStxMode ? '#3b82f6' : '#1e293b', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        CHESS
                    </button>
                </div>
            </div>

            <div className="staking-content">
                <div className="stake-input-section">
                    <label htmlFor="stakeAmount" className="stake-label">
                        Stake Amount ({isStxMode ? 'CELO' : 'CHESS'})
                    </label>
                    <div className="stake-input-container">
                        <input
                            id="stakeAmount"
                            type="text"
                            value={stakeAmount}
                            onChange={handleStakeChange}
                            placeholder="0.0"
                            className={`stake-input ${!isValidAmount && stakeAmount ? 'invalid' : ''}`}
                            disabled={isSubmitting}
                        />
                        <span className="eth-symbol">{isStxMode ? 'CELO' : 'CHESS'}</span>
                    </div>
                    {!isValidAmount && stakeAmount && (
                        <p className="error-message">
                            {parseFloat(stakeAmount) > (isStxMode ? playerBalance : chessBalance / 1e18)
                                ? `Insufficient balance. You have ${isStxMode ? playerBalance.toFixed(2) + ' CELO' : (chessBalance / 1e18).toFixed(2) + ' CHESS'}`
                                : `Please enter a valid amount between 0.1 and 1000 ${isStxMode ? 'CELO' : 'CHESS'}`
                            }
                        </p>
                    )}
                </div>

                <div className="quick-stakes">
                    <p className="quick-stakes-label">Quick Select:</p>
                    <div className="quick-stakes-buttons">
                        {quickStakes.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => handleQuickStake(amount)}
                                className={`quick-stake-btn ${stakeAmount === amount.toString() ? 'selected' : ''}`}
                                disabled={isSubmitting}
                            >
                                {amount} {isStxMode ? 'CELO' : 'CHESS'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="game-info">
                    <div className="info-item">
                        <span className="info-label">Game Mode:</span>
                        <span className="info-value">Player vs Player</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Your Color:</span>
                        <span className="info-value">White (You start first)</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Potential Reward:</span>
                        <span className="info-value">
                            {stakeAmount && isValidAmount 
                                ? `${(parseFloat(stakeAmount) * 1.8).toFixed(2)} ${isStxMode ? 'CELO' : 'CHESS'}` 
                                : `-- ${isStxMode ? 'CELO' : 'CHESS'}`
                            }
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Win Probability:</span>
                        <span className="info-value">{winProbabilityPercent(1200, 1200)}%</span>
                    </div>
                </div>
            </div>

            <div className="staking-actions">
                <button
                    onClick={handleCancel}
                    className="btn btn-cancel"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    onClick={handleStartGame}
                    className={`btn btn-primary ${!isValidAmount ? 'disabled' : ''}`}
                    disabled={!isValidAmount || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading-spinner"></span>
                            Starting Game...
                        </>
                    ) : (
                        `Stake ${stakeAmount || '0'} ${isStxMode ? 'CELO' : 'CHESS'} & Start`
                    )}
                </button>
            </div>
        </div>
    );
};

export default StakingModal;
