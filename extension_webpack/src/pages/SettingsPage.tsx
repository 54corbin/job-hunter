import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserProfile, saveUserProfile, UserProfile, ApiProvider } from '../services/storageService';
import { listModels } from '../services/llmService';
import { useNotifications } from '../components/NotificationProvider';
import { FiSave, FiKey, FiToggleLeft, FiToggleRight, FiLock, FiPlus, FiTrash2, FiCpu, FiDownloadCloud } from 'react-icons/fi';
import { ConfirmModal } from '../components/ConfirmModal';

interface SettingsPageProps {
  onSettingsSave: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onSettingsSave }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', onConfirm: () => {} });
  const [providerModels, setProviderModels] = useState<{ [providerId: string]: string[] }>({});

  const { showError, showSuccess, showWarning, showInfo } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getUserProfile().then(p => {
      if (p) {
        if (!p.settings.apiProviders) p.settings.apiProviders = [];
        if (!p.settings.activeAiProviderId && p.settings.apiProviders.length > 0) {
          p.settings.activeAiProviderId = p.settings.apiProviders[0].id;
        }
        setProfile(p);
      } else {
        const newProfile: UserProfile = {
          personalInfo: { name: '', email: '', phone: '' },
          experience: [],
          education: [],
          skills: [],
          resumes: [],
          settings: {
            passcodeEnabled: false,
            apiProviders: [],
          },
        };
        setProfile(newProfile);
      }
    });
  }, []);

  useEffect(() => {
    if (profile?.settings.apiProviders) {
      profile.settings.apiProviders.forEach(provider => {
        if (provider.name === 'Ollama' && provider.apiKey) {
          listModels(provider).then(models => {
            if (models) {
              setProviderModels(prev => ({ ...prev, [provider.id]: models }));
            }
          });
        }
      });
    }
  }, [profile?.settings.apiProviders]);

  const showModal = (title: string, message: string, onConfirm?: () => void) => {
    try {
      setModalContent({ title, message, onConfirm: onConfirm || (() => setIsModalOpen(false)) });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error showing modal:", error);
      // Fallback to console log if modal fails
      console.log(`Modal: ${title} - ${message}`);
    }
  };

  const refreshModels = (provider: ApiProvider) => {
    listModels(provider).then(models => {
      if (models) {
        setProviderModels(prev => ({ ...prev, [provider.id]: models }));
        // Optional: show a success message
      }
    });
  };

  const handleSave = () => {
    try {
      if (profile) {
        if (!profile.settings.activeAiProviderId || profile.settings.apiProviders?.length === 0) {
          showWarning(
            'AI Provider Required',
            'Please add and set an active AI provider before saving.',
            {
              action: {
                label: 'Add Provider',
                onClick: () => {
                  // Focus on the add provider section
                  const addButton = document.querySelector('[data-testid="add-provider"]') as HTMLElement;
                  if (addButton) addButton.click();
                },
              },
            }
          );
          return;
        }

        // Validate that all providers have required fields
        const invalidProvider = profile.settings.apiProviders?.find(provider => {
          if (!provider.apiKey || !provider.model) {
            if (provider.name === 'Ollama') {
              return !provider.model; // Ollama only requires model (apiKey has default)
            }
            return !provider.apiKey || !provider.model;
          }
          return false;
        });

        if (invalidProvider) {
          showWarning(
            'Incomplete Provider Configuration',
            `Please complete the configuration for "${invalidProvider.name}" provider (API key and model are required).`,
            {
              action: {
                label: 'Fix',
                onClick: () => {
                  // Focus on the provider configuration
                  const providerElements = document.querySelectorAll('[data-provider-id]');
                  // This would need additional data attributes to be fully functional
                },
              },
            }
          );
          return;
        }

        let profileToSave = { ...profile };
        if (profile.settings.passcodeEnabled) {
          if (passcode || confirmPasscode) {
            if (passcode.length !== 4 || confirmPasscode.length !== 4) {
              setPasscodeError("Passcode must be 4 digits.");
              showError('Invalid Passcode', 'Passcode must be exactly 4 digits.');
              return;
            }
            if (passcode !== confirmPasscode) {
              setPasscodeError("Passcodes do not match.");
              showError('Passcode Mismatch', 'The passcodes you entered do not match.');
              return;
            }
            profileToSave.settings.passcode = passcode;
          }
        } else {
          delete profileToSave.settings.passcode;
        }

        saveUserProfile(profileToSave).then(() => {
          showSuccess('Settings Saved', 'Your settings have been saved successfully!');
          setPasscode("");
          setConfirmPasscode("");
          setPasscodeError("");
          onSettingsSave();
        }).catch((error) => {
          console.error("Failed to save settings:", error);
          showError('Save Failed', 'Failed to save settings. Please try again.');
        });
      }
    } catch (error) {
      console.error("Error in handleSave:", error);
      showError('Unexpected Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleProviderChange = (index: number, field: keyof ApiProvider, value: string) => {
    if (profile) {
      const newProviders = [...(profile.settings.apiProviders || [])];
      const oldProvider = newProviders[index];
      newProviders[index] = { ...newProviders[index], [field]: value };

      // Validate API key changes
      if (field === 'apiKey' && value && !value.trim()) {
        showWarning('API Key Required', 'Please enter a valid API key.');
        return;
      }

      // Validate model changes  
      if (field === 'model' && !value && oldProvider.name !== 'Ollama') {
        showWarning('Model Required', 'Please select a model for your API provider.');
        return;
      }

      if (field === 'name' && oldProvider.name !== value) {
        // Reset model and set default host for Ollama
        let defaultModel = '';
        if (value === 'OpenAI') {
          defaultModel = 'gpt-4o-mini';
        } else if (value === 'Gemini') {
          defaultModel = 'gemini-1.5-flash';
        } else if (value === 'Ollama') {
          // Don't set a default model immediately - let user select from available models
          defaultModel = '';
          newProviders[index].apiKey = 'http://localhost:11434';
          showInfo('Ollama Configured', 'Default Ollama host (localhost:11434) has been set. Please click the refresh button to load available models and select one.');
        }
        newProviders[index].model = defaultModel;
      }

      const updatedProfile = { 
        ...profile, 
        settings: { 
          ...profile.settings, 
          apiProviders: newProviders 
        } 
      };
      setProfile(updatedProfile);
    }
  };

  const addProvider = () => {
    if (profile) {
      const newProvider: ApiProvider = { id: new Date().toISOString(), name: 'OpenAI', model: 'gpt-4o-mini', apiKey: '' };
      const newProviders = [...(profile.settings.apiProviders || []), newProvider];
      const newSettings = { ...profile.settings, apiProviders: newProviders };
      if (newProviders.length === 1) {
        newSettings.activeAiProviderId = newProvider.id;
      }
      setProfile({ ...profile, settings: newSettings });
    }
  };

  const removeProvider = (index: number) => {
    if (profile && profile.settings.apiProviders) {
      const provider = profile.settings.apiProviders[index];
      showModal(
        'Confirm Removal',
        `Are you sure you want to remove the provider "${provider.name}"?`,
        () => {
          if (profile && profile.settings.apiProviders) {
            const newProviders = [...profile.settings.apiProviders];
            newProviders.splice(index, 1);
            const newSettings = { ...profile.settings, apiProviders: newProviders };
            if (profile.settings.activeAiProviderId === provider.id) {
              newSettings.activeAiProviderId = newProviders.length > 0 ? newProviders[0].id : undefined;
            }
            setProfile({ ...profile, settings: newSettings });
          }
        }
      );
    }
  };
  
  const setActiveProvider = (id: string) => {
    if (profile) {
      setProfile({ ...profile, settings: { ...profile.settings, activeAiProviderId: id } });
    }
  };

  const handleToggleChange = (field: keyof UserProfile['settings'], value: boolean) => {
    if (profile) {
      setProfile({ ...profile, settings: { ...profile.settings, [field]: value } });
    }
  };

  const handleLockoutDelayChange = (value: number) => {
    if (profile) {
      setProfile({ ...profile, settings: { ...profile.settings, lockoutDelay: value } });
    }
  };

  

  const Toggle = ({ enabled, onChange, label, Icon }: { enabled: boolean, onChange: (enabled: boolean) => void, label: string, Icon: React.ElementType }) => (
    <div className="flex items-center justify-between">
      <label className="flex items-center text-lg text-slate-700 font-medium">
        <Icon className="mr-3 text-slate-500 w-5 h-5" />
        {label}
      </label>
      <button onClick={() => onChange(!enabled)} className={`relative inline-flex items-center h-7 rounded-full w-12 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${enabled ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-lg' : 'bg-slate-300'}`}>
        <span className={`inline-block w-5 h-5 transform bg-white rounded-full shadow-md transition-all duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">Settings</h1>
        <p className="text-slate-600">Configure your AI providers and security preferences</p>
      </div>
      
      <div className="p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiKey className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">AI Provider Settings</h2>
        </div>
        
        {profile.settings.apiProviders?.map((provider, index) => (
          <div key={provider.id} className="p-6 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select value={provider.name} onChange={(e) => handleProviderChange(index, 'name', e.target.value)} className="p-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm">
                <option value="OpenAI">OpenAI</option>
                <option value="Gemini">Gemini</option>
                <option value="Ollama">Ollama</option>
              </select>
              <input
                type={provider.name === 'Ollama' ? 'text' : 'password'}
                placeholder={provider.name === 'Ollama' ? 'Ollama Host (e.g. http://localhost:11434)' : 'API Key'}
                value={provider.apiKey}
                onChange={(e) => handleProviderChange(index, 'apiKey', e.target.value)}
                className="p-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
              <div className="col-span-2 flex items-center gap-2">
                {provider.name === 'Ollama' ? (
                  <div className="flex items-center gap-2 w-full">
                    <select
                      value={provider.model}
                      onChange={(e) => handleProviderChange(index, 'model', e.target.value)}
                      className="p-4 w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                    >
                      <option value="">Select a model (click refresh to load available models)</option>
                      {(providerModels[provider.id] || []).map(modelName => (
                        <option key={modelName} value={modelName}>{modelName}</option>
                      ))}
                    </select>
                    <button onClick={() => refreshModels(provider)} className="p-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm">
                      <FiDownloadCloud className="text-slate-600" />
                    </button>
                  </div>
                ) : (
                  <select value={provider.model} onChange={(e) => handleProviderChange(index, 'model', e.target.value)} className="p-4 w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm">
                    {provider.name === 'OpenAI' ? (
                      <>
                        <option value="gpt-4-0613">gpt-4-0613</option>
                        <option value="gpt-4">gpt-4</option>
                        <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        <option value="gpt-5-nano">gpt-5-nano</option>
                        <option value="gpt-5">gpt-5</option>
                        <option value="gpt-5-mini-2025-08-07">gpt-5-mini-2025-08-07</option>
                        <option value="gpt-5-mini">gpt-5-mini</option>
                        <option value="gpt-5-nano-2025-08-07">gpt-5-nano-2025-08-07</option>
                        <option value="davinci-002">davinci-002</option>
                        <option value="babbage-002">babbage-002</option>
                        <option value="gpt-3.5-turbo-instruct">gpt-3.5-turbo-instruct</option>
                        <option value="gpt-3.5-turbo-instruct-0914">gpt-3.5-turbo-instruct-0914</option>
                        <option value="dall-e-3">dall-e-3</option>
                        <option value="dall-e-2">dall-e-2</option>
                        <option value="gpt-4-1106-preview">gpt-4-1106-preview</option>
                        <option value="gpt-3.5-turbo-1106">gpt-3.5-turbo-1106</option>
                        <option value="tts-1-hd">tts-1-hd</option>
                        <option value="tts-1-1106">tts-1-1106</option>
                        <option value="tts-1-hd-1106">tts-1-hd-1106</option>
                        <option value="text-embedding-3-small">text-embedding-3-small</option>
                        <option value="text-embedding-3-large">text-embedding-3-large</option>
                        <option value="gpt-4-0125-preview">gpt-4-0125-preview</option>
                        <option value="gpt-4-turbo-preview">gpt-4-turbo-preview</option>
                        <option value="gpt-3.5-turbo-0125">gpt-3.5-turbo-0125</option>
                        <option value="gpt-4-turbo">gpt-4-turbo</option>
                        <option value="gpt-4-turbo-2024-04-09">gpt-4-turbo-2024-04-09</option>
                        <option value="gpt-4o">gpt-4o</option>
                        <option value="gpt-4o-2024-05-13">gpt-4o-2024-05-13</option>
                        <option value="gpt-4o-mini-2024-07-18">gpt-4o-mini-2024-07-18</option>
                        <option value="gpt-4o-mini">gpt-4o-mini</option>
                        <option value="gpt-4o-2024-08-06">gpt-4o-2024-08-06</option>
                        <option value="chatgpt-4o-latest">chatgpt-4o-latest</option>
                        <option value="o1-mini-2024-09-12">o1-mini-2024-09-12</option>
                        <option value="o1-mini">o1-mini</option>
                        <option value="gpt-4o-realtime-preview-2024-10-01">gpt-4o-realtime-preview-2024-10-01</option>
                        <option value="gpt-4o-audio-preview-2024-10-01">gpt-4o-audio-preview-2024-10-01</option>
                        <option value="gpt-4o-audio-preview">gpt-4o-audio-preview</option>
                        <option value="gpt-4o-realtime-preview">gpt-4o-realtime-preview</option>
                        <option value="omni-moderation-latest">omni-moderation-latest</option>
                        <option value="omni-moderation-2024-09-26">omni-moderation-2024-09-26</option>
                        <option value="gpt-4o-realtime-preview-2024-12-17">gpt-4o-realtime-preview-2024-12-17</option>
                        <option value="gpt-4o-audio-preview-2024-12-17">gpt-4o-audio-preview-2024-12-17</option>
                        <option value="gpt-4o-mini-realtime-preview-2024-12-17">gpt-4o-mini-realtime-preview-2024-12-17</option>
                        <option value="gpt-4o-mini-audio-preview-2024-12-17">gpt-4o-mini-audio-preview-2024-12-17</option>
                        <option value="o1-2024-12-17">o1-2024-12-17</option>
                        <option value="o1">o1</option>
                        <option value="gpt-4o-mini-realtime-preview">gpt-4o-mini-realtime-preview</option>
                        <option value="gpt-4o-mini-audio-preview">gpt-4o-mini-audio-preview</option>
                        <option value="computer-use-preview">computer-use-preview</option>
                        <option value="o3-mini">o3-mini</option>
                        <option value="o3-mini-2025-01-31">o3-mini-2025-01-31</option>
                        <option value="gpt-4o-2024-11-20">gpt-4o-2024-11-20</option>
                        <option value="computer-use-preview-2025-03-11">computer-use-preview-2025-03-11</option>
                        <option value="gpt-4o-search-preview-2025-03-11">gpt-4o-search-preview-2025-03-11</option>
                        <option value="gpt-4o-search-preview">gpt-4o-search-preview</option>
                        <option value="gpt-4o-mini-search-preview-2025-03-11">gpt-4o-mini-search-preview-2025-03-11</option>
                        <option value="gpt-4o-mini-search-preview">gpt-4o-mini-search-preview</option>
                        <option value="gpt-4o-transcribe">gpt-4o-transcribe</option>
                        <option value="gpt-4o-mini-transcribe">gpt-4o-mini-transcribe</option>
                        <option value="o1-pro-2025-03-19">o1-pro-2025-03-19</option>
                        <option value="o1-pro">o1-pro</option>
                        <option value="gpt-4o-mini-tts">gpt-4o-mini-tts</option>
                        <option value="o3-2025-04-16">o3-2025-04-16</option>
                        <option value="o4-mini-2025-04-16">o4-mini-2025-04-16</option>
                        <option value="o3">o3</option>
                        <option value="o4-mini">o4-mini</option>
                        <option value="gpt-4.1-2025-04-14">gpt-4.1-2025-04-14</option>
                        <option value="gpt-4.1">gpt-4.1</option>
                        <option value="gpt-4.1-mini-2025-04-14">gpt-4.1-mini-2025-04-14</option>
                        <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                        <option value="gpt-4.1-nano-2025-04-14">gpt-4.1-nano-2025-04-14</option>
                        <option value="gpt-4.1-nano">gpt-4.1-nano</option>
                        <option value="gpt-image-1">gpt-image-1</option>
                        <option value="codex-mini-latest">codex-mini-latest</option>
                        <option value="gpt-4o-realtime-preview-2025-06-03">gpt-4o-realtime-preview-2025-06-03</option>
                        <option value="gpt-4o-audio-preview-2025-06-03">gpt-4o-audio-preview-2025-06-03</option>
                        <option value="o4-mini-deep-research">o4-mini-deep-research</option>
                        <option value="o4-mini-deep-research-2025-06-26">o4-mini-deep-research-2025-06-26</option>
                        <option value="gpt-5-chat-latest">gpt-5-chat-latest</option>
                        <option value="gpt-5-2025-08-07">gpt-5-2025-08-07</option>
                        <option value="gpt-3.5-turbo-16k">gpt-3.5-turbo-16k</option>
                        <option value="tts-1">tts-1</option>
                        <option value="whisper-1">whisper-1</option>
                        <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                      </>
                    ) : (
                      <>
                        <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                        <option value="gemini-1.0-pro">gemini-1.0-pro</option>
                      </>
                    )}
                  </select>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <button onClick={() => setActiveProvider(provider.id)} disabled={profile.settings.activeAiProviderId === provider.id} className="px-4 py-2 text-sm font-medium text-blue-600 disabled:text-slate-400 hover:text-blue-700 transition-colors">
                {profile.settings.activeAiProviderId === provider.id ? 'Active' : 'Set as Active'}
              </button>
              <button onClick={() => removeProvider(index)} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        <button onClick={addProvider} className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium">
          <FiPlus className="w-4 h-4" />
          Add Provider
        </button>
        
      </div>

      <div className="p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FiLock className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Passcode Settings</h2>
        </div>
        <Toggle enabled={profile.settings.passcodeEnabled} onChange={(val) => handleToggleChange('passcodeEnabled', val)} label="Enable Passcode" Icon={profile.settings.passcodeEnabled ? FiToggleRight : FiToggleLeft} />
        
        {profile.settings.passcodeEnabled && (
          <div className="space-y-6 pt-6 border-t border-slate-200">
            <div>
              <label htmlFor="passcode" className="block text-sm font-semibold text-slate-700 mb-2">New Passcode (4 digits):</label>
              <input
                type="password"
                id="passcode"
                maxLength={4}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full p-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="confirmPasscode" className="block text-sm font-semibold text-slate-700 mb-2">Confirm Passcode:</label>
              <input
                type="password"
                id="confirmPasscode"
                maxLength={4}
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                className="w-full p-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="lockoutDelay" className="block text-sm font-semibold text-slate-700 mb-2">Lock after inactivity:</label>
              <select
                id="lockoutDelay"
                value={profile.settings.lockoutDelay}
                onChange={(e) => handleLockoutDelayChange(Number(e.target.value))}
                className="w-full p-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              >
                <option value={0}>Immediately</option>
                <option value={60000}>1 Minute</option>
                <option value={300000}>5 Minutes</option>
                <option value={900000}>15 Minutes</option>
              </select>
            </div>
            {passcodeError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 font-medium">{passcodeError}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button 
          onClick={handleSave} 
          className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <FiSave className="w-5 h-5" />
          Save Settings
        </button>
        <Link to="/privacy" className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors">Privacy Policy</Link>
      </div>
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={modalContent.onConfirm}
        title={modalContent.title}
        message={modalContent.message}
      />
    </div>
  );
};

export default SettingsPage;
