import { generateContent } from "./llmService";
import { ServiceError } from "./errorService";
import { getUserProfile, UserProfile, Resume } from "./storageService";
import { JobHunterError, handleServiceError } from "./errorService";

export interface AnswerGenerationRequest {
  selectedText: string;
  context?: string;
  questionType?: "general" | "interview" | "application" | "technical";
}

export interface AnswerGenerationResponse {
  answer: string;
  error?: string;
}

export const generateAnswerForSelection = async (
  request: AnswerGenerationRequest
): Promise<AnswerGenerationResponse> => {
  try {
    // Get current user profile
    const profile = await getUserProfile();
    if (!profile) {
      return {
        answer: "",
        error: "No user profile found. Please set up your profile first."
      };
    }

    // Get active resume
    const activeResumeId = profile.settings.activeResumeId;
    if (!activeResumeId) {
      return {
        answer: "",
        error: "No active resume selected. Please select a resume profile first."
      };
    }

    const activeResume = profile.resumes?.find(r => r.id === activeResumeId);
    if (!activeResume || !activeResume.text) {
      return {
        answer: "",
        error: "Active resume not found or empty. Please select a valid resume."
      };
    }

    // Generate contextual answer based on selection
    const prompt = createAnswerPrompt(
      request.selectedText,
      activeResume.text,
      request.questionType || "general",
      request.context
    );

    const result = await generateContent(prompt);
    
    if (result.error) {
      const errorMessage = getErrorUserMessage(result.error);
      return {
        answer: "",
        error: errorMessage
      };
    }
    
    if (!result.content) {
      return {
        answer: "",
        error: "Failed to generate answer. Please check your AI provider configuration."
      };
    }

    return { answer: result.content };
  } catch (error) {
    console.error("Error generating answer:", error);
    return {
      answer: "",
      error: "An unexpected error occurred while generating the answer."
    };
  }
};

const getErrorUserMessage = (error: ServiceError): string => {
  switch (error.code) {
    case 'NO_PROVIDER':
    case 'NO_API_KEY':
      return 'Please configure an AI provider in Settings before proceeding.';
    case 'NETWORK_ERROR':
      return 'Network connection failed. Please check your internet connection.';
    case 'RATE_LIMITED':
      return 'Rate limit exceeded. Please wait a moment before trying again.';
    case 'SERVER_ERROR':
      return 'Server error occurred. Please try again later.';
    case 'TIMEOUT':
      return 'Request timed out. Please try again.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

const createAnswerPrompt = (
  selectedText: string,
  resumeText: string,
  questionType: string,
  context?: string
): string => {
  const basePrompt = `
You are a professional career coach helping a user generate a contextual answer based on their selected text and resume.

**Selected Text:**
---
${selectedText}
---

**User's Resume:**
---
${resumeText.substring(0, 4000)}
---

${context ? `**Additional Context:**\n${context}\n` : ""}

**Instructions:**
1. Analyze the selected text and determine what type of response would be most helpful
2. Use the user's resume to provide personalized, relevant answers
3. Keep responses concise (2-4 sentences for general questions, 3-5 sentences for technical questions)
4. Maintain a professional tone matching the user's background
5. Focus on practical, actionable insights
`;

  // Customize prompt based on question type
  switch (questionType) {
    case "interview":
      return basePrompt + `
**Question Type: Interview Question**
Provide a thoughtful, professional response that demonstrates the user's experience and skills. Include specific examples from their background when relevant.
`;
    
    case "application":
      return basePrompt + `
**Question Type: Job Application Question**
Generate a compelling response that highlights the user's qualifications for the role. Focus on matching their experience to the requirements implied in the selected text.
`;
    
    case "technical":
      return basePrompt + `
**Question Type: Technical Question**
Provide a detailed, informative response that showcases the user's technical knowledge and experience. Include specific technologies and methodologies from their background.
`;
    
    default:
      return basePrompt + `
**Question Type: General Inquiry**
Provide a helpful, informative response that draws from the user's professional experience and expertise.
`;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand("copy");
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
};

export const getActiveResumeInfo = async (): Promise<{
  resume: Resume | null;
  profile: UserProfile | null;
  error?: string;
}> => {
  try {
    const profile = await getUserProfile();
    if (!profile) {
      return { resume: null, profile: null, error: "No user profile found" };
    }

    const activeResumeId = profile.settings.activeResumeId;
    if (!activeResumeId) {
      return { 
        resume: null, 
        profile, 
        error: "No active resume selected" 
      };
    }

    const activeResume = profile.resumes?.find(r => r.id === activeResumeId);
    if (!activeResume) {
      return { 
        resume: null, 
        profile, 
        error: "Active resume not found" 
      };
    }

    return { resume: activeResume, profile };
  } catch (error) {
    console.error("Error getting active resume info:", error);
    return { 
      resume: null, 
      profile: null, 
      error: "Failed to retrieve resume information" 
    };
  }
};