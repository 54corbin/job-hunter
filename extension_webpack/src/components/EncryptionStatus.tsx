import React, { useState, useEffect } from 'react';
import { FiShield, FiCheckCircle, FiXCircle, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { checkEncryptionStatus, migrateToEncryption, clearEncryptionKeys } from '../services/storageService';
import EncryptionSetup from './EncryptionSetup';

interface EncryptionStatusProps {
  onStatusChange?: (status: any) => void;
}

const EncryptionStatus: React.FC<EncryptionStatusProps> = ({ onStatusChange }) => {
  const [encryptionStatus, setEncryptionStatus] = useState<{
    isAvailable: boolean;
    isEnabled: boolean;
    isValid: boolean;
    version?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const loadEncryptionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await checkEncryptionStatus();
      setEncryptionStatus(status);
      onStatusChange?.(status);
    } catch (err) {
      console.error('Failed to load encryption status:', err);
      setError('Failed to check encryption status');
      setEncryptionStatus({
        isAvailable: false,
        isEnabled: false,
        isValid: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateToEncryption = async () => {
    try {
      setIsMigrating(true);
      setError(null);
      const success = await migrateToEncryption();
      if (success) {
        await loadEncryptionStatus();
      } else {
        setError('Failed to migrate to encryption');
      }
    } catch (err) {
      console.error('Migration failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMessage === 'ENCRYPTION_SETUP_REQUIRED') {
        setError('Please set up encryption first using the Encryption Setup section below.');
        setShowSetup(true);
      } else {
        setError('Migration failed: ' + errorMessage);
      }
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearKeys = () => {
    clearEncryptionKeys();
    loadEncryptionStatus();
  };

  const handleSetupComplete = async () => {
    setShowSetup(false);
    await loadEncryptionStatus();
  };

  useEffect(() => {
    loadEncryptionStatus();
  }, []);

  const getStatusIcon = () => {
    if (isLoading) {
      return <FiRefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
    }

    if (!encryptionStatus?.isAvailable) {
      return <FiXCircle className="w-5 h-5 text-red-500" />;
    }

    if (!encryptionStatus.isEnabled) {
      return <FiAlertTriangle className="w-5 h-5 text-yellow-500" />;
    }

    if (!encryptionStatus.isValid) {
      return <FiXCircle className="w-5 h-5 text-red-500" />;
    }

    return <FiCheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (isLoading) {
      return 'Checking encryption status...';
    }

    if (!encryptionStatus?.isAvailable) {
      return 'Encryption not available in this browser';
    }

    if (!encryptionStatus.isEnabled) {
      return 'Encryption available but not enabled';
    }

    if (!encryptionStatus.isValid) {
      return 'Encryption enabled but validation failed';
    }

    return 'Data is encrypted with AES-256-GCM';
  };

  const getStatusColor = () => {
    if (isLoading) return 'text-blue-600';
    if (!encryptionStatus?.isAvailable) return 'text-red-600';
    if (!encryptionStatus.isEnabled) return 'text-yellow-600';
    if (!encryptionStatus.isValid) return 'text-red-600';
    return 'text-green-600';
  };

  const getBackgroundColor = () => {
    if (isLoading) return 'bg-blue-50 border-blue-200';
    if (!encryptionStatus?.isAvailable) return 'bg-red-50 border-red-200';
    if (!encryptionStatus.isEnabled) return 'bg-yellow-50 border-yellow-200';
    if (!encryptionStatus.isValid) return 'bg-red-50 border-red-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FiShield className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800">Encryption Status</h3>
      </div>

      <div className={`p-4 rounded-lg border ${getBackgroundColor()} mb-4`}>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <p className={`font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            {encryptionStatus?.version && (
              <p className="text-sm text-slate-600 mt-1">
                Encryption Version: {encryptionStatus.version}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-red-700 text-sm">{error}</p>
          {error.includes('setup encryption first') && (
            <button
              onClick={() => setShowSetup(true)}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Open Encryption Setup
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Browser Support:</span>
          <span className={`text-sm ${encryptionStatus?.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {encryptionStatus?.isAvailable ? 'Supported' : 'Not Supported'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Encryption Status:</span>
          <span className={`text-sm ${encryptionStatus?.isEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
            {encryptionStatus?.isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Data Integrity:</span>
          <span className={`text-sm ${encryptionStatus?.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {encryptionStatus?.isValid ? 'Valid' : 'Invalid'}
          </span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
        {!encryptionStatus?.isEnabled && encryptionStatus?.isAvailable && (
          <button
            onClick={handleMigrateToEncryption}
            disabled={isMigrating}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {isMigrating ? (
              <FiRefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FiShield className="w-4 h-4" />
            )}
            {isMigrating ? 'Migrating...' : 'Enable Encryption'}
          </button>
        )}

        {encryptionStatus?.isEnabled && (
          <button
            onClick={handleClearKeys}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <FiXCircle className="w-4 h-4" />
            Clear Encryption Keys
          </button>
        )}

        <button
          onClick={loadEncryptionStatus}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-slate-500 hover:bg-slate-600 disabled:bg-slate-300 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {encryptionStatus?.isEnabled && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-xs">
            🔒 Your data is protected with AES-256-GCM encryption. Keys are stored in session memory and cleared when you close the browser.
          </p>
        </div>
      )}

      {showSetup && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-800">Encryption Setup</h4>
            <button
              onClick={() => setShowSetup(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <EncryptionSetup onSetupComplete={handleSetupComplete} />
        </div>
      )}
    </div>
  );
};

export default EncryptionStatus;