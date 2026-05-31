import { useState } from 'react';
import './Control.css'

const Control = ({ children, isOpen, onClose }) => {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isSwipeRight = distance < -minSwipeDistance;

        if (isSwipeRight && isOpen) {
            onClose();
        }
    };

    return (
        <>
            {isOpen && <div className="control-overlay" onClick={onClose} />}
            <div 
                className={`control ${isOpen ? 'open' : ''}`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <button className="control-close-btn" onClick={onClose} aria-label="Close panel">×</button>
                {children}
            </div>
        </>
    );
}

export default Control