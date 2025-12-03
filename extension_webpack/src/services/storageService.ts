import CryptoJS from 'crypto-js';
import { handleServiceError } from './errorService';
import { encryptionService, encryptForStorage, decryptFromStorage, EncryptedStorageData } from './encryptionService';

const ENCRYPTION_KEY = 'your-super-secret-key'; // In a real app, this should be managed more securely.

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  gender?: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  summary: string;
  responsibilities: string[];
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationDate: string;
}

export interface JobSearchFilters {
  location: string;
  workType: string[];
  daterange: string;
  keywords?: string[];
}

export interface Resume {
  id: string;
  name: string;
  data?: string; // Base64 encoded resume data
  text: string; // Extracted plain text
  parsedInfo?: {
    personalInfo?: PersonalInfo;
    experience?: WorkExperience[];
    education?: Education[];
    skills?: string[];
  };
  filters?: JobSearchFilters;
}

export interface ApiProvider {
  id: string;
  name: 'OpenAI' | 'Gemini' | 'Ollama';
  apiKey: string;
  model: string;
}

export interface UserProfile {
  personalInfo: PersonalInfo;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  resumes?: Resume[];
  settings: {
    passcodeEnabled: boolean;
    passcodeHash?: string;
    lockoutDelay?: number;
    lastActiveTime?: number;
    passcode?: string; // Plaintext passcode, should be removed before saving
    activeAiProviderId?: string;
    apiProviders?: ApiProvider[];
    activeResumeId?: string;
    encryptionEnabled?: boolean;
    encryptionVersion?: string;
    lastEncryptionCheck?: number;
  };
}

// ... (encryption/decryption functions remain the same) ...

export const getUserProfile = (): Promise<UserProfile | null> => {
  return new Promise(async (resolve) => {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["userProfile"], async (result) => {
        if (result.userProfile) {
          try {
            let profile: UserProfile;
            
            // Check if data is encrypted
            if (result.userProfile.encryptedProfile) {
              // Check if we have encryption setup (passcode available)
              const setupStatus = await encryptionService.getEncryptionSetupStatus();
              
              if (setupStatus.keyAvailable) {
                // Decrypt the profile data
                const decryptedJson = await decryptFromStorage(result.userProfile.encryptedProfile);
                profile = JSON.parse(decryptedJson);
                
                // Update encryption status
                if (!profile.settings) profile.settings = {
                  passcodeEnabled: true,
                  apiProviders: [],
                  encryptionEnabled: true,
                  encryptionVersion: result.userProfile.encryptedProfile.version,
                  lastEncryptionCheck: Date.now()
                };
                profile.settings.encryptionEnabled = true;
                profile.settings.encryptionVersion = result.userProfile.encryptedProfile.version;
                profile.settings.lastEncryptionCheck = Date.now();
              } else {
                // Encryption setup incomplete - cannot access data
                console.warn('Encryption setup incomplete, cannot access profile data');
                resolve(null);
                return;
              }
            } else {
              // Legacy unencrypted data
              profile = result.userProfile;
              if (!profile.settings) profile.settings = {
                passcodeEnabled: false,
                apiProviders: [],
                encryptionEnabled: false,
                encryptionVersion: undefined,
                lastEncryptionCheck: undefined
              };
              profile.settings.encryptionEnabled = false;
            }

            // Ensure resumes array exists
            if (!profile.resumes) {
              profile.resumes = [];
            }

            resolve(profile);
          } catch (error) {
            console.error('Failed to decrypt or parse profile:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    } else {
      // Mock data for environments where storage is not available
      console.warn("chrome.storage.local is not available. Using mock data.");
      resolve({
        personalInfo: { name: "John Doe", email: "john.doe@example.com", phone: "123-456-7890" },
        experience: [],
        education: [],
        skills: [],
        resumes: [],
        settings: { 
          passcodeEnabled: false, 
          apiProviders: [],
          encryptionEnabled: false,
          encryptionVersion: undefined,
          lastEncryptionCheck: undefined
        },
      });
    }
  });
};

export const saveUserProfile = (data: UserProfile): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (chrome && chrome.storage && chrome.storage.local) {
      const profileToSave = { ...data };

      // Extract passcode for encryption before processing
      let passcodeForEncryption: string | null = null;
      if (profileToSave.settings?.passcodeEnabled && profileToSave.settings.passcode) {
        profileToSave.settings.passcodeHash = CryptoJS.SHA256(profileToSave.settings.passcode).toString();
        passcodeForEncryption = profileToSave.settings.passcode;
      } else if (!profileToSave.settings?.passcodeEnabled) {
        delete profileToSave.settings.passcodeHash;
      }
      delete profileToSave.settings.passcode;

      try {
        // Check if encryption is available and enabled
        if (encryptionService.isEncryptionAvailable()) {
          // Set passcode context for encryption operations
          if (passcodeForEncryption) {
            encryptionService.setPasscodeContext(passcodeForEncryption);
          }

          // Check if we have a passcode for encryption
          const setupStatus = await encryptionService.getEncryptionSetupStatus();
          
          if (setupStatus.keyAvailable) {
            // Use passcode-based encryption
            const profileJson = JSON.stringify(profileToSave);
            const encryptedProfile = await encryptForStorage(profileJson);
            
            // Save encrypted data with metadata
            const storageData = {
              encryptedProfile: encryptedProfile,
              encryptionEnabled: true,
              lastEncryptionCheck: Date.now()
            };
            
            chrome.storage.local.set({ userProfile: storageData }, () => {
              // Clear passcode context after save
              encryptionService.setPasscodeContext(null);
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          } else {
            // No passcode available for encryption - save unencrypted
            console.warn('No passcode available for encryption, saving unencrypted');
            profileToSave.settings.encryptionEnabled = false;
            encryptionService.setPasscodeContext(null);
            chrome.storage.local.set({ userProfile: profileToSave }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          }
        } else {
          // Fallback to unencrypted storage if encryption not available
          console.warn('Encryption not available, storing data unencrypted');
          profileToSave.settings.encryptionEnabled = false;
          encryptionService.setPasscodeContext(null);
          chrome.storage.local.set({ userProfile: profileToSave }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        }
      } catch (error) {
        console.error('Encryption failed:', error);
        
        // Clear passcode context on error
        encryptionService.setPasscodeContext(null);
        
        // Show specific error for setup requirement
        if (error instanceof Error && error.message === 'PASSCODE_REQUIRED_FOR_ENCRYPTION') {
          reject(error);
          return;
        }
        
        // Fallback to unencrypted storage
        console.warn('Falling back to unencrypted storage due to encryption error');
        profileToSave.settings.encryptionEnabled = false;
        chrome.storage.local.set({ userProfile: profileToSave }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      }
    } else {
      // Mock data for environments where storage is not available
      console.warn("chrome.storage.local is not available. Mocking save.");
      resolve();
    }
  });
};

// ... (updateProfileField and trackApplication remain the same) ...

// Helper function to ensure jobs have unique IDs
const ensureJobIds = (jobs: any[]): any[] => {
  return jobs.map(job => {
    if (!job.id) {
      const jobId = job.url ? 
        btoa(job.url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16) :
        btoa(`${job.title}-${job.company}-${job.url || ''}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      return { ...job, id: jobId };
    }
    return job;
  });
};

export const getJobsForResume = (resumeId: string): Promise<any[]> => {
  return new Promise(async (resolve) => {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ jobLists: {} }, async (result) => {
        try {
          const jobsData = result.jobLists[resumeId];
          if (!jobsData) {
            resolve([]);
            return;
          }

          let jobs: any[];
          
          // Check if jobs data is encrypted
          if (jobsData.encryptedJobs) {
            // Check encryption setup status (passcode available)
            const setupStatus = await encryptionService.getEncryptionSetupStatus();
            
            if (setupStatus.keyAvailable) {
              const decryptedJson = await decryptFromStorage(jobsData.encryptedJobs);
              jobs = JSON.parse(decryptedJson);
            } else {
              // Encryption setup incomplete - cannot access job data
              console.warn('Encryption setup incomplete, cannot access job data');
              resolve([]);
              return;
            }
          } else {
            // Legacy unencrypted data
            jobs = jobsData.jobs || [];
          }

          resolve(ensureJobIds(jobs));
        } catch (error) {
          console.error('Failed to decrypt jobs data:', error);
          resolve([]);
        }
      });
    } else {
      console.warn("chrome.storage.local is not available. Mocking get jobs.");
      resolve([]);
    }
  });
};

export const saveJobsForResume = (resumeId: string, jobs: any[]): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ jobLists: {} }, async (result) => {
        try {
          const jobsWithIds = ensureJobIds(jobs);
          let jobsStorageData;
          
          // Check encryption setup status
          const setupStatus = await encryptionService.getEncryptionSetupStatus();
          
          if (setupStatus.keyAvailable) {
            // Use passcode-based encryption
            const jobsJson = JSON.stringify(jobsWithIds);
            const encryptedJobs = await encryptForStorage(jobsJson);
            
            jobsStorageData = {
              encryptedJobs: encryptedJobs,
              encryptionEnabled: true,
              timestamp: Date.now()
            };
          } else {
            // No passcode available - save unencrypted
            console.warn('No passcode available for job encryption, saving unencrypted');
            jobsStorageData = {
              jobs: jobsWithIds,
              encryptionEnabled: false,
              timestamp: Date.now()
            };
          }
          
          const newJobLists = { ...result.jobLists, [resumeId]: jobsStorageData };
          chrome.storage.local.set({ jobLists: newJobLists }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        } catch (error) {
          console.error('Failed to encrypt jobs data:', error);
          
          // Show specific error for setup requirement
          if (error instanceof Error && error.message === 'PASSCODE_REQUIRED_FOR_ENCRYPTION') {
            reject(error);
            return;
          }
          
          // Fallback to unencrypted storage
          const jobsWithIds = ensureJobIds(jobs);
          const newJobLists = { ...result.jobLists, [resumeId]: { jobs: jobsWithIds, encryptionEnabled: false, timestamp: Date.now() } };
          chrome.storage.local.set({ jobLists: newJobLists }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        }
      });
    } else {
      console.warn("chrome.storage.local is not available. Mocking save jobs.");
      resolve();
    }
  });
};

/**
 * Encryption utility functions
 */
export const checkEncryptionStatus = async (): Promise<{
  isAvailable: boolean;
  isEnabled: boolean;
  isValid: boolean;
  version?: string;
}> => {
  try {
    const isAvailable = encryptionService.isEncryptionAvailable();
    
    if (!isAvailable) {
      return {
        isAvailable: false,
        isEnabled: false,
        isValid: false
      };
    }

    // Check current profile encryption status first
    const profile = await getUserProfile();
    const passcodeEnabled = profile?.settings?.passcodeEnabled || false;
    const version = profile?.settings?.encryptionVersion;

    // Only consider encryption enabled if passcode is actually enabled
    const isEnabled = passcodeEnabled;

    // Only validate if passcode is enabled - otherwise return true (not an error)
    let isValid = true;
    if (passcodeEnabled) {
      // If passcode is enabled, validate that encryption actually works
      isValid = await encryptionService.validateEncryption();
    }

    return {
      isAvailable: true,
      isEnabled,
      isValid,
      version
    };
  } catch (error) {
    console.error('Failed to check encryption status:', error);
    return {
      isAvailable: false,
      isEnabled: false,
      isValid: false
    };
  }
};

export const migrateToEncryption = async (): Promise<boolean> => {
  try {
    const profile = await getUserProfile();
    if (!profile) return false;

    // Check if we have a passcode for encryption
    const setupStatus = await encryptionService.getEncryptionSetupStatus();
    
    if (!setupStatus.keyAvailable) {
      // No passcode available - cannot migrate
      console.warn('No passcode available for encryption migration');
      return false;
    }

    // Force re-save with encryption
    await saveUserProfile(profile);
    
    // Migrate all job data
    if (profile.resumes) {
      for (const resume of profile.resumes) {
        const jobs = await getJobsForResume(resume.id);
        if (jobs.length > 0) {
          await saveJobsForResume(resume.id, jobs);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to migrate to encryption:', error);
    throw error; // Re-throw to handle in UI
  }
};

export const clearEncryptionKeys = (): void => {
  encryptionService.clearMasterKey();
  console.log('Encryption keys cleared from session storage');
};

