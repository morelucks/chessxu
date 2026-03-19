export const saveGameResult = (gameResult) => {
    let playerScores = JSON.parse(localStorage.getItem('chessPlayerScores') || '{}');

    const { winner, whitePoints, blackPoints, mode } = gameResult;

    if (mode === 'pvc') {
        if (winner === 'white') {
            playerScores['You'] = (playerScores['You'] || 0) + whitePoints;
            playerScores['Computer'] = (playerScores['Computer'] || 0) + blackPoints;
        } else if (winner === 'black') {
            playerScores['You'] = (playerScores['You'] || 0) + whitePoints;
            playerScores['Computer'] = (playerScores['Computer'] || 0) + blackPoints;
        } else { // Draw
            playerScores['You'] = (playerScores['You'] || 0) + whitePoints; // Both get 1 point
            playerScores['Computer'] = (playerScores['Computer'] || 0) + blackPoints;
        }
    } else { // pvp mode
        // For pvp, we'll just use generic player names for now. Could be extended with actual player names.
        if (winner === 'white') {
            playerScores['Player 1'] = (playerScores['Player 1'] || 0) + whitePoints;
            playerScores['Player 2'] = (playerScores['Player 2'] || 0) + blackPoints;
        } else if (winner === 'black') {
            playerScores['Player 1'] = (playerScores['Player 1'] || 0) + whitePoints;
            playerScores['Player 2'] = (playerScores['Player 2'] || 0) + blackPoints;
        } else { // Draw
            playerScores['Player 1'] = (playerScores['Player 1'] || 0) + whitePoints;
            playerScores['Player 2'] = (playerScores['Player 2'] || 0) + blackPoints;
        }
    }

    localStorage.setItem('chessPlayerScores', JSON.stringify(playerScores));
};

export const loadGameResults = () => {
    const playerScores = JSON.parse(localStorage.getItem('chessPlayerScores') || '{}');
    // Convert object to array of { name, score } for easier rendering and sorting
    return Object.entries(playerScores)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score); // Sort by score descending
};

export const clearGameResults = () => {
    localStorage.removeItem('chessPlayerScores');
};
