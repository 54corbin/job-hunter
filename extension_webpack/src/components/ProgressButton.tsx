import React, { useState, useMemo } from 'react';
import { FiSquare, FiX, FiCheck } from 'react-icons/fi';

type ProgressButtonSize = 'sm' | 'md' | 'lg';
type ProgressButtonVariant = 'primary' | 'secondary' | 'danger';
type ProgressButtonState = 'idle' | 'loading' | 'completed' | 'error';

interface ProgressButtonProps {
  progress: number;
  onClick: () => void;
  size?: ProgressButtonSize;
  variant?: ProgressButtonVariant;
  disabled?: boolean;
  isLoading?: boolean;
  isCompleted?: boolean;
  className?: string;
  ariaLabel?: string;
  reducedMotion?: boolean;
  jobsSavedCount?: number;
}

const ProgressButton: React.FC<ProgressButtonProps> = ({
  progress,
  onClick,
  size = 'md',
  variant = 'primary',
  disabled = false,
  isLoading = false,
  isCompleted = false,
  className = '',
  ariaLabel,
  reducedMotion = false,
  jobsSavedCount = 0,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const state: ProgressButtonState = useMemo(() => {
    if (isCompleted) return 'completed';
    if (isLoading) return 'loading';
    return 'idle';
  }, [isLoading, isCompleted]);

  const animationDuration = reducedMotion ? 'duration-0' : 'duration-300';
  const progressDuration = reducedMotion ? 'duration-0' : 'duration-500';

  const sizeStyles = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
  };

  const variantStyles = {
    primary: {
      base: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      progress: 'from-blue-500 via-blue-400 to-cyan-400',
      shadow: 'shadow-blue-500/25',
      hover: 'hover:from-blue-600 hover:to-blue-700',
      completed: 'from-green-500 to-green-600',
    },
    secondary: {
      base: 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800',
      progress: 'from-gray-400 via-gray-300 to-gray-200',
      shadow: 'shadow-gray-500/25',
      hover: 'hover:from-gray-300 hover:to-gray-400',
      completed: 'from-green-500 to-green-600',
    },
    danger: {
      base: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      progress: 'from-red-500 via-red-400 to-pink-400',
      shadow: 'shadow-red-500/25',
      hover: 'hover:from-red-600 hover:to-red-700',
      completed: 'from-green-500 to-green-600',
    },
  };

  const currentStyles = variantStyles[variant];

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const getIcon = () => {
    switch (state) {
      case 'completed':
        return <FiCheck className="w-5 h-5" />;
      case 'loading':
        return (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <FiSquare className="w-5 h-5" />;
    }
  };

  const getButtonText = () => {
    switch (state) {
      case 'completed':
        return 'Completed';
      case 'loading':
        return `Finding Jobs (${Math.round(progress)}%) • ${jobsSavedCount} saved`;
      default:
        return `Stop (${Math.round(progress)}%)`;
    }
  };

  const progressColorClass = state === 'completed' 
    ? currentStyles.completed 
    : currentStyles.progress;

  return (
    <div className="relative inline-flex">
      <button
        onClick={disabled ? undefined : onClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        disabled={disabled || isLoading}
        className={`
          relative overflow-hidden rounded-xl font-semibold
          transform transition-all ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          will-change-transform
          ${sizeStyles[size]}
          ${currentStyles.base}
          ${currentStyles.hover}
          ${currentStyles.shadow}
          ${animationDuration}
          ${isPressed ? 'scale-98 brightness-110' : 'scale-100'}
          ${disabled || isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-102 active:scale-98'}
          ${className}
        `}
        style={{
          boxShadow: `0 10px 25px -5px var(--tw-shadow-color, rgba(0, 0, 0, 0.1))`,
        }}
        aria-label={ariaLabel || `Progress button: ${getButtonText()}`}
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      >
        {/* Background Progress Fill */}
        <div
          className={`
            absolute inset-0 bg-gradient-to-r transition-all ease-out
            ${progressColorClass}
            ${progressDuration}
            will-change-transform
          `}
          style={{ 
            width: `${Math.min(progress, 100)}%`,
            transform: reducedMotion ? 'none' : 'translateZ(0)',
          }}
        />

        {/* Animated Overlay Pattern */}
        {!reducedMotion && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center space-x-2">
          <span className={`
            ${state === 'loading' ? 'animate-pulse' : ''}
            ${reducedMotion ? '' : 'transition-all duration-300'}
          `}>
            {getIcon()}
          </span>
          <span className={`
            ${reducedMotion ? '' : 'transition-all duration-300'}
            ${state === 'completed' ? 'text-white font-bold' : ''}
          `}>
            {getButtonText()}
          </span>
        </div>

        {/* State-specific Overlays */}
        {state === 'loading' && !reducedMotion && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        )}

        {state === 'completed' && !reducedMotion && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20 animate-pulse" />
        )}
      </button>

      {/* Accessibility: Reduced Motion Indicator */}
      {reducedMotion && (
        <div className="sr-only">
          Animation disabled due to user preference
        </div>
      )}
    </div>
  );
};

export default ProgressButton;