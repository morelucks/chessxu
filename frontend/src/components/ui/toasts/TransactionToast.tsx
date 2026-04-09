import React from 'react';
import { ExternalLink, CheckCircle, Clock, AlertCircle, Copy } from 'lucide-react';

interface TransactionToastProps {
  txId: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  onClose?: () => void;
}

export const TransactionToast: React.FC<TransactionToastProps> = ({ txId, status, message, onClose }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'error': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle size={18} />;
      case 'error': return <AlertCircle size={18} />;
      default: return <Clock size={18} className="animate-pulse" />;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(txId);
    // Could add a nested toast or simple console log
  };

  return (
    <div className={`flex flex-col gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all animate-in slide-in-from-right-8 duration-300 w-80 ${getStatusColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 font-bold">
          {getStatusIcon()}
          <span>{status.toUpperCase()}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            &times;
          </button>
        )}
      </div>
      
      <p className="text-sm font-medium opacity-90">{message}</p>
      
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 mt-1">
        <button 
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-xs hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
        >
          <Copy size={12} />
          <span>Copy ID</span>
        </button>
        <a 
          href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
        >
          <span>Explorer</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};
