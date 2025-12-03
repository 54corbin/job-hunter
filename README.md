# Job Hunter - AI-Powered Job Application Assistant

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)](https://chrome.google.com/webstore)
[![React](https://img.shields.io/badge/React-19.1.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/)

Job Hunter is a powerful Chrome extension that automates and streamlines your job application process. It combines AI-powered content generation with job board integration to help you discover relevant opportunities, generate tailored application materials, and track your progress efficiently.

## 🚀 Key Features

- **🤖 AI-Powered Content Generation**: Create tailored resumes, cover letters, and application answers using OpenAI, Gemini, or local Ollama models
- **📄 Multi-Resume Management**: Upload and organize multiple resume versions for different job types
- **🎯 Smart Job Matching**: Automated job discovery from Seek and LinkedIn with AI-powered compatibility scoring
- **🔒 Privacy-First Security**: AES-256-GCM encryption with local-only data storage
- **⚡ Auto-Fill Integration**: Intelligent form detection and population across job boards
- **📊 Application Tracking**: Monitor your job search progress and application history

## 🛠️ Technology Stack

- **Frontend**: React 19.1.1, TypeScript 5.8.3, Tailwind CSS 4.1.11
- **Build System**: Webpack 5.101.0, Babel, Tailwind CLI
- **Chrome Extension**: Manifest V3 with Service Worker
- **Security**: AES-256-GCM encryption with PBKDF2
- **AI Integration**: OpenAI, Google Gemini, Ollama support

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **npm** (v8 or later) - Comes with Node.js
- **Google Chrome** (latest version)
- **Git** - [Download here](https://git-scm.com/)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd job_hunter
```

### 2. Install Dependencies

The project's dependencies are located in the `extension_webpack` directory:

```bash
cd extension_webpack
npm install
```

### 3. Development Mode

For active development with live reload:

```bash
npm run start
```

This command runs both:
- Tailwind CSS watcher for style updates
- Webpack dev server for hot module replacement

### 4. Production Build

To create a production-ready build:

```bash
npm run build
```

This compiles the source code and packages it into the `extension_webpack/dist` directory.

## 🌐 Loading the Extension in Chrome

1. Open Google Chrome and navigate to `chrome://extensions`
2. Enable **"Developer mode"** using the toggle switch in the top right corner
3. Click on the **"Load unpacked"** button
4. Select the `extension_webpack/dist` directory from your project folder
5. The Job Hunter extension should now be loaded and visible in your browser's toolbar

### First-Time Setup

After loading the extension:
1. Click the Job Hunter icon in your Chrome toolbar
2. Complete the initial profile setup with your personal information
3. Upload your resume(s) in the Profile section
4. Configure your AI provider in Settings

## ⚙️ Configuration

### AI Provider Setup

Before using AI-powered features, configure at least one AI provider:

#### OpenAI Configuration

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. In the extension, go to **Settings** → **Add Provider**
3. Select **"OpenAI"** from the dropdown
4. Enter your API key
5. Choose a model (e.g., `gpt-4`, `gpt-3.5-turbo`)
6. Click **"Set as Active"**

#### Google Gemini Configuration

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. In the extension, go to **Settings** → **Add Provider**
3. Select **"Gemini"** from the dropdown
4. Enter your API key
5. Choose a model (e.g., `gemini-2.0-flash-exp`, `gemini-1.5-pro`)
6. Click **"Set as Active"**

#### Ollama (Local Models) Configuration

1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Start Ollama server: `ollama serve`
3. Pull a model: `ollama pull llama3.1`
4. In the extension, go to **Settings** → **Add Provider**
5. Select **"Ollama"** from the dropdown
6. Host URL defaults to `http://localhost:11434`
7. Click refresh to load available models
8. Select your model and click **"Set as Active"**

**Important**: Start Ollama with CORS support:
```bash
OLLAMA_ORIGINS='chrome-extension://*' ollama serve
```

### Security Setup

1. Enable **"Encryption"** in Settings
2. Set a secure passcode (minimum 4 characters)
3. This passcode encrypts all your data locally

## 📁 Project Directory Structure

### Root-Level Structure

```
job_hunter/
├── .git/                           # Git version control
├── .gitignore                      # Git ignore patterns
├── README.md                       # This file
├── description.md                  # Project description
├── privacy_policy.md              # Privacy policy
├── package.json                   # Root package configuration
├── AGENTS.md                      # OpenSpec instructions
│
├── extension_webpack/              # Main application source
│   ├── src/                       # Source code
│   │   ├── components/           # React components
│   │   ├── pages/                # Route components
│   │   ├── services/             # Business logic services
│   │   ├── content-scripts/      # Chrome extension scripts
│   │   ├── background/           # Service worker
│   │   ├── assets/               # Static resources
│   │   ├── scripts/              # Build scripts
│   │   ├── App.tsx               # Main application
│   │   ├── Root.tsx              # Application root
│   │   ├── index.tsx             # Entry point
│   │   ├── index.html            # HTML template
│   │   ├── popup.ts              # Extension popup
│   │   ├── popup.html            # Popup HTML
│   │   ├── manifest.json         # Extension manifest
│   │   ├── style.css             # Compiled styles
│   │   ├── tailwind.css          # Tailwind source
│   │   └── custom.d.ts           # TypeScript declarations
│   ├── dist/                     # Built extension (generated)
│   ├── package.json              # Dependencies
│   ├── webpack.config.js         # Build configuration
│   ├── tailwind.config.cjs       # Tailwind configuration
│   └── tsconfig.json             # TypeScript configuration
│
├── docs/                          # Project documentation
│   ├── FINAL_PROJECT_REPORT.md    # Comprehensive project report
│   ├── PROJECT_METRICS.md         # Performance metrics & results
│   ├── TECHNICAL_ARCHITECTURE.md  # Technical documentation
│   ├── prd/                      # Product Requirements Documents
│   │   ├── requirements.md        # Functional & non-functional requirements
│   │   ├── epic-*.md             # Epic documentation
│   │   ├── user-interface-enhancement-goals.md
│   │   └── technical-constraints-and-integration-requirements.md
│   ├── stories/                  # User stories
│   │   ├── 1.1.story.md
│   │   ├── 1.2.story.md
│   │   └── 1.3.story.md
│   └── architecture.md           # Architecture analysis
│
├── openspec/                      # OpenSpec system files
│   ├── AGENTS.md                  # Agent instructions
│   ├── project.md                # Project specifications
│   ├── changes/                  # Change proposals
│   │   ├── modernize-progress-button/
│   │   ├── search-filter-redesign/
│   │   ├── answer-generation-redesign/
│   │   └── archive/
│   ├── specs/                    # Detailed specifications
│   │   ├── ui-redesign/
│   │   └── webpage-integration/
│   └── proposals/                # Enhancement proposals
│       └── aes-256-gcm-encryption.md
│
├── .augment/                      # Augment system
│   └── commands/                  # Custom commands
│       ├── openspec-apply.md
│       ├── openspec-archive.md
│       └── openspec-proposal.md
│
└── .github/                      # GitHub configuration
    └── ...                       # CI/CD workflows
```

### Extension Source Structure

```
extension_webpack/src/
├── components/                   # Reusable React components
│   ├── ui/                      # Design system components
│   │   ├── Button.tsx           # Modern button with variants
│   │   ├── Card.tsx             # Content container
│   │   ├── Input.tsx            # Form inputs
│   │   ├── Modal.tsx            # Modal dialogs
│   │   ├── Header.tsx           # Page header
│   │   └── ...
│   ├── passcode/                # Authentication components
│   ├── Layout.tsx               # Main application layout
│   └── ...
│
├── pages/                       # Route components
│   ├── JobsPage.tsx             # Job discovery & matching
│   ├── ProfilePage.tsx          # User profile management
│   ├── SettingsPage.tsx         # AI provider configuration
│   ├── HistoryPage.tsx          # Application tracking
│   ├── PrivacyPolicyPage.tsx    # Privacy policy display
│   ├── DesignSystemPage.tsx     # Component documentation
│   └── AnswerGenerationPage.tsx # AI answer generation
│
├── services/                    # Business logic services
│   ├── storageService.ts        # Chrome storage with encryption
│   ├── llmService.ts            # AI provider integration
│   ├── encryptionService.ts     # AES-256-GCM encryption
│   ├── seekService.ts           # Job board API integration
│   └── errorService.ts          # Error handling framework
│
├── content-scripts/             # Chrome extension scripts
│   ├── seek.ts                  # Seek.com.au scraping
│   ├── linkedin.ts              # LinkedIn integration
│   ├── autofill.ts              # Form auto-fill
│   └── answerGeneration.ts      # Answer generation overlay
│
├── background/                  # Service worker
│   └── background.ts            # Core extension logic
│
└── assets/                      # Static resources
    ├── icons/                   # Extension icons
    └── fonts/                   # Custom fonts
```

### Documentation Structure

```
docs/
├── FINAL_PROJECT_REPORT.md      # Executive summary & results
├── PROJECT_METRICS.md           # KPIs & performance data
├── TECHNICAL_ARCHITECTURE.md    # System architecture
└── prd/                         # Product requirements
    ├── requirements.md          # Functional & non-functional
    ├── epic-1-ui-ux-overhaul.md # UI/UX redesign specifications
    ├── epic-2-multiple-resume-support.md
    ├── user-interface-enhancement-goals.md
    └── technical-constraints-and-integration-requirements.md
```

## 🏗️ Architecture Overview

### Key Architectural Patterns

The Job Hunter extension follows several key architectural patterns:

### 1. Service-Oriented Architecture
- **Separation of Concerns**: Business logic isolated from UI components
- **Single Source of Truth**: Centralized service layer for data operations
- **Dependency Injection**: Services communicate through well-defined interfaces

### 2. Privacy-by-Design Architecture
- **Local-First Storage**: All data remains on user's device
- **Encryption at Rest**: AES-256-GCM for sensitive information
- **Zero-Trust Security**: No server-side data processing

### 3. Multi-Provider AI Abstraction
- **Provider Agnostic**: Support for OpenAI, Gemini, and Ollama
- **Fallback Strategy**: Graceful degradation when providers fail
- **Cost Optimization**: User-controlled provider selection

### 4. Chrome Extension Integration
- **Manifest V3 Compliance**: Modern extension architecture
- **Content Script Isolation**: Secure job board integration
- **Service Worker**: Background processing and coordination

### Core Services

#### Storage Service (`storageService.ts`)
- Chrome storage API wrapper with encryption support
- Profile and job data management with local-first architecture
- Multiple resume storage with parsing and extraction
- Backward compatibility with legacy unencrypted data

#### LLM Service (`llmService.ts`)
- Multi-provider AI integration (OpenAI, Gemini, Ollama)
- Content generation with comprehensive error handling and retries
- Model selection and API management with cost optimization
- Job matching and compatibility scoring using semantic analysis

#### Encryption Service (`encryptionService.ts`)
- AES-256-GCM encryption using Web Crypto API
- PBKDF2 key derivation (100,000 iterations) with unique salt per operation
- Secure passcode-based key management with session cleanup
- Zero-knowledge architecture where even extension cannot access user data

## 🔒 Security Architecture

### Encryption Implementation

The extension implements a multi-layer security approach:

1. **Key Derivation**: User passcode → PBKDF2 (100K iterations) → AES-256-GCM key
2. **Data Encryption**: All sensitive data encrypted before Chrome storage
3. **Session Management**: Temporary keys cleared on extension restart
4. **Backward Compatibility**: Graceful handling of unencrypted legacy data

### Data Protection

- **Local-Only Storage**: No data transmitted to external servers
- **API Key Security**: All API keys encrypted before storage
- **User Data Sovereignty**: Complete user control over personal information
- **Privacy Compliance**: No tracking or analytics collection

## 🧪 Testing & Quality Assurance

### Manual Testing Checklist

#### Profile Setup
- [ ] User can create profile with personal information
- [ ] Resume upload and parsing works correctly
- [ ] Multiple resumes can be managed
- [ ] Encryption setup functions properly

#### Job Discovery
- [ ] Job scraping from Seek.com.au works
- [ ] Job scraping from LinkedIn works
- [ ] AI job matching generates scores
- [ ] Job filtering and search functions

#### Content Generation
- [ ] Resume tailoring for specific jobs
- [ ] Cover letter generation
- [ ] Application question answers
- [ ] AI provider error handling

#### Security Features
- [ ] Passcode protection works
- [ ] Data encryption/decryption functions
- [ ] Session management works correctly
- [ ] No data leaks or exposures

### Testing Commands

```bash
# Run development server
npm run start

# Build for production testing
npm run build

# Load unpacked extension in Chrome
# Navigate to chrome://extensions/ and load extension_webpack/dist
```

## 🚀 Development Guidelines

### Code Style

- **TypeScript Strict Mode**: All code written with strict type checking
- **Functional Components**: React hooks pattern for state management
- **Service Layer**: Business logic separated from UI components
- **Error Handling**: Comprehensive try-catch blocks with user feedback

### Naming Conventions

- **Components**: PascalCase (e.g., `ProfileForm.tsx`)
- **Services**: camelCase (e.g., `storageService.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)
- **Files**: kebab-case for non-component files

### Git Workflow

- **Branching**: Feature-based (`feature/resume-management`)
- **Commits**: Conventional Commits format
- **Review**: Code review required before merge
- **Testing**: Manual testing before production deployment

## 📚 Additional Documentation

- **[Final Project Report](docs/FINAL_PROJECT_REPORT.md)**: Comprehensive project methodology, results, and future recommendations
- **[Architecture Document](docs/architecture.md)**: Detailed technical architecture analysis
- **[Product Requirements](docs/prd.md)**: Complete feature specifications and requirements
- **[Privacy Policy](privacy_policy.md)**: Data handling and privacy information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone <your-fork-url>
cd job_hunter

# Install dependencies
cd extension_webpack
npm install

# Start development server
npm run start
```

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support & Troubleshooting

### Common Issues

#### Extension Won't Load
- Ensure you're loading the `dist` directory, not `src`
- Check Chrome developer mode is enabled
- Verify all dependencies are installed

#### AI Features Not Working
- Verify API key is correctly configured
- Check internet connection
- Ensure selected model is available

#### Job Scraping Fails
- Ensure you're on supported job board pages
- Check Chrome extension permissions
- Verify job board hasn't changed their HTML structure

#### Encryption Issues
- Ensure passcode is set and remembered
- Check if encryption is enabled in settings
- Try clearing extension data and re-setup

### Getting Help

- Check the [troubleshooting section](#common-issues)
- Review the [architecture documentation](docs/architecture.md)
- Open an issue on GitHub for bugs or feature requests
- Consult the [Final Project Report](docs/FINAL_PROJECT_REPORT.md) for detailed technical information

## 🗺️ Roadmap

### Version 1.1 (Upcoming)
- [ ] Enhanced job board support (Indeed, Glassdoor)
- [ ] Mobile optimization
- [ ] Advanced analytics dashboard
- [ ] Interview preparation features

### Version 1.2 (Future)
- [ ] Team collaboration features
- [ ] Enterprise integrations
- [ ] Custom AI model training
- [ ] Advanced reporting tools

---

**Built with ❤️ for job seekers worldwide**
