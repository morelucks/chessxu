import { useState, useCallback } from "react";

export function useBoardAccessibility(onSelectTile, onDeselect) {
  const [focusedSq, setFocusedSq] = useState([7, 4]);
  const [announcement, setAnnouncement] = useState("");

  const handleKeyDown = useCallback((e, r, c) => {
    let nr = r, nc = c;
    if (e.key === "ArrowUp") { nr = Math.max(0, r - 1); e.preventDefault(); }
    else if (e.key === "ArrowDown") { nr = Math.min(7, r + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { nc = Math.max(0, c - 1); e.preventDefault(); }
    else if (e.key === "ArrowRight") { nc = Math.min(7, c + 1); e.preventDefault(); }
    else if (e.key === "Enter" || e.key === " ") { onSelectTile(r, c); e.preventDefault(); return; }
    else if (e.key === "Escape") { onDeselect(); e.preventDefault(); return; }
    setFocusedSq([nr, nc]);
  }, [onSelectTile, onDeselect]);

  return { focusedSq, setFocusedSq, announcement, setAnnouncement, handleKeyDown };
}
// Keyboard grid navigation hook configuration 1
// Keyboard grid navigation hook configuration 2
// Keyboard grid navigation hook configuration 3
// Keyboard grid navigation hook configuration 4
// Keyboard grid navigation hook configuration 5
// Keyboard grid navigation hook configuration 6
// Keyboard grid navigation hook configuration 7
// Keyboard grid navigation hook configuration 8
// Keyboard grid navigation hook configuration 9