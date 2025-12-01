import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiExternalLink, FiMapPin, FiFileText, FiLoader, FiMail, FiPlus, FiTrash2 } from 'react-icons/fi';
import { getUserProfile, UserProfile, Resume, getJobsForResume, saveUserProfile } from '../services/storageService';
import { fetchLocationSuggestions, LocationSuggestion } from '../services/seekService';
import { useNotifications } from '../components/NotificationProvider';

import ResumeReviewModal from '../components/ResumeReviewModal';
import CoverLetterReviewModal from '../components/CoverLetterReviewModal';
import ProgressButton from '../components/ProgressButton';

const ensureJobId = (job: any): any => {
  if (!job.id) {
    const jobId = job.url || `${job.title}-${job.company}`;
    return { ...job, id: jobId };
  }
  return job;
};

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [jobsSavedCount, setJobsSavedCount] = useState(0);
  const [generatingAction, setGeneratingAction] = useState<{ jobId: string; type: 'resume' | 'coverLetter' } | null>(null);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isCoverLetterReviewModalOpen, setCoverLetterReviewModalOpen] = useState(false);
  const [generatedResumeText, setGeneratedResumeText] = useState('');
  const [generatedCoverLetterText, setGeneratedCoverLetterText] = useState('');
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [daterange, setDaterange] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  const navigate = useNavigate();
  const { showError, showSuccess, showWarning, showInfo } = useNotifications();

  const workTypesMap: { [key: string]: string } = {
    "Full-time": "242",
    "Part-time": "243",
    "Contract/Temp": "244",
    "Casual/Vacation": "245",
  };

  const dateRanges: { [key: string]: number } = {
    "Today": 1,
    "Last 3 days": 3,
    "Last 7 days": 7,
    "Last 14 days": 14,
  };

  const handleWorkTypeChange = (workTypeCode: string) => {
    setSelectedWorkTypes(prev =>
      prev.includes(workTypeCode)
        ? prev.filter(code => code !== workTypeCode)
        : [...prev, workTypeCode]
    );
  };

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleAddKeyword = async () => {
    if (newKeyword && selectedResumeId && profile?.resumes) {
      const updatedResumes = profile.resumes.map(r => {
        if (r.id === selectedResumeId) {
          const updatedKeywords = [...(r.filters?.keywords || []), newKeyword];
          // Also add to selected keywords for immediate feedback
          setSelectedKeywords(prev => [...prev, newKeyword]);
          return { ...r, filters: { ...(r.filters || { location: '', workType: [], daterange: '' }), keywords: updatedKeywords } };
        }
        return r;
      });
      const updatedProfile = { ...profile, resumes: updatedResumes };
      setProfile(updatedProfile);
      await saveUserProfile(updatedProfile);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = async (keywordToRemove: string) => {
    if (selectedResumeId && profile?.resumes) {
      const updatedResumes = profile.resumes.map(r => {
        if (r.id === selectedResumeId) {
          const updatedKeywords = (r.filters?.keywords || []).filter(k => k !== keywordToRemove);
          return { ...r, filters: { ...(r.filters || { location: '', workType: [], daterange: '' }), keywords: updatedKeywords } };
        }
        return r;
      });
      const updatedProfile = { ...profile, resumes: updatedResumes };
      setProfile(updatedProfile);
      await saveUserProfile(updatedProfile);
      setSelectedKeywords(prev => prev.filter(k => k !== keywordToRemove));
    }
  };

  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const fetchJobsForTab = useCallback(async (resumeId: string) => {
    const jobsForResume = await getJobsForResume(resumeId);
    setJobs(jobsForResume.sort((a, b) => b.score - a.score));
  }, []);

  useEffect(() => {
    getUserProfile().then(profile => {
      setProfile(profile);
      const activeResumeId = profile?.settings?.activeResumeId;
      const firstResumeId = profile?.resumes?.[0]?.id;
      const initialResumeId = activeResumeId || firstResumeId;
      if (initialResumeId) {
        setSelectedResumeId(initialResumeId);
        fetchJobsForTab(initialResumeId);

        const initialResume = profile.resumes?.find(r => r.id === initialResumeId);
        if (initialResume?.filters) {
          setLocation(initialResume.filters.location || '');
          setSelectedWorkTypes(initialResume.filters.workType || []);
          setDaterange(initialResume.filters.daterange || '');
          setSelectedKeywords(initialResume.filters.keywords || []);
        }
      }
      setIsProfileLoading(false);
    });

    const messageListener = (message: any) => {
      if (message.type === "JOB_MATCHING_PROGRESS") {
        setIsMatching(true);
        setMatchingProgress(message.progress);
      } else if (message.type === "NEW_JOB_SCORED") {
        // Increment the count when a new job is saved
        setJobsSavedCount(prev => prev + 1);
        setJobs(prevJobs => [...prevJobs, ensureJobId(message.job)].sort((a, b) => b.score - a.score));
      } else if (message.type === "JOB_MATCHING_COMPLETE") {
        setIsMatching(false);
        setMatchingProgress(0);
      } else if (message.type === "JOB_MATCHING_FAILURE") {
        setIsMatching(false);
        setMatchingProgress(0);
        setJobsSavedCount(0); // Reset count on failure
        showError(
          'Job Search Failed',
          message.error || 'An error occurred while searching for jobs. Please try again.',
          {
            action: {
              label: 'Retry',
              onClick: handleDiscoverJobs,
            },
            duration: 8000,
          }
        );
      } else if (message.type === "JOB_MATCHING_PARTIAL") {
        setIsMatching(false);
        setMatchingProgress(0);
        showWarning(
          'Partial Results',
          message.message || 'Some jobs failed to score, but found valid matches.',
          { duration: 6000 }
        );
      } else if (message.type === "JOB_MATCHING_SUCCESS") {
        setIsMatching(false);
        setMatchingProgress(0);
        showSuccess(
          'Jobs Saved Successfully',
          message.message || 'Job search completed successfully!',
          { duration: 4000 }
        );
      } else if (message.type === "RESUME_GENERATION_COMPLETE") {
        setGeneratingAction(prev => (message.job && prev?.jobId === message.job.id ? null : prev));
      } else if (message.type === "RESUME_GENERATION_SUCCESS") {
        setGeneratingAction(prev => (message.job && prev?.jobId === message.job.id ? null : prev));
        setGeneratedResumeText(message.resumeText);
        setReviewModalOpen(true);

        if (selectedResumeId && message.job) {
          const cacheKey = `generated-resume-${selectedResumeId}-${message.job.id}`;
          chrome.storage.local.set({ [cacheKey]: message.resumeText });
        }
      } else if (message.type === "RESUME_GENERATION_FAILURE") {
        setGeneratingAction(prev => (message.job && prev?.jobId === message.job.id ? null : prev));
        showError(
          'Resume Generation Failed',
          message.error || 'Failed to generate resume. Please check your AI provider configuration.',
          {
            action: {
              label: 'Go to Settings',
              onClick: () => navigate('/settings'),
            },
            duration: 8000,
          }
        );
      } else if (message.type === "COVER_LETTER_GENERATION_SUCCESS") {
        setGeneratingAction(prev => (message.job && prev?.jobId === message.job.id ? null : prev));
        setGeneratedCoverLetterText(message.coverLetter);
        setCoverLetterReviewModalOpen(true);
      } else if (message.type === "COVER_LETTER_GENERATION_FAILURE") {
        setGeneratingAction(prev => (message.job && prev?.jobId === message.job.id ? null : prev));
        showError(
          'Cover Letter Generation Failed',
          message.error || 'Failed to generate cover letter. Please check your AI provider configuration.',
          {
            action: {
              label: 'Go to Settings',
              onClick: () => navigate('/settings'),
            },
            duration: 8000,
          }
        );
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, [fetchJobsForTab, selectedResumeId]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (location) {
        const suggestions = await fetchLocationSuggestions(location);
        if (suggestions.length === 1 && suggestions[0].text === location) {
          setLocationSuggestions([]);
        } else {
          setLocationSuggestions(suggestions);
        }
      } else {
        setLocationSuggestions([]);
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [location]);

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.text);
    setLocationSuggestions([]); // Hide suggestions after selection
  };

  const handleDiscoverJobs = async () => {
    if (selectedResumeId && profile) {
      setJobs([]); // Clear existing jobs
      setIsMatching(true);
      setMatchingProgress(0);
      setJobsSavedCount(0); // Reset jobs saved count

      const updatedResumes = profile.resumes?.map(r => {
        if (r.id === selectedResumeId) {
          const currentKeywords = r.filters?.keywords || [];
          return { ...r, filters: { keywords: currentKeywords, location, workType: selectedWorkTypes, daterange } };
        }
        return r;
      });

      if (updatedResumes) {
        const updatedProfile = { ...profile, resumes: updatedResumes };
        setProfile(updatedProfile);
        await saveUserProfile(updatedProfile);
      }

      chrome.runtime.sendMessage({
        type: "FETCH_JOBS_FROM_SEEK",
        resumeId: selectedResumeId,
        filters: {
          keywords: selectedKeywords,
          location,
          workType: selectedWorkTypes,
          daterange: daterange ? Number(daterange) : undefined,
        },
      });
    }
  };

  const handleCancel = () => {
    setIsMatching(false);
    chrome.runtime.sendMessage({ type: "CANCEL_JOB_FETCH" });
  };

  const handleGenerateCoverLetter = (job: any) => {
    if (selectedResumeId) {
      setGeneratingAction({ jobId: job.id, type: 'coverLetter' });
      chrome.runtime.sendMessage({
        type: "GENERATE_COVER_LETTER_FOR_JOB",
        job,
        resumeId: selectedResumeId,
      });
    }
  };

  const handleGenerateResume = async (job: any) => {
    if (selectedResumeId) {
      setCurrentJob(job);
      const cacheKey = `generated-resume-${selectedResumeId}-${job.id}`;
      const cachedResume = await chrome.storage.local.get(cacheKey);

      if (cachedResume[cacheKey]) {
        setGeneratedResumeText(cachedResume[cacheKey]);
        setReviewModalOpen(true);
      } else {
        setGeneratingAction({ jobId: job.id, type: 'resume' });
        chrome.runtime.sendMessage({
          type: "GENERATE_RESUME_FOR_JOB",
          job,
          resumeId: selectedResumeId,
        });
      }
    }
  };

  const handleDownloadResume = () => {
    chrome.runtime.sendMessage({
      type: "DOWNLOAD_RESUME",
      resumeText: generatedResumeText,
      jobTitle: currentJob.title
    });
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedCoverLetterText);
    setCoverLetterReviewModalOpen(false);
  };

  const handleResumeTabClick = async (resumeId: string) => {
    setSelectedResumeId(resumeId);
    fetchJobsForTab(resumeId);

    if (profile) {
      const selectedResume = profile.resumes?.find(r => r.id === resumeId);
      if (selectedResume?.filters) {
        setLocation(selectedResume.filters.location || '');
        setSelectedWorkTypes(selectedResume.filters.workType || []);
        setDaterange(selectedResume.filters.daterange || '');
        setSelectedKeywords(selectedResume.filters.keywords || []);
      } else {
        setLocation('');
        setSelectedWorkTypes([]);
        setDaterange('');
        setSelectedKeywords([]);
      }

      const updatedProfile = {
        ...profile,
        settings: {
          ...profile.settings,
          activeResumeId: resumeId,
        },
      };
      setProfile(updatedProfile);
      await saveUserProfile(updatedProfile);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 85) return 'from-green-400 to-cyan-500';
    if (score > 70) return 'from-blue-400 to-cyan-400';
    return 'from-yellow-400 to-orange-500';
  };

  return (
    <div className="space-y-8">
      
      <ResumeReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onDownload={handleDownloadResume}
        resumeText={generatedResumeText}
      />
      <CoverLetterReviewModal
        isOpen={isCoverLetterReviewModalOpen}
        onClose={() => setCoverLetterReviewModalOpen(false)}
        onCopy={handleCopyToClipboard}
        coverLetterText={generatedCoverLetterText}
      />
      {isProfileLoading ? (
        <div className="text-center p-12 bg-white/80 rounded-3xl shadow-xl backdrop-blur-lg">
          <h3 className="text-3xl font-semibold text-slate-700">Loading Profile...</h3>
        </div>
      ) : (
        <>
          {profile && profile.resumes && profile.resumes.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
              {/* Compact Filter Header */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Job Search Filters</h2>
                <p className="text-sm text-slate-600 mt-1">Customize your job search preferences</p>
              </div>

              {/* Main Filter Content */}
              <div className="p-6">
                {/* Primary Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Location Filter */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <FiMapPin className="inline mr-1" size={16} />
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="Melbourne, VIC"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-lg border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    {locationSuggestions.length > 0 && (
                      <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {locationSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="p-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Date Posted
                    </label>
                    <select
                      value={daterange}
                      onChange={(e) => setDaterange(e.target.value)}
                      className="w-full rounded-lg border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                      <option value="">Any time</option>
                      {Object.entries(dateRanges).map(([name, value]) => (
                        <option key={value} value={value}>{name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Work Types Filter */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Work Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(workTypesMap).map(([name, code]) => (
                        <button
                          key={code}
                          onClick={() => handleWorkTypeChange(code)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                            selectedWorkTypes.includes(code)
                              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Keywords Section */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-slate-700">
                      Keywords ({selectedKeywords.length})
                    </label>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="text"
                        placeholder="Add keyword"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                        className="w-32 rounded-md border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        onClick={handleAddKeyword}
                        className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-md p-1 shadow-sm hover:shadow-md transition-all"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {selectedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedKeywords.map(keyword => (
                        <div key={keyword} className="group relative">
                          <button
                            onClick={() => handleKeywordToggle(keyword)}
                            className="px-2 py-1 rounded-l-md text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                          >
                            {keyword}
                          </button>
                          <button
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="px-1 py-1 rounded-r-md text-xs bg-blue-600 text-white hover:bg-red-500 transition-colors"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resume Selection & Action */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4 border-t border-slate-200">
                  <nav className="flex items-center gap-x-4" aria-label="Tabs">
                    <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Resume:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.resumes.map(resume => (
                        <button
                          key={resume.id}
                          onClick={() => handleResumeTabClick(resume.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedResumeId === resume.id
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {resume.name}
                        </button>
                      ))}
                    </div>
                  </nav>

                  {isMatching ? (
                    <ProgressButton 
                      progress={matchingProgress} 
                      onClick={handleCancel}
                      jobsSavedCount={jobsSavedCount}
                    />
                  ) : (
                    <button
                      onClick={handleDiscoverJobs}
                      className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      disabled={!selectedResumeId}
                    >
                      <FiSearch className="mr-2" size={16} />
                      Find Jobs
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-white/80 rounded-3xl shadow-xl backdrop-blur-lg">
              <h3 className="text-3xl font-semibold text-slate-700">No resumes found.</h3>
              <p className="mt-2 text-slate-500">Please upload a resume on the Profile page to start finding jobs.</p>
            </div>
          )}

          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col overflow-hidden border-b-4 border-blue-500">
                  <div className="p-6 flex-grow">
                    <p className="text-xl font-bold text-gray-800 truncate">{job.title}</p>
                    <p className="text-gray-600 mt-1">{job.company}</p>
                    <div className="space-y-2 mt-4 text-sm text-gray-500">
                      {job.location && ( <div className="flex items-center"> <FiMapPin className="mr-2 flex-shrink-0" /> <span>{job.location}</span> </div> )}
                    </div>
                    <p className="text-sm text-gray-600 mt-4 h-16 overflow-hidden text-ellipsis">{job.description || 'No description available.'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 flex justify-between items-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${getScoreColor(job.score)}`}>{job.score}</span>
                      <span className="text-xs text-gray-500">Match Score</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold p-2 rounded-md hover:bg-blue-100 transition-colors" title="View Job Posting">
                        <FiExternalLink size={20} />
                      </a>
                      <button 
                        onClick={() => handleGenerateResume(job)} 
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold p-2 rounded-md hover:bg-blue-100 transition-colors" 
                        title="Generate tailored resume"
                        disabled={generatingAction?.jobId === job.id}
                      >
                        {generatingAction?.jobId === job.id && generatingAction?.type === 'resume' ? (
                          <FiLoader className="animate-spin" size={20} />
                        ) : (
                          <FiFileText size={20} />
                        )}
                      </button>
                      <button 
                        onClick={() => handleGenerateCoverLetter(job)} 
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-semibold p-2 rounded-md hover:bg-blue-100 transition-colors" 
                        title="Generate and copy cover letter"
                        disabled={generatingAction?.jobId === job.id}
                      >
                        {generatingAction?.jobId === job.id && generatingAction?.type === 'coverLetter' ? (
                          <FiLoader className="animate-spin" size={20} />
                        ) : (
                          <FiMail size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isProfileLoading && !isMatching && (
              <div className="text-center p-12 bg-white/80 rounded-3xl shadow-xl backdrop-blur-lg">
                <h3 className="text-3xl font-semibold text-slate-700">No recommended jobs for this resume.</h3>
                <p className="mt-2 text-slate-500">Click "Find Jobs" to start a search.</p>
              </div>
            )
          )}

          {/* Real-time job saving indicator */}
          {isMatching && (
            <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  Saving jobs in real-time... {jobsSavedCount} saved
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobsPage;
