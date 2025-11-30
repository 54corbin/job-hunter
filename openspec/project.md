# Project Context

## Purpose
Job Hunter is a Chrome extension that automates and streamlines the job application process. It helps users manage multiple resumes, discover relevant job opportunities from job boards like Seek and LinkedIn, and generates AI-powered tailored content (resumes, cover letters, answers) for specific job applications.

## Tech Stack
- **Frontend Framework**: React 19.1.1, React DOM, React Router DOM 7.7.1
- **Language**: TypeScript 5.8.3 with strict typing
- **Styling**: Tailwind CSS 4.1.11 with Tailwind Typography plugin
- **Build Tools**: Webpack 5.101.0, Webpack CLI, Webpack Dev Server 5.2.2
- **Babel**: @babel/core 7.28.0, @babel/preset-env, @babel/preset-react, @babel/preset-typescript
- **Chrome Extension**: Manifest V3 with service worker background scripts
- **PDF Processing**: PDF-lib 1.17.1, jsPDF 2.5.2, html2canvas 1.4.1
- **Markdown**: Marked 12.0.2, React Markdown 10.1.0
- **UI Icons**: React Icons 5.5.0 (Feather icons set)
- **Development**: TypeScript loader, CSS loader, style loader, mini-css-extract-plugin
- **Content Security**: Crypto-js 4.2.0 for encryption
- **HTML to Markdown**: html-to-md 0.8.8

## Project Conventions

### Code Style
- **TypeScript Strict Mode**: All code written with strict TypeScript configuration
- **Component Architecture**: Functional components with hooks, no class components
- **File Organization**: Feature-based directory structure in `src/`
  - `components/` - React components
  - `services/` - Business logic and API services
  - `pages/` - Route components
  - `background/` - Chrome extension background scripts
  - `content-scripts/` - Content scripts for job board scraping
- **Naming Conventions**: 
  - Components: PascalCase (e.g., `ProfileForm.tsx`)
  - Services: camelCase (e.g., `storageService.ts`)
  - Files: kebab-case for non-component files
- **React Patterns**: 
  - Custom hooks for reusable logic
  - Context API for global state management
  - Props interface definitions for all components
- **CSS Classes**: Tailwind CSS utility-first approach with custom classes only when needed

### Architecture Patterns
- **Chrome Extension Architecture**: 
  - Manifest V3 with service worker background script
  - Content scripts injected into job board pages (Seek.com.au, LinkedIn)
  - React app running in extension popup with React Router for navigation
- **Service Layer Pattern**: Business logic separated into services
  - `storageService.ts` - Chrome storage API wrapper with encryption
  - `llmService.ts` - Multi-provider AI integration (OpenAI, Gemini, Ollama)
  - `jobScrapingService.ts` - Job board data extraction
- **State Management**: React Context + useState for local component state
- **Data Flow**: Unidirectional data flow with services as single source of truth
- **Error Handling**: Try-catch blocks with user-friendly error messages in UI

### Testing Strategy
- **Current State**: No automated tests implemented (noted in PRD as out of scope)
- **Testing Approach**: Manual testing through Chrome extension debugging
- **Future Requirements**: Unit tests for services, integration tests for UI components
- **Test Environment**: Local development with webpack-dev-server for live reloading

### Git Workflow
- **Branching Strategy**: Feature-based branching (`feature/resume-management`, `fix/ui-bugs`)
- **Commit Convention**: Conventional Commits format
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `refactor:` - Code refactoring
  - `docs:` - Documentation updates
  - `style:` - Formatting changes
- **Code Review**: Manual review process before merging
- **Task Management**: Taskmaster integration for development workflow tracking

## Domain Context
- **Job Application Automation**: Extension detects job applications on supported sites and auto-fills forms
- **Resume Management**: Users maintain multiple resume versions for different job types/applications
- **AI Content Generation**: LLM integration for generating personalized content based on job descriptions
- **Job Discovery**: Automated scraping and AI-powered job matching/scoring
- **Privacy & Security**: Local data storage with encryption, no server-side data transmission
- **Supported Platforms**: 
  - Job Boards: Seek.com.au, LinkedIn.com, Indeed, Glassdoor, ZipRecruiter
  - AI Providers: OpenAI GPT models, Google Gemini, local Ollama instances
- **User Workflow**: 
  1. Setup profile with personal information and multiple resumes
  2. Configure AI provider settings
  3. Browse job listings on supported sites
  4. Use auto-fill and AI generation features
  5. Track application history

## Important Constraints
- **Chrome Extension Manifest V3**: Must comply with MV3 security requirements and limitations
- **CORS Restrictions**: Must use appropriate permissions and host permissions for job board access
- **Local Storage Only**: All user data stored locally using Chrome storage API (no backend)
- **API Key Security**: User API keys encrypted before storage, never transmitted to third parties
- **Performance**: Extension must not slow down browser performance during job board navigation
- **Cross-Origin Limitations**: Content scripts cannot access extension APIs directly, must use messaging
- **Content Security Policy**: Must comply with extension CSP restrictions for injected scripts
- **AI Provider Limits**: Subject to rate limits and costs of chosen AI provider
- **Job Board Changes**: Scraping logic may break if target sites change their HTML structure

## External Dependencies
- **AI Providers**:
  - OpenAI API (GPT-4 models) - Primary AI provider for content generation
  - Google Gemini API (Gemini 2.5 Pro) - Alternative AI provider
  - Ollama (local) - Local LLM hosting for privacy-conscious users
- **Job Board APIs**:
  - Seek.com.au - Australian job listings with content script scraping
  - LinkedIn.com - Professional network job listings with content script scraping
  - Additional supported: Indeed, Glassdoor, ZipRecruiter
- **Development Tools**:
  - Node.js and npm - Build dependencies and tooling
  - Webpack - Module bundling and build process
  - Babel - JavaScript/TypeScript transpilation
  - Tailwind CSS - Utility-first CSS framework
- **Browser APIs**: Chrome Extension APIs (storage, scripting, contextMenus, downloads)
- **File Processing**: PDF parsing and generation libraries for resume handling

## Development Environment Configuration
- **Task Management**: Taskmaster AI integration with Google Gemini (main), OpenAI (research/fallback)
- **Multiple IDE Support**: Configurations for Claude Code, Cursor, Windsurf, Roo Code
- **Build Commands**: 
  - Development: `npm run start` (concurrent Tailwind + Webpack dev server)
  - Production: `npm run build` (Tailwind compilation + Webpack production build)
- **Development Port**: Webpack dev server runs on development mode for live reloading
