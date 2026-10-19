import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AppLanguageProvider } from '@/lib/AppLanguageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import AppLayout from '@/components/AppLayout';
import TgShell from '@/components/TgShell';
import Home from '@/pages/Home';
import Market from '@/pages/Market';
import MarketSeller from '@/pages/MarketSeller';
import MarketBuy from '@/pages/MarketBuy';
import Sell from '@/pages/Sell';
import Account from '@/pages/Account';
import Deposit from '@/pages/Deposit';
import Withdraw from '@/pages/Withdraw';
import Support from '@/pages/Support';
import Language from '@/pages/Language';
import Refer from '@/pages/Refer';
import ReportSeller from '@/pages/ReportSeller';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Terms from '@/pages/Terms';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<TgShell />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Market />} />
          <Route path="/home" element={<Home />} />
          <Route path="/market" element={<Navigate to="/" replace />} />
          <Route path="/market/seller/:sellerId" element={<MarketSeller />} />
          <Route path="/market/buy/:sellerId/:countryIso" element={<MarketBuy />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/account" element={<Account />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/support" element={<Support />} />
          <Route path="/language" element={<Language />} />
          <Route path="/refer" element={<Refer />} />
          <Route path="/report-seller" element={<ReportSeller />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppLanguageProvider>
            <AuthenticatedApp />
          </AppLanguageProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App