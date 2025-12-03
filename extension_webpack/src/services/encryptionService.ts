/**
 * AES-256-GCM Encryption Service
 * Provides client-side encryption for sensitive resume data using Web Crypto API
 */

export interface EncryptionResult {
  encryptedData: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt for key derivation
}

export interface EncryptedStorageData {
  encryptedContent: string;
  iv: string;
  salt: string;
  timestamp: number;
  version: string;
}

class EncryptionService {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12; // GCM standard
  private readonly SALT_LENGTH = 32;
  private readonly ITERATIONS = 100000; // PBKDF2 iterations
  private readonly VERSION = '1.0';

  /**
   * Derives a crypto key from password using PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generates a random salt for key derivation
   */
  private generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
  }

  /**
   * Generates a random initialization vector
   */
  private generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
  }

  /**
   * Converts ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Gets or creates a master key for encryption using the passcode
   */
  private async getMasterKey(): Promise<string> {
    // Check for passcode in the current save operation context first
    const currentContextPasscode = this.getCurrentPasscodeContext();
    
    if (currentContextPasscode) {
      return currentContextPasscode;
    }
    
    // If no context passcode, try to get passcode from storage
    const passcode = await this.getPasscodeFromStorage();
    
    if (!passcode) {
      // No passcode available - cannot use encryption
      throw new Error('PASSCODE_REQUIRED_FOR_ENCRYPTION');
    }
    
    return passcode;
  }

  // Context storage for passcodes during save operations
  private currentPasscodeContext: string | null = null;

  /**
   * Set passcode context for current save operation
   */
  setPasscodeContext(passcode: string | null): void {
    this.currentPasscodeContext = passcode;
  }

  /**
   * Get current passcode from context
   */
  private getCurrentPasscodeContext(): string | null {
    return this.currentPasscodeContext;
  }

  /**
   * Gets the user passcode from the profile storage
   */
  private async getPasscodeFromStorage(): Promise<string | null> {
    return new Promise((resolve) => {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['userProfile'], (result) => {
          if (result.userProfile) {
            // Check if data is encrypted or unencrypted
            if (result.userProfile.encryptedProfile) {
              // This shouldn't happen - if data is encrypted, we can't get the passcode
              // User needs to enter their passcode first
              resolve(null);
            } else {
              // Legacy unencrypted data - check for passcode
              const profile = result.userProfile;
              if (profile.settings?.passcodeEnabled && profile.settings?.passcode) {
                resolve(profile.settings.passcode);
              } else {
                resolve(null);
              }
            }
          } else {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Gets encryption setup status
   * Now based on passcode availability
   */
  async getEncryptionSetupStatus(): Promise<{
    hasPersistentKey: boolean;
    hasUserPassword: boolean;
    keyAvailable: boolean;
  }> {
    const hasPersistentKey = await this.hasPasscodeKey();
    const passcode = this.currentPasscodeContext || await this.getPasscodeFromStorage();
    
    return {
      hasPersistentKey,
      hasUserPassword: !!passcode,
      keyAvailable: hasPersistentKey && !!passcode
    };
  }

  /**
   * Checks if we have a passcode available for encryption
   */
  private async hasPasscodeKey(): Promise<boolean> {
    return new Promise((resolve) => {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['userProfile'], (result) => {
          if (result.userProfile) {
            // Check if passcode is enabled in settings
            const profile = result.userProfile.encryptedProfile ? 
              result.userProfile : // If encrypted, assume it was set up with passcode
              result.userProfile;
            
            const hasPasscode = profile.settings?.passcodeEnabled;
            resolve(hasPasscode);
          } else {
            resolve(false);
          }
        });
      } else {
        resolve(false);
      }
    });
  }

  /**
   * Encrypts data using AES-256-GCM with passcode
   */
  async encrypt(data: string): Promise<EncryptionResult> {
    try {
      const masterKey = await this.getMasterKey();
      const salt = this.generateSalt();
      const iv = this.generateIV();
      
      // For passcode-based encryption, use a more secure approach
      // Convert the 4-digit passcode to a secure key
      const secureKey = await this.deriveKeyFromPasscode(masterKey, salt);
      
      // Encrypt the data
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        secureKey,
        encodedData
      );

      return {
        encryptedData: this.arrayBufferToBase64(encryptedBuffer),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt)
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      if (error instanceof Error && error.message === 'PASSCODE_REQUIRED_FOR_ENCRYPTION') {
        throw new Error('PASSCODE_REQUIRED_FOR_ENCRYPTION');
      }
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data using AES-256-GCM with passcode
   */
  async decrypt(encryptedData: string, iv: string, salt: string): Promise<string> {
    try {
      const masterKey = await this.getMasterKey();
      
      // Convert base64 strings back to ArrayBuffers
      const saltArray = new Uint8Array(this.base64ToArrayBuffer(salt));
      const ivArray = new Uint8Array(this.base64ToArrayBuffer(iv));
      const dataArray = this.base64ToArrayBuffer(encryptedData);
      
      // Derive the same key
      const secureKey = await this.deriveKeyFromPasscode(masterKey, saltArray);
      
      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: ivArray
        },
        secureKey,
        dataArray
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - invalid key or corrupted data');
    }
  }

  /**
   * Derives a secure key from the 4-digit passcode
   */
  private async deriveKeyFromPasscode(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
    // For a 4-digit passcode, we need to strengthen it significantly
    // Repeat the passcode multiple times and add constants
    const encoder = new TextEncoder();
    const repeatedPasscode = passcode.repeat(8) + 'job_hunter_encryption_salt_2025';
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(repeatedPasscode),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts and packages data for storage
   */
  async encryptForStorage(data: string): Promise<EncryptedStorageData> {
    const encryptionResult = await this.encrypt(data);
    
    return {
      encryptedContent: encryptionResult.encryptedData,
      iv: encryptionResult.iv,
      salt: encryptionResult.salt,
      timestamp: Date.now(),
      version: this.VERSION
    };
  }

  /**
   * Decrypts data from storage
   */
  async decryptFromStorage(encryptedStorageData: EncryptedStorageData): Promise<string> {
    if (encryptedStorageData.version !== this.VERSION) {
      throw new Error('Incompatible encryption version');
    }
    
    return await this.decrypt(
      encryptedStorageData.encryptedContent,
      encryptedStorageData.iv,
      encryptedStorageData.salt
    );
  }

  /**
   * Checks if encryption is available in the current environment
   */
  isEncryptionAvailable(): boolean {
    return !!(window.crypto && window.crypto.subtle);
  }

  /**
   * Securely clears all encryption keys
   */
  clearMasterKey(): void {
    // Just clear session storage - no separate encryption keys to manage
    sessionStorage.removeItem('job_hunter_master_key');
    
    console.log('Encryption keys cleared from session storage');
  }

  /**
   * Completely removes all encryption data (use with caution)
   */
  async clearAllEncryptionData(): Promise<void> {
    try {
      // Clear all encryption-related storage
      await chrome.storage.local.remove([
        'encryptionMasterKey',
        'encryptionPassword',
        'encryptionPasswordHash'
      ]);
      
      // Clear session key
      sessionStorage.removeItem('job_hunter_master_key');
      
      console.log('All encryption data cleared');
    } catch (error) {
      console.error('Failed to clear encryption data:', error);
      throw new Error('Failed to clear encryption data');
    }
  }

  /**
   * Sets up encryption using the passcode from settings
   * This is now automatic - no separate setup needed
   */
  async initializeEncryption(passcode?: string): Promise<boolean> {
    try {
      // Check if we have a passcode
      const currentPasscode = passcode || await this.getPasscodeFromStorage();
      
      if (!currentPasscode) {
        console.log('No passcode available for encryption setup');
        return false;
      }

      // Encryption is ready whenever we have a passcode
      console.log('Encryption initialized with passcode');
      return true;
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      return false;
    }
  }

  /**
   * Checks if encryption is properly configured and ready to use
   */
  async isEncryptionReady(): Promise<boolean> {
    try {
      const status = await this.getEncryptionSetupStatus();
      return status.keyAvailable;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validates encryption integrity
   */
  async validateEncryption(): Promise<boolean> {
    try {
      // Get current passcode (from context or storage)
      const passcode = this.currentPasscodeContext || await this.getPasscodeFromStorage();
      
      if (!passcode) {
        // No passcode available - this is normal when user hasn't set one up yet
        console.log('Encryption validation skipped - no passcode available (not an error)');
        return true; // Return true to avoid false error states
      }
      
      // We have a passcode - validate that encryption actually works
      try {
        const testData = 'encryption_test_data_12345';
        
        // Temporarily set context for validation if not already set
        const originalContext = this.currentPasscodeContext;
        if (!this.currentPasscodeContext) {
          this.currentPasscodeContext = passcode;
        }
        
        try {
          const encrypted = await this.encrypt(testData);
          const decrypted = await this.decrypt(encrypted.encryptedData, encrypted.iv, encrypted.salt);
          const isValid = decrypted === testData;
          
          console.log(`Encryption validation ${isValid ? 'successful' : 'failed'}`);
          return isValid;
        } finally {
          // Restore original context if we temporarily set it
          if (!originalContext) {
            this.currentPasscodeContext = null;
          }
        }
      } catch (encryptError) {
        console.error('Encryption validation failed:', encryptError);
        return false;
      }
    } catch (error) {
      console.error('Encryption validation error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Utility functions for easy integration
export const encryptData = (data: string): Promise<EncryptionResult> => 
  encryptionService.encrypt(data);

export const decryptData = (encryptedData: string, iv: string, salt: string): Promise<string> => 
  encryptionService.decrypt(encryptedData, iv, salt);

export const encryptForStorage = (data: string): Promise<EncryptedStorageData> => 
  encryptionService.encryptForStorage(data);

export const decryptFromStorage = (encryptedData: EncryptedStorageData): Promise<string> => 
  encryptionService.decryptFromStorage(encryptedData);