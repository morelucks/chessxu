import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../components/pages/LandingPage";
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

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-slate-400">Coming Soon</p>
    </div>
  </div>
);

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
              <Route path="/pvp" element={<PvPScreen />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/shop" element={<PlaceholderPage title="Shop" />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
      </BrowserRouter>
    </ToasterProvider>
  );
}

export default App;