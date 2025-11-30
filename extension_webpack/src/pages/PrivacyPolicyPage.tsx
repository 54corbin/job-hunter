import React, { useState, useEffect } from 'react';

const PrivacyPolicyPage: React.FC = () => {
  const [policy, setPolicy] = useState('');

  useEffect(() => {
    const policyText = `
# Privacy Policy for Job Hunter

**Last Updated:** 2025-06-29

This Privacy Policy describes how Job Hunter ("we," "us," or "our") collects, uses, and discloses your information.

## Information We Collect

We collect the following information:

*   **User Profile Data:** All the information you provide in the extension's profile section, including your name, email, phone number, work experience, education, and skills.
*   **LLM API Key:** Your API key for the Large Language Model (LLM) provider you choose to use.
*   **Tracked Applications:** A list of jobs you've applied to using the extension, including the job title, company, and date applied.

## How We Use Your Information

We use the information we collect to:

*   Provide and improve the extension's services.
*   Auto-fill job applications on your behalf.
*   Generate AI-powered content, such as cover letters and answers to application questions.
*   Track your application history.

## How We Store Your Information

All of your data is stored locally on your computer. Your LLM API key is encrypted before being stored. We do not transmit any of your personal data to our servers.

## Third-Party Services

We use the following third-party services:

*   **Large Language Model (LLM) Provider:** We send your profile information and job descriptions to your chosen LLM provider to generate content. We are not responsible for the privacy practices of these providers. Please review their privacy policies before use.

## Contact Us

If you have any questions about this Privacy Policy, please contact us at [Your Contact Information].
`;
    setPolicy(policyText);
  }, []);

  return (
    <div className="bg-white/80 p-8 rounded-3xl shadow-xl backdrop-blur-lg">
      <h1 className="text-5xl font-bold mb-6 text-slate-800">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none">
        <pre className="whitespace-pre-wrap font-sans text-slate-700 bg-transparent p-0">
          {policy}
        </pre>
        <p className="whitespace-pre-wrap font-sans text-slate-700">All of your data is stored locally on your computer using <code>chrome.storage.local</code>. Your LLM API key is encrypted before being stored. We do not transmit any of your personal data to our servers.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
