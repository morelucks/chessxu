import Board from '../chess/components/Board/Board';
// Import chess CSS to ensure board styling works
import "../chess/App.css";
import "../chess/components/Pieces/Pieces.css";
import "../chess/components/Board/bits/Ranks.css";
import "../chess/components/Board/bits/Files.css";
import "../chess/components/Popup/Popup.css";
import "./ChessBoardOnly.css";

export default function ChessBoardOnly() {
    return (
        <div className="chess-board-only">
            <Board />
        </div>
    );
}
