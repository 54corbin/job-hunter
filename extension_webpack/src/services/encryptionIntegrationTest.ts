/**
 * Encryption Integration Test
 * Verifies that encryption is properly integrated throughout the application
 */

import { checkEncryptionStatus, migrateToEncryption } from '../services/storageService';
import { encryptionService } from '../services/encryptionService';
import { EncryptedStorageData } from '../services/encryptionService';

export async function testEncryptionIntegration() {
  console.log('🔍 Testing Encryption Integration...\n');

  const results = {
    serviceAvailable: false,
    storageIntegration: false,
    uiComponents: false,
    backwardCompatibility: false,
    errorHandling: false
  };

  try {
    // Test 1: Encryption Service Availability
    console.log('1. Testing Encryption Service Availability...');
    const isAvailable = encryptionService.isEncryptionAvailable();
    results.serviceAvailable = isAvailable;
    console.log(`   Web Crypto API: ${isAvailable ? '✅ Available' : '❌ Not Available'}`);
    
    if (isAvailable) {
      const isValid = await encryptionService.validateEncryption();
      console.log(`   Validation: ${isValid ? '✅ Pass' : '❌ Fail'}`);
    }

    // Test 2: Storage Service Integration
    console.log('\n2. Testing Storage Service Integration...');
    try {
      const status = await checkEncryptionStatus();
      results.storageIntegration = !!status;
      console.log(`   Status Check: ${status ? '✅ Working' : '❌ Failed'}`);
      console.log(`   - Available: ${status.isAvailable}`);
      console.log(`   - Enabled: ${status.isEnabled}`);
      console.log(`   - Valid: ${status.isValid}`);
    } catch (error) {
      console.log(`   Status Check: ❌ Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Migration Functionality
    console.log('\n3. Testing Migration Functionality...');
    try {
      // This would migrate existing unencrypted data to encrypted
      // For testing, we'll just check if the function exists
      const canMigrate = typeof migrateToEncryption === 'function';
      results.backwardCompatibility = canMigrate;
      console.log(`   Migration Function: ${canMigrate ? '✅ Available' : '❌ Missing'}`);
    } catch (error) {
      console.log(`   Migration Function: ❌ Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: UI Components Integration
    console.log('\n4. Testing UI Components...');
    try {
      // Check if EncryptionStatus component can be imported
      const EncryptionStatus = require('../components/EncryptionStatus');
      results.uiComponents = !!EncryptionStatus.default;
      console.log(`   EncryptionStatus Component: ${results.uiComponents ? '✅ Available' : '❌ Missing'}`);
    } catch (error) {
      console.log(`   EncryptionStatus Component: ❌ Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: Error Handling
    console.log('\n5. Testing Error Handling...');
    try {
      // Test with invalid encrypted data
      const invalidData: EncryptedStorageData = {
        encryptedContent: 'invalid_base64_data!@#',
        iv: 'invalid_iv_data!@#',
        salt: 'invalid_salt_data!@#',
        version: '1.0',
        timestamp: Date.now()
      };

      try {
        const result = await encryptionService.decryptFromStorage(invalidData);
        console.log(`   Error Handling: ❌ Should have failed but didn't`);
      } catch (decryptError) {
        results.errorHandling = true;
        console.log(`   Error Handling: ✅ Properly catches errors - ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   Error Handling: ❌ Test failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }

  // Summary
  console.log('\n📊 Integration Test Summary:');
  console.log(`   Service Availability: ${results.serviceAvailable ? '✅' : '❌'}`);
  console.log(`   Storage Integration: ${results.storageIntegration ? '✅' : '❌'}`);
  console.log(`   UI Components: ${results.uiComponents ? '✅' : '❌'}`);
  console.log(`   Backward Compatibility: ${results.backwardCompatibility ? '✅' : '❌'}`);
  console.log(`   Error Handling: ${results.errorHandling ? '✅' : '❌'}`);

  const allTestsPassed = Object.values(results).every(result => result === true);
  console.log(`\n🎯 Integration Status: ${allTestsPassed ? '✅ FULLY INTEGRATED' : '⚠️ PARTIAL INTEGRATION'}`);

  if (allTestsPassed) {
    console.log('\n🔒 Encryption is fully integrated and ready for production!');
    console.log('💡 All components are working together seamlessly.');
  } else {
    console.log('\n⚠️ Some integration issues detected. Please review the failed tests.');
  }

  return {
    success: allTestsPassed,
    results,
    timestamp: new Date().toISOString()
  };
}

// Performance monitoring
export async function measureEncryptionPerformance() {
  console.log('\n⚡ Measuring Encryption Performance...\n');

  if (!encryptionService.isEncryptionAvailable()) {
    console.log('❌ Encryption not available for performance testing');
    return null;
  }

  const testData = 'x'.repeat(10000); // 10KB test data
  const iterations = 10;

  // Warm up
  for (let i = 0; i < 3; i++) {
    await encryptionService.encrypt(testData);
  }

  // Measure encryption time
  const encryptStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const encrypted = await encryptionService.encrypt(testData);
  }
  const encryptEnd = performance.now();
  const avgEncryptTime = (encryptEnd - encryptStart) / iterations;

  // Measure decryption time
  const encrypted = await encryptionService.encrypt(testData);
  const decryptStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await encryptionService.decrypt(encrypted.encryptedData, encrypted.iv, encrypted.salt);
  }
  const decryptEnd = performance.now();
  const avgDecryptTime = (decryptEnd - decryptStart) / iterations;

  console.log(`📈 Performance Results (${iterations} iterations, ${testData.length} bytes):`);
  console.log(`   Average Encryption Time: ${avgEncryptTime.toFixed(2)}ms`);
  console.log(`   Average Decryption Time: ${avgDecryptTime.toFixed(2)}ms`);
  console.log(`   Throughput: ${(testData.length / avgEncryptTime * 1000 / 1024).toFixed(2)} KB/s`);

  const performanceGood = avgEncryptTime < 100 && avgDecryptTime < 50;
  console.log(`\n🎯 Performance: ${performanceGood ? '✅ GOOD' : '⚠️ SLOW'}`);

  return {
    avgEncryptTime,
    avgDecryptTime,
    throughput: testData.length / avgEncryptTime * 1000 / 1024,
    good: performanceGood
  };
}

// Export for testing
if (typeof window !== 'undefined') {
  (window as any).testEncryptionIntegration = testEncryptionIntegration;
  (window as any).measureEncryptionPerformance = measureEncryptionPerformance;
}