import { useAppContext } from '../chess/contexts/Context';
import './MoveHistorySidebar.css';

export default function MoveHistorySidebar() {
    const { appState } = useAppContext();
    const movesList = appState?.movesList || [];

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
                    <div className="moves-list">
                        {movesList.map((move: string, i: number) => (
                            <div key={i} className="move-item">
                                <span className="move-number">{Math.floor(i/2)+1}.</span>
                                <span className="move-text">{move}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
