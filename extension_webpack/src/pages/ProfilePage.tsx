import React, { useEffect, useState } from 'react';
import { getUserProfile, saveUserProfile, UserProfile } from '../services/storageService';
import { useNotifications } from '../components/NotificationProvider';
import { FiPlus, FiTrash2, FiUser, FiMail, FiPhone, FiBriefcase, FiBookOpen, FiAward } from 'react-icons/fi';
import ResumeManager from '../components/ResumeManager';

const defaultProfile: UserProfile = {
  personalInfo: { name: '', email: '', phone: '' },
  experience: [],
  education: [],
  skills: [],
  resumes: [],
  settings: {
    passcodeEnabled: false,
    apiProviders: [],
  }
};

const mergeProfiles = (base: UserProfile, incoming: Partial<UserProfile>): UserProfile => {
  const merged = { ...base, ...incoming };
  merged.personalInfo = { ...base.personalInfo, ...(incoming?.personalInfo || {}) };
  merged.experience = incoming?.experience && incoming.experience.length > 0 ? incoming.experience : base.experience;
  merged.education = incoming?.education && incoming.education.length > 0 ? incoming.education : base.education;
  merged.skills = incoming?.skills && incoming.skills.length > 0 ? incoming.skills : base.skills;
  merged.resumes = incoming?.resumes && incoming.resumes.length > 0 ? incoming.resumes : base.resumes;
  return merged;
};

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showError, showSuccess } = useNotifications();

  useEffect(() => {
    getUserProfile().then(storedProfile => {
      setProfile(mergeProfiles(defaultProfile, storedProfile || {}));
    }).catch(error => {
      console.error("Failed to load profile:", error);
      showError('Load Failed', 'Failed to load your profile. Please refresh the page.');
    });
  }, []);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(mergeProfiles(profile || defaultProfile, updatedProfile));
  };

  const handleInputChange = (value: any, section: keyof UserProfile | 'personalInfo' | 'experience' | 'education', index: number | null, field: string) => {
    setProfile(prevProfile => {
      if (!prevProfile) return null;
      const newProfile = { ...prevProfile };
      if (section === 'personalInfo' || section === 'experience' || section === 'education') {
        if (index !== null && Array.isArray(newProfile[section])) {
          (newProfile[section] as any[])[index][field] = value;
        } else {
          (newProfile as any)[section] = { ...(newProfile as any)[section], [field]: value };
        }
      } else {
        (newProfile as any)[field] = value;
      }
      
      saveUserProfile(newProfile).then(() => {
        showSuccess('Profile Updated', 'Your changes have been saved successfully.');
      }).catch(error => {
        console.error("Failed to save profile:", error);
        showError('Save Failed', 'Failed to save your profile changes. Please try again.');
      });
      
      return newProfile;
    });
  };

  const addEntry = (section: 'experience' | 'education') => {
    setProfile(prevProfile => {
      if (!prevProfile) return null;
      const newProfile = { ...prevProfile };
      const newEntry = section === 'experience' ? { company: '', title: '' } : { institution: '', degree: '' };
      (newProfile[section] as any[]).push(newEntry);
      
      saveUserProfile(newProfile).then(() => {
        showSuccess('Entry Added', `New ${section} entry has been added.`);
      }).catch(error => {
        console.error("Failed to save new entry:", error);
        showError('Save Failed', 'Failed to add new entry. Please try again.');
      });
      
      return newProfile;
    });
  };

  const removeEntry = (section: 'experience' | 'education', index: number) => {
    setProfile(prevProfile => {
      if (!prevProfile) return null;
      const newProfile = { ...prevProfile };
      (newProfile[section] as any[]).splice(index, 1);
      
      saveUserProfile(newProfile).then(() => {
        showSuccess('Entry Removed', `${section} entry has been removed.`);
      }).catch(error => {
        console.error("Failed to remove entry:", error);
        showError('Remove Failed', 'Failed to remove entry. Please try again.');
      });
      
      return newProfile;
    });
  };

  if (!profile) {
    return <div className="flex justify-center items-center h-full text-2xl font-semibold text-slate-500">Loading Profile...</div>;
  }

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-4xl font-bold text-slate-800">Profile Management</h2>

      <ResumeManager profile={profile} onProfileUpdate={handleProfileUpdate} />

      <section className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 text-slate-700">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiUser className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Name" value={profile.personalInfo?.name || ''} onChange={(e) => handleInputChange(e.target.value, 'personalInfo', null, 'name')} className="pl-10 p-3 w-full bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
          </div>
          <div className="relative">
            <FiMail className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input type="email" placeholder="Email" value={profile.personalInfo?.email || ''} onChange={(e) => handleInputChange(e.target.value, 'personalInfo', null, 'email')} className="pl-10 p-3 w-full bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
          </div>
          <div className="relative">
            <FiPhone className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input type="tel" placeholder="Phone" value={profile.personalInfo?.phone || ''} onChange={(e) => handleInputChange(e.target.value, 'personalInfo', null, 'phone')} className="pl-10 p-3 w-full bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
          </div>
        </div>
      </section>

      <section className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 text-slate-700">Work Experience</h3>
        <div className="space-y-4">
          {profile.experience?.map((exp, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                <div className="relative col-span-3">
                  <FiBriefcase className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Company" value={exp.company || ''} onChange={(e) => handleInputChange(e.target.value, 'experience', index, 'company')} className="pl-10 p-3 w-full bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
                </div>
                <div className="relative col-span-3">
                  <FiAward className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Title" value={exp.title || ''} onChange={(e) => handleInputChange(e.target.value, 'experience', index, 'title')} className="pl-10 p-3 w-full bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
                </div>
                <button onClick={() => removeEntry('experience', index)} className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors flex justify-center items-center shadow-md"><FiTrash2 /></button>
              </div>
              <div className="mt-4">
                <textarea placeholder="Summary of your role and achievements..." value={exp.summary || ''} onChange={(e) => handleInputChange(e.target.value, 'experience', index, 'summary')} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" rows={3} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => addEntry('experience')} className="mt-4 flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"><FiPlus className="mr-2" />Add Experience</button>
      </section>

      <section className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 text-slate-700">Education</h3>
        <div className="space-y-4">
          {profile.education?.map((edu, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
              <div className="relative col-span-3">
                <FiBookOpen className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Institution" value={edu.institution || ''} onChange={(e) => handleInputChange(e.target.value, 'education', index, 'institution')} className="pl-10 p-3 w-full bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
              </div>
              <div className="relative col-span-3">
                <FiAward className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Degree" value={edu.degree || ''} onChange={(e) => handleInputChange(e.target.value, 'education', index, 'degree')} className="pl-10 p-3 w-full bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
              </div>
              <button onClick={() => removeEntry('education', index)} className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-colors flex justify-center items-center shadow-md"><FiTrash2 /></button>
            </div>
          ))}
        </div>
        <button onClick={() => addEntry('education')} className="mt-4 flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"><FiPlus className="mr-2" />Add Education</button>
      </section>

      <section className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 text-slate-700">Skills</h3>
        <textarea placeholder="Enter skills, separated by commas" value={profile.skills?.join(', ') || ''} onChange={(e) => handleInputChange(e.target.value.split(',').map(s => s.trim()), 'skills', null, 'skills')} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" rows={4} />
      </section>
    </div>
  );
};

export default ProfilePage;
