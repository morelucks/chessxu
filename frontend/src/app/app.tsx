import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChessScreen from "../components/pages/ChessScreen";
import PvPScreen from "../components/pages/PvPScreen";
import LeaderboardPage from "../components/pages/LeaderboardPage";
import useAppStore, { userSession } from "../zustand/store";
import { ToasterProvider } from "../components/ui/toasts/ToasterProvider";
import { TxHud } from "../components/ui/TxHud";
import { useMiniPay } from "../hooks/useMiniPay";
import { useFarcaster } from "../hooks/useFarcaster";
import { FarcasterMiniAppReady } from "../components/FarcasterMiniAppReady";
import ConnectWalletModal from "../components/ConnectWalletModal";

import BottomNav from "../components/BottomNav";
import DesktopNav from "../components/DesktopNav";

import ProfilePage from "../components/pages/ProfilePage";
import ShopPage from "../components/pages/ShopPage";
import PuzzleScreen from '../components/pages/PuzzleScreen';
import NotFoundPage from '../components/pages/NotFoundPage';
import HistoryPage from '../components/pages/HistoryPage';
import AnalyticsDashboard from '../components/pages/AnalyticsDashboard';

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
      <ConnectWalletModal />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-950 text-white">
          <DesktopNav />
          <div className="flex flex-col flex-grow pb-24 md:pb-0">
            <Routes>
              <Route path="/" element={<ChessScreen />} />
              <Route path="/puzzle" element={<PuzzleScreen />} />
              <Route path="/pvp" element={<PvPScreen />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
        {/* Transaction Status HUD — rendered outside route tree so it persists across navigation */}
        <TxHud />
      </BrowserRouter>
    </ToasterProvider>
  );
}

export default App;