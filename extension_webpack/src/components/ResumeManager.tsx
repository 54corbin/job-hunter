import React, { useState } from 'react';
import SimpleLoadingOverlay from './SimpleLoadingOverlay';
import { UserProfile, Resume, saveUserProfile } from '../services/storageService';
import { extractProfileFromResume, extractKeywordsFromResume } from '../services/llmService';
import { useNotifications } from './NotificationProvider';
import { FiUpload, FiEdit, FiTrash2, FiSave, FiXCircle } from 'react-icons/fi';
import { ConfirmModal } from './ConfirmModal';

declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
  }
}

interface ResumeManagerProps {
  profile: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

const ResumeManager: React.FC<ResumeManagerProps> = ({ profile, onProfileUpdate }) => {
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess, showInfo, showWarning } = useNotifications();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const fileData = event.target.result as string;
        
        if (file.type === 'application/pdf') {
          const script = document.createElement('script');
          script.src = 'scripts/pdf.min.js';
          script.onload = () => {
            const pdfjsLib = window.pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'scripts/pdf.worker.min.js';
            const loadingTask = pdfjsLib.getDocument({ data: atob(fileData.split(',')[1]) });
            loadingTask.promise.then(async (pdf: any) => {
              let text = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map((item: any) => item.str).join(' ');
              }
              processResume(file, fileData, text);
            });
          };
          document.body.appendChild(script);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const script = document.createElement('script');
          script.src = 'scripts/mammoth.browser.min.js';
          script.onload = () => {
            const arrayBuffer = new Uint8Array(atob(fileData.split(',')[1]).split('').map(char => char.charCodeAt(0))).buffer;
            window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
              .then((result: any) => {
                processResume(file, fileData, result.value);
              });
          };
          document.body.appendChild(script);
        } else {
          processResume(file, fileData, '');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const processResume = async (file: File, fileData: string, text: string) => {
    let extractedProfile: any;
    let keywords: string[] = [];

    // Extract profile information
    const profileResult = await extractProfileFromResume(text);
    if ('error' in profileResult) {
      console.error('Failed to extract profile from resume:', profileResult.error);
      showWarning('Profile Extraction Failed', 'Could not extract profile information, but resume was saved.');
      extractedProfile = null;
    } else {
      extractedProfile = profileResult;
    }

    // Extract keywords
    const keywordsResult = await extractKeywordsFromResume(text);
    if ('error' in keywordsResult) {
      console.error('Failed to extract keywords from resume:', keywordsResult.error);
      showWarning('Keyword Extraction Failed', 'Could not extract keywords for job searching.');
      keywords = [];
    } else {
      keywords = keywordsResult;
    }

    const newResume: Resume = {
      id: new Date().toISOString(),
      name: file.name,
      data: fileData,
      text: text,
      parsedInfo: extractedProfile || undefined,
      filters: {
        location: '',
        workType: [],
        daterange: '',
        keywords: keywords,
      }
    };
    
    let updatedProfile = { ...profile };
    if (extractedProfile) {
      updatedProfile = {
        ...updatedProfile,
        personalInfo: extractedProfile.personalInfo || updatedProfile.personalInfo,
        experience: extractedProfile.experience || updatedProfile.experience,
        education: extractedProfile.education || updatedProfile.education,
        skills: extractedProfile.skills || updatedProfile.skills,
      };
    }
    
    const updatedResumes = [...(updatedProfile.resumes || []), newResume];
    updatedProfile.resumes = updatedResumes;

    if (!updatedProfile.settings.activeResumeId) {
      updatedProfile.settings.activeResumeId = newResume.id;
    }
    
    try {
      await saveUserProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      showSuccess('Resume Uploaded', 'Your resume has been uploaded and processed successfully.');
    } catch (error) {
      console.error('Failed to save resume:', error);
      showError('Upload Failed', 'Failed to save your resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = (resume: Resume) => {
    setEditingResumeId(resume.id);
    setNewName(resume.name);
  };

  const handleSaveRename = async (resumeId: string) => {
    const updatedResumes = profile.resumes?.map(r =>
      r.id === resumeId ? { ...r, name: newName } : r
    );
    const updatedProfile = { ...profile, resumes: updatedResumes };
    
    try {
      await saveUserProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      showSuccess('Resume Renamed', 'Resume name has been updated successfully.');
    } catch (error) {
      console.error('Failed to rename resume:', error);
      showError('Rename Failed', 'Failed to rename resume. Please try again.');
    }
    
    setEditingResumeId(null);
    setNewName('');
  };

  const handleSelectResume = async (resumeId: string) => {
    const selectedResume = profile.resumes?.find(r => r.id === resumeId);
    if (selectedResume) {
      try {
        let extractedProfile = selectedResume.parsedInfo;
        let profileToUpdate = { ...profile };

        if (!extractedProfile) {
          const result = await extractProfileFromResume(selectedResume.text);
          
          if (result && typeof result === 'object' && 'error' in result) {
            console.error('Failed to extract profile from resume:', (result as any).error);
            showError('Profile Extraction Failed', (result as any).error.message || 'Failed to extract profile information from resume.');
            extractedProfile = undefined;
          } else {
            extractedProfile = result as any;
          }
          
          const updatedResumes = profile.resumes?.map(r => 
            r.id === resumeId ? { ...r, parsedInfo: extractedProfile } : r
          );
          profileToUpdate = { ...profile, resumes: updatedResumes };
        }

        let finalProfile = { ...profileToUpdate, settings: { ...profileToUpdate.settings, activeResumeId: resumeId } };
        if (extractedProfile) {
          finalProfile = {
            ...finalProfile,
            personalInfo: extractedProfile.personalInfo || finalProfile.personalInfo,
            experience: extractedProfile.experience || finalProfile.experience,
            education: extractedProfile.education || finalProfile.education,
            skills: extractedProfile.skills || finalProfile.skills,
          };
        }
        
        await saveUserProfile(finalProfile);
        onProfileUpdate(finalProfile);
        showSuccess('Resume Selected', 'Resume has been set as active and profile updated.');
      } catch (error) {
        console.error('Failed to select resume:', error);
        showError('Selection Failed', 'Failed to select resume. Please try again.');
      }
    }
  };

  const handleDelete = (resumeId: string) => {
    setResumeToDelete(resumeId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (resumeToDelete) {
      try {
        const updatedResumes = profile.resumes?.filter(r => r.id !== resumeToDelete);
        const updatedProfile = { ...profile, resumes: updatedResumes };

        if (profile.settings.activeResumeId === resumeToDelete) {
          if (updatedResumes && updatedResumes.length === 1) {
            updatedProfile.settings.activeResumeId = updatedResumes[0].id;
          } else {
            updatedProfile.settings.activeResumeId = undefined;
          }
        }

        await saveUserProfile(updatedProfile);
        onProfileUpdate(updatedProfile);
        showSuccess('Resume Deleted', 'Resume has been removed successfully.');
        
        setResumeToDelete(null);
        setIsConfirmModalOpen(false);
      } catch (error) {
        console.error('Failed to delete resume:', error);
        showError('Delete Failed', 'Failed to delete resume. Please try again.');
      }
    }
  };

  return (
    <>
      {loading && <SimpleLoadingOverlay message="Processing your resume..." />}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Resume"
        message="Are you sure you want to delete this resume? This action cannot be undone."
      />
      <section className="p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 text-slate-700">Manage Resumes</h3>
        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300 cursor-pointer">
            <FiUpload className="mr-2" />
            <span>Upload New Resume</span>
            <input type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
        <div className="space-y-2">
          {profile.resumes?.map(resume => (
            <div key={resume.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              {editingResumeId === resume.id ? (
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="p-1 border border-slate-300 rounded-lg"
                />
              ) : (
                <>
                  <span className="text-slate-700">{resume.name}</span>
                  {profile.settings.activeResumeId === resume.id && (
                    <span className="ml-2 px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Default</span>
                  )}
                </>
              )}
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  name="selectedResume"
                  checked={profile.settings.activeResumeId === resume.id}
                  onChange={() => handleSelectResume(resume.id)}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                {editingResumeId === resume.id ? (
                  <>
                    <button onClick={() => handleSaveRename(resume.id)} className="p-2 text-green-500 hover:text-green-700"><FiSave size={20} /></button>
                    <button onClick={() => setEditingResumeId(null)} className="p-2 text-red-500 hover:text-red-700"><FiXCircle size={20} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleRename(resume)} className="p-2 text-blue-500 hover:text-blue-700"><FiEdit size={20} /></button>
                  </>
                )}
                <button onClick={() => handleDelete(resume.id)} className="p-2 text-red-500 hover:text-red-700"><FiTrash2 size={20} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default ResumeManager;