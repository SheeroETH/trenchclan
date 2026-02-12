import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Ticker from './components/Ticker';
import LeaderboardPreview from './components/LeaderboardPreview';
import BentoFeatures from './components/BentoFeatures';
import FooterCTA from './components/FooterCTA';
import FeaturesPage from './components/FeaturesPage';
import LeaderboardPage from './components/LeaderboardPage';
import CreateClanPage from './components/CreateClanPage';
import WarRoomPage from './components/WarRoomPage';
import TournamentsPage from './components/TournamentsPage';
import ProfilePage from './components/ProfilePage';
import NotFoundPage from './components/NotFoundPage';
import AuthModal from './components/AuthModal';

const HomePage: React.FC = () => (
  <div className="flex flex-col gap-24 pb-24">
    <Hero />
    <Ticker />
    <LeaderboardPreview />
    <BentoFeatures />
    <FooterCTA />
  </div>
);

const AppContent: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();
  const isWarRoom = location.pathname === '/war-room';

  return (
    <div className="min-h-screen bg-brand-black text-white selection:bg-brand-accent/30 selection:text-brand-accent">
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-brand-black to-brand-black pointer-events-none" />

      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      <main className="flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/war-room" element={<WarRoomPage onOpenAuth={() => setAuthModalOpen(true)} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create-clan" element={<CreateClanPage onOpenAuth={() => setAuthModalOpen(true)} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isWarRoom && null}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;