/**
 * Encryption Service Tests
 * Verifies AES-256-GCM encryption functionality
 */

import { encryptionService, encryptData, decryptData } from '../services/encryptionService';

// Test data
const testData = {
  simple: 'Hello, World!',
  complex: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    experience: ['Company A', 'Company B'],
    skills: ['JavaScript', 'Python', 'React'],
    personalInfo: {
      phone: '123-456-7890',
      address: '123 Main St'
    }
  }),
  resume: `John Doe
Senior Software Engineer

Experience:
- Software Engineer at TechCorp (2020-2023)
- Junior Developer at StartupXYZ (2018-2020)

Skills:
- JavaScript, TypeScript, React, Node.js
- Python, Django, Flask
- AWS, Docker, Kubernetes

Education:
- Bachelor of Computer Science, University of Technology (2018)`
};

async function runEncryptionTests() {
  console.log('🧪 Starting Encryption Tests...\n');

  // Test 1: Environment Check
  console.log('1. Environment Check:');
  const isAvailable = encryptionService.isEncryptionAvailable();
  console.log(`   Web Crypto API Available: ${isAvailable ? '✅' : '❌'}`);
  
  if (!isAvailable) {
    console.log('   ⚠️  Skipping encryption tests - Web Crypto API not available');
    return;
  }

  try {
    // Test 2: Basic Encryption/Decryption
    console.log('\n2. Basic Encryption/Decryption:');
    const testString = testData.simple;
    console.log(`   Original: "${testString}"`);
    
    const encrypted = await encryptData(testString);
    console.log(`   Encrypted (Base64): ${encrypted.encryptedData.substring(0, 50)}...`);
    console.log(`   IV (Base64): ${encrypted.iv.substring(0, 20)}...`);
    console.log(`   Salt (Base64): ${encrypted.salt.substring(0, 20)}...`);
    
    const decrypted = await decryptData(encrypted.encryptedData, encrypted.iv, encrypted.salt);
    console.log(`   Decrypted: "${decrypted}"`);
    console.log(`   ✅ Match: ${testString === decrypted ? 'SUCCESS' : 'FAILED'}`);

    // Test 3: Complex Data Encryption
    console.log('\n3. Complex Data Encryption:');
    const complexData = testData.complex;
    const complexEncrypted = await encryptData(complexData);
    const complexDecrypted = await decryptData(
      complexEncrypted.encryptedData, 
      complexEncrypted.iv, 
      complexEncrypted.salt
    );
    
    const complexMatch = complexData === complexDecrypted;
    console.log(`   ✅ Complex Data Match: ${complexMatch ? 'SUCCESS' : 'FAILED'}`);
    
    if (!complexMatch) {
      console.log('   Original length:', complexData.length);
      console.log('   Decrypted length:', complexDecrypted.length);
    }

    // Test 4: Resume Data Encryption
    console.log('\n4. Resume Data Encryption:');
    const resumeData = testData.resume;
    const resumeEncrypted = await encryptData(resumeData);
    const resumeDecrypted = await decryptData(
      resumeEncrypted.encryptedData, 
      resumeEncrypted.iv, 
      resumeEncrypted.salt
    );
    
    const resumeMatch = resumeData === resumeDecrypted;
    console.log(`   ✅ Resume Data Match: ${resumeMatch ? 'SUCCESS' : 'FAILED'}`);

    // Test 5: Integrity Validation
    console.log('\n5. Encryption Integrity Validation:');
    const isValid = await encryptionService.validateEncryption();
    console.log(`   ✅ Integrity Check: ${isValid ? 'PASSED' : 'FAILED'}`);

    // Test 6: Performance Test
    console.log('\n6. Performance Test:');
    const iterations = 10;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await encryptData(testData.simple);
    }
    
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / iterations;
    console.log(`   Average Encryption Time: ${avgTime.toFixed(2)}ms`);
    console.log(`   ✅ Performance: ${avgTime < 100 ? 'GOOD' : 'SLOW'}`);

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Environment: ${isAvailable ? 'Ready' : 'Not Available'}`);
    console.log(`   Basic Test: ${testString === decrypted ? 'PASS' : 'FAIL'}`);
    console.log(`   Complex Test: ${complexMatch ? 'PASS' : 'FAIL'}`);
    console.log(`   Resume Test: ${resumeMatch ? 'PASS' : 'FAIL'}`);
    console.log(`   Integrity Test: ${isValid ? 'PASS' : 'FAIL'}`);
    console.log(`   Performance: ${avgTime < 100 ? 'GOOD' : 'SLOW'} (${avgTime.toFixed(2)}ms avg)`);

    const allTestsPassed = testString === decrypted && complexMatch && resumeMatch && isValid;
    console.log(`\n🎯 Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);

    if (allTestsPassed) {
      console.log('\n🔒 Encryption Service is working correctly!');
      console.log('💡 Ready to protect user data with AES-256-GCM encryption.');
    } else {
      console.log('\n⚠️  Encryption Service has issues. Please check the implementation.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.log('💡 Check browser console for detailed error information.');
  }
}

// Run tests if in browser environment
if (typeof window !== 'undefined') {
  // Add to global scope for easy testing
  (window as any).runEncryptionTests = runEncryptionTests;
  
  // Auto-run if requested
  if (window.location.search.includes('test-encryption=true')) {
    document.addEventListener('DOMContentLoaded', runEncryptionTests);
  }
}

export { runEncryptionTests };