# Job Hunter Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Existing Project Overview

#### Analysis Source

*   IDE-based fresh analysis

#### Current Project State

The project is a Chrome Extension built with React, TypeScript, and Webpack. It helps users automate job applications. The main application logic resides in the `extension_webpack` directory and follows a standard React structure. It uses Tailwind CSS for styling and includes services for interacting with an LLM and managing storage.

### Available Documentation Analysis

#### Available Documentation

*   [ ] Tech Stack Documentation
*   [ ] Source Tree/Architecture
*   [ ] Coding Standards
*   [ ] API Documentation
*   [ ] External API Documentation
*   [ ] UX/UI Guidelines
*   [ ] Technical Debt Documentation
*   [ ] "Other: None"

### Enhancement Scope Definition

#### Enhancement Type

*   [x] UI/UX Overhaul
*   [x] New Feature Addition

#### Enhancement Description

The goal is to modernize the existing user interface to make it more visually appealing, intuitive, and user-friendly. This involves a significant redesign of the current UI components and layout.

A new feature for managing multiple resumes will also be added, allowing users to store and select from various resume versions for their job applications. Additionally, a job fetching and matching feature will be implemented to find relevant job postings from external sites like Seek and LinkedIn.

#### Impact Assessment

*   [x] Significant Impact (substantial existing code changes)

### Goals and Background Context

#### Goals

*   Improve the overall visual appeal of the application.
*   Enhance the user experience (UX) to make it more intuitive.
*   Increase user engagement and satisfaction through a modern design.
*   Provide users the flexibility to tailor applications with different resumes.
*   Proactively find and recommend relevant job opportunities to the user.
*   Ensure the new UI is responsive and accessible.

#### Background Context

The current UI is functional but lacks modern design aesthetics. A UI/UX overhaul will bring the application up to modern standards, making it more competitive and enjoyable for users. This enhancement will focus on redesigning the visual elements and improving the overall user flow without changing the core functionality.

## Requirements

### Functional

*   **FR1:** All existing features must be fully accessible and functional within the new user interface.
*   **FR2:** The application's navigation must be redesigned to be more intuitive.
*   **FR3:** All forms for user input will be redesigned for improved usability and clarity.
*   **FR4:** Data displays will be redesigned to be more organized and visually engaging.

#### Multiple Resume Management
*   **FR5:** Users shall be able to upload multiple resume files to their profile.
*   **FR6:** Users shall be able to view a list of all their uploaded resumes.
*   **FR7:** Users shall be able to assign a unique name or label to each resume for easy identification.
*   **FR8:** Users shall be able to delete resumes from their profile.
*   **FR9:** Users shall be able to select a specific resume to be used for a job application.

#### Job Fetching and Matching
*   **FR10:** The extension shall be able to scrape job listings from Seek.com.au and LinkedIn.com.
*   **FR11:** The scraped job listings shall be compared against a user-selected resume using an LLM to determine a match score.
*   **FR12:** The matched jobs, along with their scores, shall be displayed on the "Recommended Jobs" page.
*   **FR13:** Users shall be able to trigger the job fetching process manually from the "Recommended Jobs" page.


### Non-Functional

*   **NFR1:** The UI will adopt a modern, clean, and professional aesthetic based on Material Design principles.
*   **NFR2:** The application must be fully responsive.
*   **NFR3:** A consistent design system will be applied.
*   **NFR4:** All interactive elements must provide clear visual feedback.
*   **NFR5:** The UI will adhere to WCAG 2.1 Level AA standards.

### Compatibility Requirements

*   **CR1: API/Service Compatibility:** The new UI must integrate seamlessly with the existing services.
*   **CR2: Data Schema Compatibility:** The redesigned UI must not introduce any breaking changes to the data structures, with the exception of the UserProfile, which will be updated to support an array of resumes. This change must be backward compatible.
*   **CR3: UI/UX Consistency:** The new design will establish a clear visual identity.
*   **CR4: Routing Compatibility:** The existing routing structure will be preserved.

## User Interface Enhancement Goals

### Integration with Existing UI

The new UI will be a complete replacement of the existing component styles, leveraging the existing component structure but replacing the styling with a new design system.

### Modified/New Screens and Views

*   Lock Screen
*   Main Application Layout
*   Dashboard/Home Page
*   Profiles Page
*   Job History Page
*   Settings Page

### UI Consistency Requirements

*   A new, modern color palette will be defined.
*   A clear and readable typography scale will be established.
*   A set of standardized, reusable components will be created.

## Technical Constraints and Integration Requirements

### Existing Technology Stack

*   **Languages**: TypeScript, JavaScript
*   **Frameworks**: React, Tailwind CSS
*   **Bundler**: Webpack

### Integration Approach

*   The UI will continue to interact with the existing services and data storage without changes.
*   The new UI will be built by replacing the styling of existing React components.

### Code Organization and Standards

*   We will adhere to the existing file structure and create a new `src/components/ui` directory for new, standardized components.
*   We will follow existing coding standards and naming conventions.

### Deployment and Operations

*   The existing Webpack build process and deployment strategy will be used.

### Risk Assessment and Mitigation

*   **Risks**: Visual regressions, inconsistencies, breaking data flow.
*   **Mitigation**: Develop a style guide, create reusable components, and conduct thorough manual testing.

## Epic and Story Structure

### Epic Approach

This enhancement will be structured as a single, comprehensive epic to ensure a consistent design vision.

## Epic 1: UI/UX Overhaul

**Epic Goal**: To completely redesign and modernize the user interface.

**Stories**:

1.  **Establish Design System & Base Components**: Create the foundational design system and core reusable UI components.
2.  **Redesign the Main App Layout & Navigation**: Implement the new main layout with intuitive navigation.
3.  **Redesign the Lock Screen & Dashboard**: Redesign the initial screen and the main dashboard.
4.  **Redesign the Profiles & Settings Pages**: Redesign the forms and layouts for managing profiles and settings.
5.  **Redesign the Job History Page**: Redesign the page for tracking job applications.

## Epic 2: Multiple Resume Support

**Epic Goal**: To allow users to upload, store, and manage multiple resumes within their profile, enabling them to select the most relevant resume for each job application.

**Stories**:

1.  **Update Data Structure for Multiple Resumes**: Modify the `UserProfile` data structure in `storageService.ts` to support an array of resumes.
2.  **Implement Resume Upload and Management UI**: Create the UI for users to upload, name, and delete multiple resumes in the Profile/Settings page.
3.  **Integrate Resume Selection into Application Flow**: Add a mechanism for users to select which resume to use when initiating a new job application.

## Epic 3: Job Fetching and Matching

**Epic Goal**: To automate the discovery of relevant job opportunities by fetching listings from external job sites and matching them against the user's resume.

**Stories**:

1.  **Develop Content Scripts for Job Scraping**: Create and inject content scripts for Seek.com.au and LinkedIn.com to extract job listing data.
2.  **Implement Job Matching Logic**: In the background script, process the scraped job data, send it to the LLM service along with the selected resume, and calculate a match score.
3.  **Store and Display Matched Jobs**: Save the matched jobs and their scores to storage and display them on the "Recommended Jobs" page.


## Out of Scope

*   Changes to core functionality.
*   Backend or service changes.
*   Automated testing.
*   Major architectural changes.

## Open Questions

*   Are there any specific design inspirations or existing applications whose aesthetic you would like to emulate for the new UI?
*   Do you have any existing brand guidelines (e.g., logos, specific colors or fonts) that should be incorporated into the new design?

## Sign-off

Please review the complete PRD. Once you approve, this document will be considered the source of truth for this enhancement.

**Approved by**: cc
**Date**: August 1, 2025
