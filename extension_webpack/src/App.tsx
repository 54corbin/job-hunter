import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HistoryPage from './pages/HistoryPage';
import JobsPage from './pages/JobsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import DesignSystemPage from './pages/DesignSystemPage';
import AnswerGenerationPage from './pages/AnswerGenerationPage';
import PasscodeComponent from './components/passcode/PasscodeComponent';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider, withErrorHandling } from './components/NotificationProvider';
import { getUserProfile, saveUserProfile } from './services/storageService';
import CryptoJS from 'crypto-js';

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);
  const [storedPasscodeHash, setStoredPasscodeHash] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  const updateConfigStatus = async () => {
    const profile = await getUserProfile();
    const configured = !!profile?.settings?.activeAiProviderId && (profile?.settings?.apiProviders?.length ?? 0) > 0;
    setIsConfigured(configured);
  };

  useEffect(() => {
    const initialize = async () => {
      await updateConfigStatus();
      const profile = await getUserProfile();
      if (profile?.settings?.passcodeEnabled && profile?.settings?.passcodeHash) {
        const { lastActiveTime, lockoutDelay } = profile.settings;
        if ((lockoutDelay ?? 0) === 0 || !lastActiveTime || (Date.now() - lastActiveTime > (lockoutDelay ?? 0))) {
          setIsLocked(true);
        }
        setStoredPasscodeHash(profile.settings.passcodeHash);
      } else {
        setIsLocked(false);
      }
      setLoading(false);
    };
    initialize();
  }, []);

  const handleUnlock = (enteredPasscode: string) => {
    if (enteredPasscode.length < 4) return;
    const hashedEnteredPasscode = CryptoJS.SHA256(enteredPasscode).toString();
    if (hashedEnteredPasscode === storedPasscodeHash) {
      setIsLocked(false);
      setPasscodeError(false);
      getUserProfile().then(profile => {
        if (profile) {
          const newProfile = {
            ...profile,
            settings: {
              ...profile.settings,
              lastActiveTime: Date.now(),
            }
          };
          saveUserProfile(newProfile);
        }
      });
    } else {
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 600);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ErrorBoundary>
      <NotificationProvider position="top-right" maxNotifications={3}>
        <AppContent />
      </NotificationProvider>
    </ErrorBoundary>
  );

  function AppContent() {
    const WrappedApp = withErrorHandling(() => (
      <>
        {isLocked && <PasscodeComponent onUnlock={handleUnlock} isError={passcodeError} />}
        <div className={isLocked ? 'blur-sm' : '' }>
          <Routes>
            <Route path="/*" element={
              <Layout onRedirectToSettings={() => {}} isConfigured={isConfigured}>
                <Routes>
                  <Route path="/" element={
                    !isConfigured ? <Navigate to="/settings" replace /> : <Navigate to="/profile" replace />
                  } />
                  <Route path="/history" element={
                    !isConfigured ? <Navigate to="/settings" replace /> : <HistoryPage />
                  } />
                  <Route path="/jobs" element={
                    !isConfigured ? <Navigate to="/settings" replace /> : <JobsPage />
                  } />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/profile" element={
                    !isConfigured ? <Navigate to="/settings" replace /> : <ProfilePage />
                  } />
                  <Route path="/settings" element={<SettingsPage onSettingsSave={updateConfigStatus} />} />
                </Routes>
              </Layout>
            } />
            {/* Answer Generation Popup - works independently */}
            <Route path="/answer-generation" element={<AnswerGenerationPage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
          </Routes>
        </div>
      </>
    ), {
      onError: (error, errorInfo) => {
        // Additional error logging or reporting can go here
        console.error('App-level error:', error, errorInfo);
      }
    });

    return <WrappedApp />;
  }
};

export default App;
