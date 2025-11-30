import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Animated backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 backdrop-blur-sm animate-fade-in" />
      
      {/* Modal content with glass morphism effect */}
      <div
        className="relative w-full max-w-lg transform transition-all duration-300 ease-out animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20">
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl" />
          <div className="absolute inset-[1px] bg-white/95 rounded-2xl" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/80 hover:bg-slate-200/80 transition-all duration-200 group"
          >
            <svg 
              className="w-4 h-4 text-slate-500 group-hover:text-slate-700" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Content */}
          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const ModalContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div 
            ref={ref} 
            className={`relative flex w-full flex-col ${className}`} 
            {...props} 
        />
    )
);
ModalContent.displayName = 'ModalContent';


const ModalHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-start justify-between p-8 pb-6 border-b border-slate-100 ${className}`}
      {...props}
    />
  )
);
ModalHeader.displayName = 'ModalHeader';

const ModalTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={`text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent leading-tight tracking-tight ${className}`}
      {...props}
    />
  )
);
ModalTitle.displayName = 'ModalTitle';

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p 
    ref={ref} 
    className={`text-lg text-slate-600 leading-relaxed ${className}`} 
    {...props} 
  />
));
ModalDescription.displayName = 'ModalDescription';

const ModalBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div 
        ref={ref} 
        className={`px-8 py-6 ${className}`} 
        {...props} 
      />
    )
);
ModalBody.displayName = 'ModalBody';

const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center justify-end gap-4 px-8 py-6 bg-slate-50/50 border-t border-slate-100 ${className}`}
      {...props}
    />
  )
);
ModalFooter.displayName = 'ModalFooter';

export { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter };