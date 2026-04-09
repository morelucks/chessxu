/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TransactionToast } from './TransactionToast';

export interface Toast {
  id: string;
  txId: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'UPDATE_TOAST'; id: string; updates: Partial<Toast> }
  | { type: 'REMOVE_TOAST'; id: string };

interface ToasterContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  removeToast: (id: string) => void;
}

const ToasterContext = createContext<ToasterContextType | undefined>(undefined);

const toastReducer = (state: Toast[], action: ToastAction): Toast[] => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, action.toast];
    case 'UPDATE_TOAST':
      return state.map(t => t.id === action.id ? { ...t, ...action.updates } : t);
    case 'REMOVE_TOAST':
      return state.filter(t => t.id !== action.id);
    default:
      return state;
  }
};

export const ToasterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    dispatch({ type: 'ADD_TOAST', toast: { ...toast, id } });
    return id;
  };

  const updateToast = (id: string, updates: Partial<Toast>) => {
    dispatch({ type: 'UPDATE_TOAST', id, updates });
  };

  const removeToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  };

  return (
    <ToasterContext.Provider value={{ toasts, addToast, updateToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <TransactionToast 
            key={toast.id}
            txId={toast.txId}
            status={toast.status}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToasterContext.Provider>
  );
};

export const useToaster = () => {
  const context = useContext(ToasterContext);
  if (!context) throw new Error('useToaster must be used within a ToasterProvider');
  return context;
};
