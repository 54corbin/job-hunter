# Job Hunter Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the Job Hunter Chrome Extension codebase, focusing on the frontend architecture. It is specifically tailored to guide the UI/UX overhaul outlined in the `prd.md`. It serves as a reference for AI agents working on the enhancement.

### Document Scope

This document is focused on the frontend application located in the `extension_webpack` directory, which is the target for the UI/UX overhaul.

### Change Log

| Date          | Version | Description                 | Author    |
|---------------|---------|-----------------------------|-----------|
| Aug 1, 2025   | 1.0     | Initial brownfield analysis | Winston   |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

*   **Main Entry**: `extension_webpack/src/index.tsx` - Renders the main React application.
*   **Root Component**: `extension_webpack/src/App.tsx` - Manages routing, the lock screen state, and the main layout.
*   **Configuration**:
    *   `extension_webpack/webpack.config.js` - Webpack configuration for building the extension.
    *   `extension_webpack/tailwind.config.js` - Configuration for the Tailwind CSS utility-first framework.
    *   `extension_webpack/tsconfig.json` - TypeScript compiler options.
*   **Core Business Logic (Services)**:
    *   `extension_webpack/src/services/storageService.ts` - Handles all interactions with `chrome.storage`.
    *   `extension_webpack/src/services/llmService.ts` - Manages communication with a Large Language Model.
*   **Routing**: `extension_webpack/src/App.tsx` - Contains the `react-router-dom` `HashRouter` and route definitions.
*   **Layout & Navigation**:
    *   `extension_webpack/src/components/Layout.tsx` - The main layout component containing the navigation.
    *   `extension_webpack/src/components/Nav.tsx` - The primary navigation component.

### Enhancement Impact Areas (UI/UX Overhaul)

The UI/UX overhaul will primarily affect the following areas:

*   **All `.tsx` files within `extension_webpack/src/pages/`**: These will be redesigned.
*   **All `.tsx` files within `extension_webpack/src/components/`**: These will be redesigned or replaced with new, standardized components.
*   **`extension_webpack/src/globals.css`**: This will be updated with the new base styles and Tailwind CSS configuration.
*   **`extension_webpack/tailwind.config.js`**: This will be updated with the new design system tokens (colors, fonts, spacing).

## High Level Architecture

### Technical Summary

The project is a single-page application (SPA) built with React and TypeScript, bundled with Webpack to function as a Chrome Extension. It uses `react-router-dom` with a `HashRouter` for client-side navigation. State management appears to be handled locally within components and through React Context, without a dedicated state management library like Redux. The application's styling is managed by Tailwind CSS.

### Actual Tech Stack

| Category      | Technology         | Version  | Notes                                         |
|---------------|--------------------|----------|-----------------------------------------------|
| UI Library    | React              | ^19.1.1  | Core of the user interface.                   |
| Language      | TypeScript         | ^5.8.3   | Provides static typing for the codebase.      |
| Styling       | Tailwind CSS       | ^4.1.11  | Utility-first CSS framework.                  |
| Bundler       | Webpack            | ^5.101.0 | Compiles and bundles the application assets.  |
| Routing       | React Router       | ^7.7.1   | Client-side routing using `HashRouter`.       |
| Icons         | React Icons        | ^5.5.0   | Library for including icons.                  |
| Utilities     | crypto-js          | ^4.2.0   | Used for passcode hashing.                    |

### Repository Structure Reality Check

*   **Type**: Monorepo (contains both the legacy `extension` and the current `extension_webpack` projects).
*   **Package Manager**: npm
*   **Notable**: The project has a legacy `extension` directory. The Webpack config in `extension_webpack` copies assets from `extension/public`, indicating a dependency on these legacy files.

## Source Tree and Module Organization

### Project Structure (Actual)

```text
extension_webpack/
└── src/
    ├── components/         # Reusable React components (e.g., Layout, Nav).
    │   ├── passcode/       # Components related to the passcode lock screen.
    │   ├── Layout.tsx
    │   └── Nav.tsx
    ├── pages/              # Top-level page components for each route.
    │   ├── HomePage.tsx
    │   ├── HistoryPage.tsx
    │   ├── ...
    ├── services/           # Business logic and external integrations.
    │   ├── llmService.ts
    │   └── storageService.ts
    ├── App.tsx             # Root component with routing and lock screen logic.
    ├── globals.css         # Global styles and Tailwind CSS directives.
    ├── index.html          # HTML template for the Webpack build.
    └── index.tsx           # Main entry point for the React application.
```

### Key Modules and Their Purpose

*   **`App.tsx`**: The root of the application. It initializes the router, manages the lock screen visibility based on user activity and settings, and defines the overall page layout.
*   **`components/`**: Contains reusable UI components. Currently, this is limited to the main `Layout`, `Nav`, and `PasscodeComponent`. The UI overhaul will involve creating a new `components/ui` subdirectory for standardized components like `Button`, `Card`, and `Input`.
*   **`pages/`**: Each file corresponds to a major view in the application (e.g., `HomePage`, `SettingsPage`). These are the primary targets for the redesign.
*   **`services/`**: This directory separates the core application logic from the UI.
    *   `storageService.ts`: Provides an abstraction layer for interacting with `chrome.storage`, handling all data persistence for profiles, settings, and job history.
    *   `llmService.ts`: Contains the logic for making requests to a Large Language Model.

## Data Models and APIs

### Data Models

The application does not have formal data models in the traditional sense. Data structures are defined implicitly through the TypeScript interfaces used in the `storageService.ts` and throughout the application. The core data entities are: `UserProfile`, `Job`, and `Settings`.

### API Specifications

*   **Internal APIs**: The `storageService.ts` and `llmService.ts` files serve as the internal API for the UI components. The UI overhaul should not require any changes to the function signatures within these services.
*   **External APIs**: The `llmService.ts` interacts with an external LLM API. The details of this API are not specified in the code.

## Technical Debt and Known Issues

*   **Lack of a Component Library**: The current UI lacks a standardized, reusable component library, leading to inconsistent styling (as seen in the screenshot). The UI overhaul will address this by creating a new library in `src/components/ui`.
*   **No Automated Tests**: The project has no automated testing framework configured. All verification must be done manually.
*   **Dependency on Legacy Assets**: The build process copies files from the `../extension/public` directory. This creates a dependency on a legacy part of the project and could be a point of failure if not managed carefully.
*   **Styling is Basic**: The current Tailwind CSS implementation is minimal and does not define a design system (e.g., custom colors, fonts, spacing).

## Development and Deployment

### Local Development Setup

1.  Navigate to the `extension_webpack` directory.
2.  Run `npm install` to install dependencies.
3.  Run `npm start` to start the Webpack dev server.

### Build and Deployment Process

*   **Build Command**: `npm run build` within the `extension_webpack` directory.
*   **Deployment**: The generated `dist` directory is loaded as an unpacked extension in Chrome.

## Enhancement Impact Analysis (UI/UX Overhaul)

### Files That Will Need Modification

*   All `.tsx` files in `src/pages/` and `src/components/`.
*   `src/globals.css` will be updated with new base styles.
*   `tailwind.config.js` will be updated with the new design system tokens.
*   `App.tsx` will be updated to use the new `Layout` and navigation components.

### New Files/Modules Needed

*   A new directory `src/components/ui/` will be created.
*   New files for each standardized component will be created within `src/components/ui/` (e.g., `Button.tsx`, `Card.tsx`, `Input.tsx`, `Modal.tsx`, `Header.tsx`, `Sidebar.tsx`).

### Integration Considerations

*   The new component library must be built with reusability and consistency in mind.
*   The new components must correctly interface with the existing props and data flow from the page-level components.
*   The existing application logic in the `services` directory must not be altered.
*   The routing structure defined in `App.tsx` must be preserved.
