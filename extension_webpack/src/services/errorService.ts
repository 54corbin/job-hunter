import { ApiProvider } from './storageService';

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  context?: string;
  recoverable?: boolean;
  retryAction?: () => void;
}

export class JobHunterError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any,
    public context?: string,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'JobHunterError';
  }
}

export const handleServiceError = (
  error: any,
  context: string,
  recoverable: boolean = false
): ServiceError => {
  console.error(`Service error in ${context}:`, error);

  if (error instanceof JobHunterError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      context: error.context || context,
      recoverable: error.recoverable,
    };
  }

  // Handle common error types
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network request failed. Please check your internet connection.',
      details: error.message,
      context,
      recoverable: true,
      retryAction: () => window.location.reload(),
    };
  }

  if (error.name === 'UnauthorizedError' || error.status === 401) {
    return {
      code: 'UNAUTHORIZED',
      message: 'Authentication failed. Please check your API credentials.',
      context,
      recoverable: true,
    };
  }

  if (error.name === 'InsufficientQuotaError' || error.status === 429) {
    return {
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded. Please wait before making more requests.',
      context,
      recoverable: true,
    };
  }

  if (error.status === 404) {
    return {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
      context,
    };
  }

  if (error.status >= 500) {
    return {
      code: 'SERVER_ERROR',
      message: 'Server error occurred. Please try again later.',
      context,
      recoverable: true,
    };
  }

  // Default error
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred',
    details: error,
    context,
    recoverable,
  };
};

export const validateApiProvider = (provider: ApiProvider | undefined): ServiceError | null => {
  if (!provider) {
    return {
      code: 'NO_PROVIDER',
      message: 'No AI provider configured. Please add an API provider in settings.',
      context: 'api-validation',
      recoverable: true,
    };
  }

  if (!provider.apiKey || provider.apiKey.trim() === '') {
    return {
      code: 'NO_API_KEY',
      message: 'API key is missing. Please configure your API provider in settings.',
      context: 'api-validation',
      recoverable: true,
    };
  }

  if (!provider.model || provider.model.trim() === '') {
    return {
      code: 'NO_MODEL',
      message: 'Model is not selected. Please choose a model for your API provider.',
      context: 'api-validation',
      recoverable: true,
    };
  }

  return null;
};

export const isRecoverableError = (error: ServiceError): boolean => {
  const recoverableCodes = [
    'NETWORK_ERROR',
    'RATE_LIMITED', 
    'SERVER_ERROR',
    'TIMEOUT',
    'NO_PROVIDER',
    'NO_API_KEY',
    'NO_MODEL',
  ];
  
  return recoverableCodes.includes(error.code) || !!error.recoverable;
};

export const getErrorRetryMessage = (error: ServiceError): string => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Check your internet connection and try again';
    case 'RATE_LIMITED':
      return 'Wait a moment and try again';
    case 'SERVER_ERROR':
      return 'Please try again in a few minutes';
    case 'NO_PROVIDER':
    case 'NO_API_KEY':
    case 'NO_MODEL':
      return 'Configure your API provider in Settings';
    case 'TIMEOUT':
      return 'Request timed out - try again';
    default:
      return 'Please try again';
  }
};