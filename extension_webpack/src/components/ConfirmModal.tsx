
import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) {
    return null;
  }

  const isSuccess = title.toLowerCase().includes('success');
  const isError = title.toLowerCase().includes('error') || title.toLowerCase().includes('required');

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-3">
            {isSuccess && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {isError && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            {!isSuccess && !isError && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            {title}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-slate-600 text-lg leading-relaxed">{message}</p>
        </ModalBody>
        <ModalFooter>
          {isSuccess ? (
            <Button onClick={handleClose} variant="success" className="min-w-[120px]">
              Got it!
            </Button>
          ) : (
            <>
              <Button onClick={handleClose} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleConfirm} variant={isError ? "destructive" : "primary"}>
                {isError ? "I Understand" : "Confirm"}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
