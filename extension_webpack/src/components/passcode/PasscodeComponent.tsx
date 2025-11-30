import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { FiLock, FiUnlock } from 'react-icons/fi';

interface PasscodeComponentProps {
  onUnlock: (passcode: string) => void;
  isError: boolean;
}

const PasscodeComponent: React.FC<PasscodeComponentProps> = ({ onUnlock, isError }) => {
  const [passcode, setPasscode] = useState<string[]>(Array(4).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handlePasscodeChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (/^[0-9]$/.test(value) || value === '') {
      const newPasscode = [...passcode];
      newPasscode[index] = value;
      setPasscode(newPasscode);

      if (value !== '' && index < 3) {
        inputsRef.current[index + 1]?.focus();
      }

      if (newPasscode.every(digit => digit !== '')) {
        onUnlock(newPasscode.join(''));
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && passcode[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const getShakeClass = () => {
    return isError ? 'animate-shake' : '';
  };

  const setInputRef = (el: HTMLInputElement | null, index: number) => {
    inputsRef.current[index] = el;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 bg-opacity-50 backdrop-blur-lg">
      <Card className={`w-full max-w-sm bg-white/90 dark:bg-slate-800/90 border border-slate-200/10 shadow-2xl rounded-2xl ${getShakeClass()}`}>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg">
            <FiLock className="h-8 w-8" />
          </div>
          <CardTitle className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Enter Passcode</CardTitle>
          <CardDescription className="mt-2 text-gray-600 dark:text-slate-400">
            This extension is locked for your security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4">
            {passcode.map((digit, index) => (
              <input
                key={index}
                ref={el => setInputRef(el, index)}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePasscodeChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="h-16 w-12 rounded-lg border-2 border-slate-300/50 bg-slate-50/50 text-center text-3xl font-semibold text-gray-900 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none dark:bg-slate-700/50 dark:text-white dark:border-slate-600/50"
                autoFocus={index === 0}
              />
            ))}
          </div>
          {isError && (
              <p className="mt-4 text-center text-sm font-medium text-red-500">
                  Incorrect passcode. Please try again.
              </p>
          )}
          <div className="mt-8">
            <Button 
              onClick={() => onUnlock(passcode.join(''))} 
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <FiUnlock />
              Unlock
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasscodeComponent;
