import { useAppContext } from '../chess/contexts/Context';
import './MoveHistorySidebar.css';

export default function MoveHistorySidebar() {
    const { appState } = useAppContext();
    const movesList = appState?.movesList || [];

    // Group moves into pairs: [White, Black]
    const groupedMoves = [];
    for (let i = 0; i < movesList.length; i += 2) {
        groupedMoves.push({
            number: Math.floor(i / 2) + 1,
            white: movesList[i],
            black: movesList[i + 1] || null,
        });
    }

    return (
        <div className="move-history-sidebar">
            <h3 className="move-history-title">Move History</h3>
            <div className="moves-container">
                {movesList.length === 0 ? (
                    <div className="no-moves">
                        <p>No moves yet</p>
                        <p className="no-moves-subtitle">Start playing to see moves here</p>
                    </div>
                ) : (
                    <div className="moves-list-table">
                        <div className="moves-list-header">
                            <span className="col-num">#</span>
                            <span className="col-move">White</span>
                            <span className="col-move">Black</span>
                        </div>
                        <div className="moves-list-body">
                            {groupedMoves.map((row) => (
                                <div key={row.number} className="moves-list-row">
                                    <span className="col-num">{row.number}.</span>
                                    <span className="col-move move-white">{row.white}</span>
                                    <span className="col-move move-black">{row.black || '...'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
