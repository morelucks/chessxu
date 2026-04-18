import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../components/pages/LandingPage";
import ChessScreen from "../components/pages/ChessScreen";
import LeaderboardPage from "../components/pages/LeaderboardPage";
import useAppStore, { userSession } from "../zustand/store";
import { ToasterProvider } from "../components/ui/toasts/ToasterProvider";
import { useMiniPay } from "../hooks/useMiniPay";
import { useFarcaster } from "../hooks/useFarcaster";
import { FarcasterMiniAppReady } from "../components/FarcasterMiniAppReady";

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
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chess" element={<ChessScreen />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </BrowserRouter>
    </ToasterProvider>
  );
}

export default App;