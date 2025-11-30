import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import ErrorNotification, { Notification, NotificationType } from './ErrorNotification';

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => string;
  showSuccess: (title: string, message: string, options?: Partial<Notification>) => string;
  showError: (title: string, message: string, options?: Partial<Notification>) => string;
  showWarning: (title: string, message: string, options?: Partial<Notification>) => string;
  showInfo: (title: string, message: string, options?: Partial<Notification>) => string;
  hideNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  position = 'top-right',
  maxNotifications = 5,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit the number of notifications
      return updated.slice(0, maxNotifications);
    });

    return id;
  }, [maxNotifications]);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return showNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return showNotification({
      type: 'error',
      title,
      message,
      duration: 8000, // Errors stay longer by default
      ...options,
    });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return showNotification({
      type: 'warning',
      title,
      message,
      duration: 6000, // Warnings stay medium duration by default
      ...options,
    });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return showNotification({
      type: 'info',
      title,
      message,
      duration: 4000, // Info messages disappear faster
      ...options,
    });
  }, [showNotification]);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'fixed top-4 right-4 z-50 space-y-4';
      case 'top-left':
        return 'fixed top-4 left-4 z-50 space-y-4';
      case 'bottom-right':
        return 'fixed bottom-4 right-4 z-50 space-y-4';
      case 'bottom-left':
        return 'fixed bottom-4 left-4 z-50 space-y-4';
      case 'top-center':
        return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-4';
      case 'bottom-center':
        return 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 space-y-4';
      default:
        return 'fixed top-4 right-4 z-50 space-y-4';
    }
  };

  // Create a portal for the notifications
  const NotificationPortal = () => {
    if (typeof document === 'undefined') return null;
    
    return createPortal(
      <div className={getPositionClasses()}>
        {notifications.map(notification => (
          <ErrorNotification
            key={notification.id}
            notification={notification}
            onClose={hideNotification}
          />
        ))}
      </div>,
      document.body
    );
  };

  const value: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationPortal />
    </NotificationContext.Provider>
  );
};

// Higher-order component for easy error handling
export const withErrorHandling = <P extends object>(
  Component: React.ComponentType<P>,
  errorHandlers?: {
    onError?: (error: Error, errorInfo: any) => void;
    fallback?: React.ComponentType<{ error?: Error }>;
  }
) => {
  const WrappedComponent: React.FC = (props) => {
    const { showError } = useNotifications();

    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        console.error('Global error caught:', event.error);
        showError(
          'Application Error',
          'An unexpected error occurred. Please refresh the page if the problem persists.',
          {
            action: {
              label: 'Reload Page',
              onClick: () => window.location.reload(),
            },
          }
        );
        
        if (errorHandlers?.onError) {
          errorHandlers.onError(event.error, { componentStack: event.error?.stack });
        }
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        console.error('Unhandled promise rejection:', event.reason);
        showError(
          'Network Error',
          'A network request failed. Please check your connection and try again.'
        );
        
        if (errorHandlers?.onError) {
          errorHandlers.onError(new Error(event.reason), { type: 'promise rejection' });
        }
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, [showError, errorHandlers?.onError]);

    try {
      return <Component {...(props as P)} />;
    } catch (error) {
      console.error('Component render error:', error);
      const FallbackComponent = errorHandlers?.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={error as Error} />;
      }
      
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Component Error</h3>
          <p className="text-red-600 text-sm mt-1">
            This component encountered an error and couldn't render properly.
          </p>
        </div>
      );
    }
  };

  WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for catching async errors
export const useAsyncErrorHandler = () => {
  const { showError } = useNotifications();
  
  return React.useCallback((error: unknown, context?: string) => {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const details = context ? ` (${context})` : '';
    
    console.error(`Async error${details}:`, error);
    
    showError(
      'Operation Failed',
      `${message}${details}`,
      {
        duration: 8000,
        action: {
          label: 'View Details',
          onClick: () => console.error('Error details:', error),
        },
      }
    );
  }, [showError]);
};