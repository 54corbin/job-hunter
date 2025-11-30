import CryptoJS from 'crypto-js';
import { handleServiceError } from './errorService';

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
  };
}

// ... (encryption/decryption functions remain the same) ...

export const getUserProfile = (): Promise<UserProfile | null> => {
  return new Promise((resolve) => {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["userProfile"], (result) => {
        if (result.userProfile) {
          const profile: UserProfile = result.userProfile;

          // Ensure resumes array exists
          if (!profile.resumes) {
            profile.resumes = [];
          }

          resolve(profile);
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
        settings: { passcodeEnabled: false, apiProviders: [] },
      });
    }
  });
};

export const saveUserProfile = (data: UserProfile): Promise<void> => {
  return new Promise((resolve) => {
    if (chrome && chrome.storage && chrome.storage.local) {
      const profileToSave = { ...data };

      if (profileToSave.settings?.passcodeEnabled && profileToSave.settings.passcode) {
        profileToSave.settings.passcodeHash = CryptoJS.SHA256(profileToSave.settings.passcode).toString();
      } else if (!profileToSave.settings?.passcodeEnabled) {
        delete profileToSave.settings.passcodeHash;
      }
      delete profileToSave.settings.passcode;

      chrome.storage.local.set({ userProfile: profileToSave }, () => {
        resolve();
      });
    } else {
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
  return new Promise((resolve) => {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ jobLists: {} }, (result) => {
        const jobs = result.jobLists[resumeId] || [];
        resolve(ensureJobIds(jobs));
      });
    } else {
      console.warn("chrome.storage.local is not available. Mocking get jobs.");
      resolve([]);
    }
  });
};

export const saveJobsForResume = (resumeId: string, jobs: any[]): Promise<void> => {
  return new Promise((resolve) => {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ jobLists: {} }, (result) => {
        const jobsWithIds = ensureJobIds(jobs);
        const newJobLists = { ...result.jobLists, [resumeId]: jobsWithIds };
        chrome.storage.local.set({ jobLists: newJobLists }, () => {
          resolve();
        });
      });
    } else {
      console.warn("chrome.storage.local is not available. Mocking save jobs.");
      resolve();
    }
  });
};

