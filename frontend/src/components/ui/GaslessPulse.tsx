import React from 'react';

const GaslessPulse: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <div className="absolute -inset-[10%] opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/30 rounded-full blur-[120px] animate-gasless-pulse" />
            </div>
        </div>
    );
};

export default GaslessPulse;
