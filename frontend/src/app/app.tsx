import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChessScreen from "../components/pages/ChessScreen";
import PvPScreen from "../components/pages/PvPScreen";
import LeaderboardPage from "../components/pages/LeaderboardPage";
import useAppStore, { userSession } from "../zustand/store";
import { ToasterProvider } from "../components/ui/toasts/ToasterProvider";
import { useMiniPay } from "../hooks/useMiniPay";
import { useFarcaster } from "../hooks/useFarcaster";
import { FarcasterMiniAppReady } from "../components/FarcasterMiniAppReady";

import BottomNav from "../components/BottomNav";

import ProfilePage from "../components/pages/ProfilePage";
import ShopPage from "../components/pages/ShopPage";
import PuzzleScreen from '../components/pages/PuzzleScreen';
import NotFoundPage from '../components/pages/NotFoundPage';

function App() {
  const setAddress = useAppStore((state) => state.setAddress);
  
  // Attempt MiniPay auto-connection
  useMiniPay();

  // Attempt Farcaster auto-connection and init
  useFarcaster();

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
      setAddress(address);
    }
  }, [setAddress]);

  return (
    <ToasterProvider>
      <FarcasterMiniAppReady />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow pb-24 md:pb-0">
            <Routes>
              <Route path="/" element={<ChessScreen />} />
              <Route path="/puzzle" element={<PuzzleScreen />} />
              <Route path="/pvp" element={<PvPScreen />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
      </BrowserRouter>
    </ToasterProvider>
  );
}

export default App;