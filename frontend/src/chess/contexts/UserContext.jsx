import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig, UserSession } from '@stacks/connect';
import useAppStore from '../../zustand/store';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userSession] = useState(() => {
    const appConfig = new AppConfig(['store_write', 'publish_data']);
    return new UserSession({ appConfig });
  });
  
  const [userData, setUserDataState] = useState(null);
  const setStoreAddress = useAppStore((s) => s.setAddress);

  const setUserData = (data) => {
    setUserDataState(data);
    const addr = data?.profile?.stxAddress?.mainnet ?? null;
    setStoreAddress(addr);
  };

  const signOut = () => {
    userSession.signUserOut();
    setStoreAddress(null);
    window.location.reload();
  };

  // Rehydrate on mount if already signed in
  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      setUserData(data);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    userSession,
    userData,
    setUserData,
    signOut,
    isSignedIn: userSession.isUserSignedIn(),
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
