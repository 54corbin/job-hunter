# Job Hunter

Job Hunter is a powerful Chrome extension designed to streamline and automate your job application process. It helps you manage your professional profile, tailor your resumes and cover letters using AI, and discover relevant job opportunities from platforms like Seek and LinkedIn.

## Features

-   **Centralized Profile Management:** Keep your personal information, work experience, education, and skills in one place.
-   **Multiple Resume Support:** Manage and use different versions of your resume for different job applications.
-   **Automated Job Discovery:** Automatically find and score job listings from Seek and LinkedIn based on your active resume.
-   **AI-Powered Content Generation:**
    -   Generate tailored resumes and cover letters for specific job descriptions.
    -   Supports multiple AI providers: OpenAI, Google Gemini, and local Ollama instances.
-   **Secure:** Protect your sensitive information with a passcode lock.

## Tech Stack

-   **Frontend:** React, TypeScript, Tailwind CSS
-   **Build Tool:** Webpack
-   **Platform:** Chrome Extension Manifest V3

## Getting Started

Follow these instructions to get the extension up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/)

### Installation & Build

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd job_hunter
    ```

2.  **Install dependencies:**
    The project's dependencies are located in the `extension_webpack` directory.
    ```bash
    cd extension_webpack
    npm install
    ```

3.  **Build the extension:**
    To build the extension, run the following command from within the `extension_webpack` directory:
    ```bash
    npm run build
    ```
    This will compile the source code and package it into the `extension_webpack/dist` directory.

### Loading the Extension in Chrome

1.  Open Google Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** using the toggle switch in the top right corner.
3.  Click on the **"Load unpacked"** button.
4.  Select the `extension_webpack/dist` directory from the project folder.
5.  The Job Hunter extension should now be loaded and visible in your browser's toolbar.

## Configuration

Before you can use the AI-powered features, you need to configure an AI provider in the extension's settings page.

1.  Click on the Job Hunter icon in the Chrome toolbar to open the extension.
2.  Navigate to the **Settings** page.

### OpenAI / Gemini

1.  Click **"Add Provider"**.
2.  Select "OpenAI" or "Gemini" from the dropdown.
3.  Enter your API key.
4.  Select a model from the list.
5.  Click **"Set as Active"**.

### Ollama (for local models)

1.  Click **"Add Provider"**.
2.  Select "Ollama" from the dropdown.
3.  The host URL will default to `http://localhost:11434`. Adjust it if your Ollama server runs on a different address.
4.  Click the refresh icon next to the model dropdown to fetch the list of your locally available models.
5.  Select a model.
6.  Click **"Set as Active"**.

**Important:** For Ollama to work, you need to configure it to allow requests from the extension. Start your Ollama server with the `OLLAMA_ORIGINS` environment variable set to allow the extension's origin.

```bash
# Allow any Chrome extension (easiest for development)
OLLAMA_ORIGINS='chrome-extension://*' ollama serve
```

## Usage

-   **Profile Page:** Fill out your personal information, work experience, education, and skills. Upload one or more resumes.
-   **Jobs Page:** Select a resume to see a list of recommended jobs. Click "Find Matching Jobs" to refresh the list. Use the AI actions on each job card to generate tailored resumes and cover letters.
-   **Settings Page:** Configure your AI providers and passcode settings.

---
