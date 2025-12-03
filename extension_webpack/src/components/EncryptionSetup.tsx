import React, { useState, useEffect } from 'react';
import { FiShield, FiKey, FiLock, FiUnlock, FiAlertTriangle, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { encryptionService } from '../services/encryptionService';
import { useNotifications } from './NotificationProvider';

interface EncryptionSetupProps {
  onSetupComplete?: () => void;
}

const EncryptionSetup: React.FC<EncryptionSetupProps> = ({ onSetupComplete }) => {
  const [setupStatus, setSetupStatus] = useState<{
    hasPersistentKey: boolean;
    hasUserPassword: boolean;
    keyAvailable: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { showError, showSuccess, showInfo } = useNotifications();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setIsLoading(true);
      const status = await encryptionService.getEncryptionSetupStatus();
      setSetupStatus(status);
      
      if (status.keyAvailable) {
        showInfo('Encryption Active', 'Your data is protected with encryption.');
        onSetupComplete?.();
      }
    } catch (error) {
      console.error('Failed to check encryption status:', error);
      showError('Setup Error', 'Failed to check encryption status');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return '';
  };

  const handleSetupEncryption = async () => {
    setPasswordError('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Validate password strength
    const error = validatePassword(password);
    if (error) {
      setPasswordError(error);
      return;
    }

    setIsSettingUp(true);

    try {
      await encryptionService.initializeEncryption(password);
      showSuccess('Encryption Setup Complete', 'Your data is now protected with AES-256-GCM encryption.');
      onSetupComplete?.();
      await checkSetupStatus();
    } catch (error) {
      console.error('Encryption setup failed:', error);
      showError('Setup Failed', error instanceof Error ? error.message : 'Failed to set up encryption');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleUseSessionEncryption = async () => {
    setIsSettingUp(true);

    try {
      await encryptionService.initializeEncryption();
      showInfo('Session Encryption', 'Encryption is active for this session. Data will be lost when you close the browser.');
      onSetupComplete?.();
      await checkSetupStatus();
    } catch (error) {
      console.error('Session encryption setup failed:', error);
      showError('Setup Failed', 'Failed to set up session encryption');
    } finally {
      setIsSettingUp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-600">Checking encryption status...</span>
        </div>
      </div>
    );
  }

  if (setupStatus?.keyAvailable) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <FiCheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Encryption Active</h3>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-green-800 text-sm">
            ✅ Your data is protected with AES-256-GCM encryption and will persist across browser sessions.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          <p>🔒 Encryption protects your personal information, resumes, and job data.</p>
          <p>🗝️ Your encryption password is required to access your data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FiShield className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800">Set Up Data Encryption</h3>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <FiAlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-800 font-medium text-sm">Important Security Notice</p>
            <p className="text-blue-700 text-xs mt-1">
              Your personal data, resumes, and job information will be encrypted using military-grade AES-256-GCM encryption. 
              This protects your data even if someone gains access to your browser storage.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiKey className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-slate-800">Recommended: Password Protection</h4>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Set an encryption password to ensure your data persists across browser sessions and remains secure.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Encryption Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {passwordError && (
              <p className="text-red-600 text-sm">{passwordError}</p>
            )}

            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-600 mb-2">Password Requirements:</p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Include uppercase and lowercase letters</li>
                <li>• Include at least one number</li>
                <li>• Your password cannot be recovered if forgotten</li>
              </ul>
            </div>

            <button
              onClick={handleSetupEncryption}
              disabled={isSettingUp || !password || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              <FiLock className="w-4 h-4" />
              {isSettingUp ? 'Setting Up Encryption...' : 'Enable Password Protection'}
            </button>
          </div>
        </div>

        <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
          <div className="flex items-center gap-2 mb-3">
            <FiUnlock className="w-5 h-5 text-yellow-600" />
            <h4 className="font-semibold text-yellow-800">Session-Only Encryption</h4>
          </div>
          <p className="text-sm text-yellow-700 mb-4">
            Use encryption for this session only. Your data will be lost when you close the browser.
          </p>
          
          <button
            onClick={handleUseSessionEncryption}
            disabled={isSettingUp}
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            <FiUnlock className="w-4 h-4" />
            {isSettingUp ? 'Setting Up...' : 'Use Session Encryption'}
          </button>
        </div>
      </div>

      <div className="mt-6 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-600">
          💡 <strong>Recommendation:</strong> Use password protection to ensure your job search data is always available and secure.
        </p>
      </div>
    </div>
  );
};

export default EncryptionSetup;