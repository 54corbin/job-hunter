import { getUserProfile, UserProfile, ApiProvider } from "./storageService";
import { JobHunterError, handleServiceError, validateApiProvider, ServiceError } from "./errorService";
import OpenAI from "openai";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

type Headers = {
  [key: string]: string;
};

const getLlmApiCallConfig = async () => {
  try {
    const profile = await getUserProfile();
    const activeProviderId = profile?.settings?.activeAiProviderId;
    const provider = profile?.settings?.apiProviders?.find(
      (p) => p.id === activeProviderId,
    );

    // Validate provider configuration
    const validationError = validateApiProvider(provider);
    if (validationError) {
      throw new JobHunterError(
        validationError.code,
        validationError.message,
        validationError.details,
        validationError.context,
        validationError.recoverable
      );
    }

    if (!provider || !provider.apiKey) {
      throw new JobHunterError(
        'NO_PROVIDER',
        "Active AI provider or API key not found.",
        null,
        'llm-config',
        true
      );
    }

    if (provider.name === "Ollama") {
      return {
        url: `${provider.apiKey}/api/generate`, // apiKey is the host for Ollama
        headers: { "Content-Type": "application/json" },
        provider: "ollama",
        model: provider.model,
      };
    }

    if (provider.name === "Gemini") {
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`,
        headers: { "Content-Type": "application/json" },
        provider: "gemini",
      };
    }

    // Default to OpenAI
    return {
      url: OPENAI_API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      model: provider.model,
      provider: "openai",
    };
  } catch (error) {
    if (error instanceof JobHunterError) {
      throw error;
    }
    throw new JobHunterError(
      'CONFIG_ERROR',
      'Failed to get LLM configuration',
      error,
      'llm-config',
      true
    );
  }
};

export const generateContent = async (
  prompt: string,
  temperature: number = 0.7,
): Promise<{ content: string | null; error?: ServiceError }> => {
  let config;
  try {
    config = await getLlmApiCallConfig();
  } catch (error) {
    if (error instanceof JobHunterError) {
      return { 
        content: null, 
        error: handleServiceError(error, 'generate-content-config') 
      };
    }
    return { 
      content: null, 
      error: handleServiceError(error, 'generate-content-config') 
    };
  }

  if (!config) {
    return {
      content: null,
      error: handleServiceError(
        new Error('Failed to get LLM configuration'),
        'generate-content-config'
      ),
    };
  }

  let body;
  if (config.provider === "gemini") {
    body = {
      contents: [{ parts: [{ text: prompt }] }],
      // Gemini temperature is part of generationConfig, but for simplicity we'll omit for now
      // as it requires a different structure. The default should be fine.
    };
  } else if (config.provider === "ollama") {
    body = {
      model: config.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature,
      },
    };
  } else {
    // openai
    body = {
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature,
    };
  }

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: config.headers as Headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new JobHunterError(
        response.status >= 500 ? 'SERVER_ERROR' : 'API_ERROR',
        `LLM API request failed: ${response.status} ${response.statusText}`,
        { status: response.status, response: errorText },
        'generate-content-api',
        response.status >= 500 || response.status === 429
      );
      
      return { 
        content: null, 
        error: handleServiceError(error, 'generate-content-api') 
      };
    }

    const data = await response.json();
    let content: string | null;
    
    if (config.provider === "gemini") {
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } else if (config.provider === "ollama") {
      content = data.response || null;
    } else {
      content = data.choices?.[0]?.message?.content || null;
    }

    if (!content) {
      return {
        content: null,
        error: handleServiceError(
          new Error('Empty response from LLM API'),
          'generate-content-empty-response'
        ),
      };
    }

    return { content };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new JobHunterError(
        'NETWORK_ERROR',
        'Failed to connect to LLM API. Please check your internet connection.',
        error,
        'generate-content-network',
        true
      );
      return { 
        content: null, 
        error: handleServiceError(networkError, 'generate-content-network') 
      };
    }

    return { 
      content: null, 
      error: handleServiceError(error, 'generate-content-unknown') 
    };
  }
};

export const getMatchScore = async (
  jobDetails: any,
  resumeText: string,
): Promise<{ score: number; summary: string } | { error: ServiceError }> => {
  const truncatedResumeText = resumeText.substring(0, 4000);
  const prompt = `
    You are a professional recruiter. Analyze the following resume and job description, and return a relevance score from 1 to 100, where 100 is a perfect match. Also, provide a brief summary of why it is a match or not. Your response must be a JSON object with the keys "score" and "summary".

    Resume:
    ---
    ${truncatedResumeText}
    ---

    Job Description:
    ---
    ${JSON.stringify(jobDetails, null, 2)}
    ---
  `;

  const result = await generateContent(prompt, 0.2);

  if (result.error) {
    return { error: result.error };
  }

  if (!result.content) {
    return { 
      error: handleServiceError(
        new Error('No content returned from LLM'),
        'getMatchScore-no-content'
      ) 
    };
  }

  try {
    const jsonMatch = result.content.match(/```json\n([\s\S]*?)\n```/);
    let jsonString = jsonMatch ? jsonMatch[1] : result.content;
    jsonString = jsonString.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(jsonString);
  } catch (e) {
    return { 
      error: handleServiceError(
        new Error(`Failed to parse LLM response JSON: ${e}`),
        'getMatchScore-parse-error',
        false
      ) 
    };
  }
};

export const extractProfileFromResume = async (
  resumeText: string,
): Promise<Partial<UserProfile> | { error: ServiceError }> => {
  const sanitizedResumeText = resumeText.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

  const prompt = `
    You are an expert HR data extractor. Based on the following resume text, extract the user's professional information and return it as a JSON object. The JSON object must strictly adhere to the following schema:

    {
      "personalInfo": { "name": "string", "email": "string", "phone": "string" },
      "experience": [ { "company": "string", "title": "string", "startDate": "string", "endDate": "string", "summary": "string", "responsibilities": ["string"] } ],
      "education": [ { "institution": "string", "degree": "string", "fieldOfStudy": "string", "graduationDate": "string" } ],
      "skills": ["string"]
    }

    Rules:
    - If a value is not found, use an empty string for string types or an empty array for array types.
    - Dates should be in a consistent format (e.g., YYYY-MM-DD), but if not specified, use the format found in the text.

    Resume Text:
    ---
    ${sanitizedResumeText}
    ---
  `;

  const result = await generateContent(prompt, 0.2);

  if (result.error) {
    return { error: result.error };
  }

  if (!result.content) {
    return { 
      error: handleServiceError(
        new Error('No content returned from LLM'),
        'extractProfile-no-content'
      ) 
    };
  }

  try {
    const jsonMatch = result.content.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : result.content;
    return JSON.parse(jsonString);
  } catch (e) {
    return { 
      error: handleServiceError(
        new Error(`Failed to parse LLM response JSON: ${e}`),
        'extractProfile-parse-error',
        false
      ) 
    };
  }
};

export const listModels = async (
  provider: ApiProvider,
): Promise<string[] | null> => {
  if (provider.name === "Gemini") {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${provider.apiKey}`,
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.models
        .map((m: any) => m.name.replace("models/", ""))
        .filter((m: any) => m.includes("gemini"));
    } catch (error) {
      console.error("Error fetching Gemini models:", error);
      return null;
    }
  } else if (provider.name === "Ollama") {
    try {
      const response = await fetch(`${provider.apiKey}/api/tags`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.models.map((m: any) => m.name);
    } catch (error) {
      console.error("Error fetching Ollama models:", error);
      return null;
    }
  } else {
    // OpenAI
    try {
      const openai = new OpenAI({
        apiKey: provider.apiKey,
        dangerouslyAllowBrowser: true,
      });
      const models = await openai.models.list();
      return models.data.map((m: any) => m.id).filter((id: any) => id.includes("gpt"));
    } catch (error) {
      console.error("Error fetching OpenAI models:", error);
      return null;
    }
  }
};

export const extractKeywordsFromResume = async (
  resumeText: string,
): Promise<string[] | { error: ServiceError }> => {
  const prompt = `
    Based on the following resume text, extract 2 most relevant one-word keywords for job listings searching.
    Return a JSON array.

    Resume Text:
    ---
    ${resumeText.substring(0, 4000)}
    ---
  `;

  const result = await generateContent(prompt);

  if (result.error) {
    return { error: result.error };
  }

  if (!result.content) {
    return { 
      error: handleServiceError(
        new Error('No content returned from LLM'),
        'extractKeywords-no-content'
      ) 
    };
  }

  try {
    const jsonMatch = result.content.match(/```json\n([\s\S]*?)\n```/);
    let jsonString = jsonMatch ? jsonMatch[1] : result.content;
    jsonString = jsonString.replace(/,\s*([}\]])/g, "$1");
    const keywords = JSON.parse(jsonString);
    if (
      Array.isArray(keywords) &&
      keywords.every((k) => typeof k === "string")
    ) {
      return keywords;
    }
    if (typeof keywords === "string") {
      return keywords.split(" ");
    }
    return [];
  } catch (e) {
    return { 
      error: handleServiceError(
        new Error(`Failed to parse keywords from LLM response: ${e}`),
        'extractKeywords-parse-error',
        false
      ) 
    };
  }
};

export const generateAnswerForQuestion = async (
  question: string,
  jobDescription: string,
  resumeText: string,
): Promise<string | { error: ServiceError }> => {
  const prompt = `
    You are a professional career coach helping a candidate apply for a job.
    Your task is to answer an application question based on the candidate's resume and the job description.
    Craft a concise, compelling, and professional answer (2-4 sentences) that directly addresses the question, highlighting the candidate's most relevant skills and experience.

    **Candidate's Resume:**
    ---
    ${resumeText.substring(0, 3000)}
    ---

    **Job Description:**
    ---
    ${jobDescription.substring(0, 3000)}
    ---

    **Application Question:**
    ---
    ${question}
    ---

    **Answer:**
  `;

  const result = await generateContent(prompt);
  
  if (result.error) {
    return { error: result.error };
  }

  return result.content || '';
};

export const generateResumeForJob = async (
  jobDetails: any,
  resumeText: string,
): Promise<string | { error: ServiceError }> => {
  const prompt = `
    You are a professional resume writer. Your task is to rewrite the following resume to be tailored for the given job description.
    The new resume should highlight the most relevant skills and experience from the original resume that match the job description.
    The output should be a complete resume in markdown format.

    **Original Resume:**
    ---
    ${resumeText.substring(0, 3000)}
    ---

    **Job Description:**
    ---
    ${JSON.stringify(jobDetails, null, 2)}
    ---

    **New Tailored Resume (Markdown):**
  `;

  const result = await generateContent(prompt);
  
  if (result.error) {
    return { error: result.error };
  }

  return result.content || '';
};

export const generateCoverLetterForJob = async (
  jobDetails: any,
  resumeText: string,
): Promise<string | { error: ServiceError }> => {
  const prompt = `
    You are a professional career coach. Your task is to write a compelling and professional cover letter for a job application.
    The cover letter should be based on the candidate's resume and the provided job description.
    It should be concise (3-4 paragraphs), highlight the candidate's most relevant skills and experience, and express enthusiasm for the role.
    The output should be a complete cover letter in markdown format.

    **Candidate's Resume:**
    ---
    ${resumeText.substring(0, 3000)}
    ---

    **Job Description:**
    ---
    ${JSON.stringify(jobDetails, null, 2)}
    ---

    **Cover Letter (Markdown):**
  `;

  const result = await generateContent(prompt);
  
  if (result.error) {
    return { error: result.error };
  }

  return result.content || '';
};
