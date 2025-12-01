interface PopupState {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  isInjected: boolean;
}

class AnswerGenerationManager {
  private popupState: PopupState = {
    isVisible: false,
    position: { x: 0, y: 0 },
    selectedText: "",
    isInjected: false,
  };

  private popupElement: HTMLElement | null = null;
  private hideTimeout: NodeJS.Timeout | null = null;
  private clickOutsideHandler: ((event: MouseEvent) => void) | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.addEventListeners();
  }

  private addEventListeners(): void {
    // Listen for text selection with debouncing
    let selectionTimeout: NodeJS.Timeout;
    document.addEventListener("mouseup", () => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        this.handleTextSelection();
      }, 300); // Delay per design spec for stable selection
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === "Escape") {
        if (this.popupState.isVisible) {
          this.hidePopup();
        } else {
          this.hidePopup();
        }
      }
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "SHOW_ANSWER_POPUP") {
        this.showInjectedPopup(
          message.data.selectedText,
          message.data.position,
        );
        sendResponse({ status: "ok" });
      } else if (message.type === "HIDE_ANSWER_POPUP") {
        this.hidePopup();
        sendResponse({ status: "ok" });
      }
    });
  }

  private handleTextSelection(): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      // Only hide if popup is not visible (i.e., only hide the icon, not the full popup)
      if (!this.popupState.isVisible) {
        this.hidePopup();
      }
      return;
    }

    const selectedText = selection.toString().trim();

    if (selectedText.length < 10) {
      // Only hide if popup is not visible 
      if (!this.popupState.isVisible) {
        this.hidePopup();
      }
      return;
    }

    // Cancel any pending hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.popupState.selectedText = selectedText;

    // Get selection position
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Calculate position
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    };

    this.showIcon(position);
  }

  private showIcon(position: { x: number; y: number }): void {
    // Remove existing icon if present
    this.removeIcon();

    // Create icon element
    const icon = document.createElement("div");
    icon.id = "answer-generation-icon";

    // Use clean, modern inline styles
    icon.style.cssText = `
      position: fixed !important;
      z-index: 2147483647 !important;
      background: linear-gradient(135deg, #3B82F6, #2563EB) !important;
      border: none !important;
      border-radius: 16px !important;
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3) !important;
      padding: 8px 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 13px !important;
      cursor: pointer !important;
      opacity: 0 !important;
      transform: scale(0.8) !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      pointer-events: none !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      justify-content: center !important;
      color: white !important;
      font-weight: 600 !important;
      visibility: hidden !important;
      user-select: none !important;
    `;

    // Add icon content
    icon.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px; color: white;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.9;">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span style="font-size: 12px; font-weight: 500;">AI</span>
      </div>
    `;

    // Position the icon
    const adjustedX = Math.max(
      10,
      Math.min(position.x - 25, window.innerWidth - 70),
    );
    const adjustedY = Math.max(10, position.y - 35);

    icon.style.left = `${adjustedX}px`;
    icon.style.top = `${adjustedY}px`;

    // Add click event listener
    icon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showInjectedPopup(this.popupState.selectedText, position);
      this.removeIcon();
    });

    // Append to body
    document.body.appendChild(icon);
    this.popupElement = icon;

    // Show with animation
    setTimeout(() => {
      if (this.popupElement) {
        this.popupElement.style.opacity = "1";
        this.popupElement.style.transform = "scale(1)";
        this.popupElement.style.pointerEvents = "auto";
        this.popupElement.style.visibility = "visible";
      }
    }, 50);
  }

  private removeIcon(): void {
    const existingIcon = document.getElementById("answer-generation-icon");
    if (existingIcon) {
      existingIcon.remove();
    }
    this.popupElement = null;
  }

  public hidePopup(): void {
    // Remove injected popup
    const injectedPopup = document.getElementById("injected-answer-popup");
    if (injectedPopup) {
      injectedPopup.remove();
    }

    // Remove click outside handler
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }

    // Remove icon
    this.removeIcon();

    this.popupState.isVisible = false;

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  public showInjectedPopup(
    selectedText: string,
    position: { x: number; y: number },
  ): void {
    // Remove existing popup
    this.hidePopup();

    // Create main popup container
    const popup = document.createElement("div");
    popup.id = "injected-answer-popup";
    popup.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
    `;

    // Create popup content
    const popupContent = document.createElement("div");
    popupContent.style.cssText = `
      position: absolute !important;
      pointer-events: auto !important;
    `;

    // Position the popup at the top center of the page for better visibility
    const popupWidth = 480;
    const popupHeight = 600;
    const centerX = (window.innerWidth - popupWidth) / 2;
    const topY = 20; // Fixed position at top of page

    popupContent.style.left = `${Math.max(20, centerX)}px`;
    popupContent.style.top = `${topY}px`;
    popupContent.style.zIndex = "2147483647"; // Ensure it's always on top

    // Create the complete popup HTML with full functionality
    popupContent.innerHTML = `
      <div style="
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        border: 1px solid #e5e7eb !important;
        width: 480px !important;
        max-height: 600px !important;
        overflow: hidden !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      ">
        <!-- Header -->
        <div style="
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 16px !important;
          border-bottom: 1px solid #e5e7eb !important;
          background: linear-gradient(to right, #eff6ff, #e0e7ff) !important;
        ">
          <div style="display: flex !important; align-items: center !important; gap: 12px !important;">
            <div style="
              width: 32px !important;
              height: 32px !important;
              background: #2563eb !important;
              border-radius: 8px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              color: white !important;
              font-weight: bold !important;
              font-size: 14px !important;
            ">
              AI
            </div>
            <div>
              <h3 style="margin: 0 !important; font-size: 18px !important; font-weight: 600 !important; color: #111827 !important;">
                Answer Generation 📌
              </h3>
              <p style="margin: 0 !important; font-size: 12px !important; color: #6b7280 !important;">
                AI-powered responses • Stays open until closed • Scroll to see more</p>
            </div>
          </div>
          <button onclick="(window.answerGenerationManager||window.safeAnswerGenerationManager)?.hidePopup?.()" style="
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            padding: 4px !important;
            border-radius: 6px !important;
            color: #6b7280 !important;
            font-size: 18px !important;
          ">
            ×
          </button>
            ×
          </button>
        </div>

        <!-- Content -->
        <div style="padding: 16px !important; max-height: 500px !important; overflow-y: auto !important;">
          <!-- Error Display -->
          <div id="popup-error" style="display: none !important; margin-bottom: 16px !important; padding: 12px !important; background: #fef2f2 !important; border: 1px solid #fecaca !important; border-radius: 8px !important;">
            <p id="error-message" style="margin: 0 !important; font-size: 14px !important; color: #b91c1c !important;"></p>
          </div>

          <!-- Selected Text -->
          <div style="margin-bottom: 16px !important;">
            <div style="
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              margin-bottom: 8px !important;
            ">
              <div style="
                width: 12px !important;
                height: 12px !important;
                background: #f59e0b !important;
                border-radius: 50% !important;
                animation: pulse 2s infinite !important;
              "></div>
              <label style="
                display: block !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #92400e !important;
              ">
                📝 Selected Text
              </label>
            </div>
            <div style="
              background: linear-gradient(135deg, #fffbeb, #fef3c7) !important;
              padding: 16px !important;
              border-radius: 8px !important;
              border: 2px solid #fbbf24 !important;
              max-height: 100px !important;
              overflow-y: auto !important;
              position: relative !important;
            ">
              <div style="
                position: absolute !important;
                top: -8px !important;
                left: 16px !important;
                background: #f59e0b !important;
                color: white !important;
                padding: 2px 8px !important;
                border-radius: 4px !important;
                font-size: 10px !important;
                font-weight: 500 !important;
              ">
                HIGHLIGHTED
              </div>
              <p id="selected-text-display" style="
                margin: 0 !important;
                font-size: 14px !important;
                color: #92400e !important;
                font-style: italic !important;
                line-height: 1.4 !important;
                margin-top: 8px !important;
              ">
                "${selectedText.length > 150 ? selectedText.substring(0, 150) + "..." : selectedText}"
              </p>
            </div>
          </div>

          <!-- Prompt Templates -->
          <div style="margin-bottom: 16px !important;">
            <label style="display: block !important; font-size: 14px !important; font-weight: 500 !important; color: #374151 !important; margin-bottom: 8px !important;">
              Prompt Template:
            </label>
            <select id="template-selector" style="
              width: 100% !important;
              padding: 8px 12px !important;
              border: 1px solid #d1d5db !important;
              border-radius: 6px !important;
              font-size: 14px !important;
              background: white !important;
              margin-bottom: 8px !important;
            ">
              <option value="job-application">💼 Job Application - Tailored responses</option>
              <option value="technical-question">⚙️ Technical Question - Detailed explanations</option>
              <option value="interview-response">🎤 Interview Response - STAR method</option>
              <option value="general-explanation">💬 General Explanation - Clear information</option>
            </select>

            <!-- Quick Settings -->
            <div style="margin-bottom: 12px !important;">
              <label style="display: block !important; font-size: 12px !important; font-weight: 500 !important; color: #6b7280 !important; margin-bottom: 4px !important;">
                Tone:
              </label>
              <div style="display: flex !important; gap: 4px !important; margin-bottom: 8px !important;">
                <button data-setting="tone" data-value="professional" class="setting-btn" style="
                  padding: 4px 8px !important;
                  font-size: 12px !important;
                  border: 1px solid #d1d5db !important;
                  border-radius: 4px !important;
                  background: #2563eb !important;
                  color: white !important;
                  cursor: pointer !important;
                ">Professional</button>
                <button data-setting="tone" data-value="casual" class="setting-btn" style="
                  padding: 4px 8px !important;
                  font-size: 12px !important;
                  border: 1px solid #d1d5db !important;
                  border-radius: 4px !important;
                  background: white !important;
                  color: #374151 !important;
                  cursor: pointer !important;
                ">Casual</button>
                <button data-setting="tone" data-value="technical" class="setting-btn" style="
                  padding: 4px 8px !important;
                  font-size: 12px !important;
                  border: 1px solid #d1d5db !important;
                  border-radius: 4px !important;
                  background: white !important;
                  color: #374151 !important;
                  cursor: pointer !important;
                ">Technical</button>
              </div>
            </div>
          </div>

          <!-- Generate Button -->
          <button id="generate-btn" onclick="(window.safeAnswerGenerationManager||{}).generateAnswer && (window.safeAnswerGenerationManager).generateAnswer()" style="
            width: 100% !important;
            background: linear-gradient(to right, #2563eb, #4f46e5) !important;
            color: white !important;
            border: none !important;
            padding: 12px 16px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            margin-bottom: 16px !important;
            transition: all 0.2s ease !important;
          ">
            🚀 Generate Answer
          </button>

          <!-- Loading State -->
          <div id="loading-state" style="display: none !important; text-align: center !important; margin-bottom: 16px !important;">
            <div style="
              display: inline-flex !important;
              align-items: center !important;
              gap: 8px !important;
              color: #6b7280 !important;
              font-size: 14px !important;
            ">
              <div style="
                width: 16px !important;
                height: 16px !important;
                border: 2px solid #e5e7eb !important;
                border-top: 2px solid #2563eb !important;
                border-radius: 50% !important;
                animation: spin 1s linear infinite !important;
              "></div>
              Generating answer...
            </div>
          </div>

          <!-- Generated Answer -->
          <div id="answer-section" style="display: none !important; margin-bottom: 16px !important;">
            <label style="display: block !important; font-size: 14px !important; font-weight: 500 !important; color: #374151 !important; margin-bottom: 8px !important;">
              Generated Answer:
            </label>
            <div style="
              background: #f0fdf4 !important;
              padding: 16px !important;
              border-radius: 8px !important;
              border: 1px solid #bbf7d0 !important;
              max-height: 200px !important;
              overflow-y: auto !important;
            ">
              <p id="generated-answer" style="margin: 0 !important; font-size: 14px !important; color: #1f2937 !important; white-space: pre-wrap !important; line-height: 1.5 !important;"></p>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex !important; justify-content: center !important; margin-top: 12px !important;">
              <button onclick="(window.safeAnswerGenerationManager||{}).copyAnswer && (window.safeAnswerGenerationManager).copyAnswer()" style="
                padding: 12px 24px !important;
                background: linear-gradient(to right, #2563eb, #4f46e5) !important;
                color: white !important;
                border: none !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3) !important;
              " id="copy-answer-btn" data-debug="copy-button">📋 Copy Answer</button>
            </div>
          </div>

          <!-- Copy Success Message -->
          <div id="copy-success" style="display: none !important; text-align: center !important; margin-top: 12px !important; padding: 8px !important; background: #d1fae5 !important; color: #065f46 !important; border-radius: 6px !important; font-size: 12px !important;">
            ✅ Answer copied to clipboard!
          </div>

          <!-- Resume Context -->
          <div id="resume-context" style="
            margin-top: 16px !important;
            padding: 16px !important;
            background: linear-gradient(135deg, #eff6ff, #f0f9ff) !important;
            border: 1px solid #dbeafe !important;
            border-radius: 12px !important;
            display: none !important;
            position: relative !important;
          ">
            <div style="
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              margin-bottom: 8px !important;
            ">
              <div style="
                width: 12px !important;
                height: 12px !important;
                background: #10b981 !important;
                border-radius: 50% !important;
                animation: pulse 2s infinite !important;
              "></div>
              <span style="
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #1e40af !important;
              ">
                🎯 Active Resume Profile
              </span>
            </div>
            <p id="resume-info" style="
              margin: 0 !important;
              font-size: 13px !important;
              color: #1e3a8a !important;
              line-height: 1.4 !important;
            "></p>
            <div style="
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              margin-top: 8px !important;
            ">
              <p id="relevance-score" style="
                margin: 0 !important;
                font-size: 11px !important;
                color: #059669 !important;
                background: rgba(16, 185, 129, 0.1) !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                font-weight: 500 !important;
              "></p>
            </div>
          </div>

          <!-- Scroll Indicator -->
          <div style="
            text-align: center !important;
            padding: 8px !important;
            background: #f8fafc !important;
            border-top: 1px solid #e2e8f0 !important;
            margin: 0 -16px -16px -16px !important;
          ">
            <p style="
              margin: 0 !important;
              font-size: 11px !important;
              color: #64748b !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 4px !important;
            ">
              <span>⬇️</span>
              Scroll to see generated answer
              <span>⬇️</span>
            </p>
          </div>
        </div>
      </div>
    `;

    // Add CSS animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .setting-btn:hover {
        opacity: 0.8 !important;
      }
    `;
    document.head.appendChild(style);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);

    // Set up click outside detection
    this.setupClickOutsideDetection(popup);

    // Store popup state
    this.popupState.isVisible = true;
    this.popupState.selectedText = selectedText;

    // Initialize popup functionality
    this.initializePopupFunctionality();
  }

  private setupClickOutsideDetection(popup: HTMLElement): void {
    // Create click outside handler
    this.clickOutsideHandler = (event: MouseEvent) => {
      // Check if click is outside the popup
      if (!popup.contains(event.target as Node)) {
        this.hidePopup();
      }
    };

    // Add click inside popup to prevent propagation
    popup.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    // Add click outside handler with a small delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideHandler!);
    }, 100);
  }

  private initializePopupFunctionality(): void {
    // Auto-detect best template based on selected text
    this.autoDetectTemplate();

    // Load resume information
    this.loadResumeContext();

    // Setup settings buttons
    this.setupSettingsButtons();

    // Setup generate button with both inline onclick AND event listener as fallback
    this.setupGenerateButton();

    // Setup copy button with event listener as backup
    this.setupCopyButton();

    // Store reference for access by buttons
    (window as any).answerGenerationManager = this;
  }

  private setupCopyButton(): void {
    // Wait for DOM to be ready
    setTimeout(() => {
      const copyBtn = document.getElementById(
        "copy-answer-btn",
      ) as HTMLButtonElement;

      if (copyBtn) {
        // Add direct event listener as backup
        copyBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Call copyAnswer method
          this.copyAnswer();
        });
      } else {
        console.error("Answer Generation: Copy button not found in DOM");
      }
    }, 200); // Increased delay to ensure DOM is fully ready
  }

  private setupGenerateButton(): void {
    // Wait a bit for DOM to be ready
    setTimeout(() => {
      const generateBtn = document.getElementById(
        "generate-btn",
      ) as HTMLButtonElement;

      if (generateBtn) {
        // Add a direct event listener as fallback
        generateBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.generateAnswer();
        });
      } else {
        console.error("Answer Generation: Generate button not found!");
      }
    }, 100);
  }

  private autoDetectTemplate(): void {
    const selectedText = this.popupState.selectedText.toLowerCase();
    const templateSelector = document.getElementById(
      "template-selector",
    ) as HTMLSelectElement;

    if (
      selectedText.includes("job") ||
      selectedText.includes("position") ||
      selectedText.includes("requirements")
    ) {
      templateSelector.value = "job-application";
    } else if (
      selectedText.includes("code") ||
      selectedText.includes("technical") ||
      selectedText.includes("api")
    ) {
      templateSelector.value = "technical-question";
    } else if (
      selectedText.includes("interview") ||
      selectedText.includes("tell me") ||
      selectedText.includes("describe")
    ) {
      templateSelector.value = "interview-response";
    } else {
      templateSelector.value = "general-explanation";
    }
  }

  private async loadResumeContext(): Promise<void> {
    try {
      const selectedText = this.popupState.selectedText.toLowerCase();

      const resumeContext = document.getElementById("resume-context")!;
      const resumeInfo = document.getElementById("resume-info")!;
      const relevanceScore = document.getElementById("relevance-score")!;

      // Only show resume context for job-related content
      if (
        selectedText.includes("job") ||
        selectedText.includes("position") ||
        selectedText.includes("experience") ||
        selectedText.includes("skills") ||
        selectedText.includes("qualification") ||
        selectedText.includes("requirement")
      ) {
        // Fetch user profile from storage
        const profile = await this.getUserProfileFromStorage();

        if (profile && profile.resumes && profile.resumes.length > 0) {
          // Find the active resume
          const activeResumeId = profile.settings?.activeResumeId;
          const activeResume =
            profile.resumes.find((r: any) => r.id === activeResumeId) ||
            profile.resumes[0];

          if (activeResume) {
            // Display resume information
            const personalInfo = activeResume.parsedInfo?.personalInfo;
            const skills = activeResume.parsedInfo?.skills || [];
            const experience = activeResume.parsedInfo?.experience || [];

            let infoText = `Using "${activeResume.name}" as active resume`;

            if (personalInfo?.name) {
              infoText += ` • ${personalInfo.name}`;
            }

            if (experience.length > 0) {
              const latestExp = experience[0];
              infoText += ` • ${latestExp.title} at ${latestExp.company}`;
            }

            if (skills.length > 0) {
              const topSkills = skills.slice(0, 3).join(", ");
              infoText += ` • Skills: ${topSkills}`;
            }

            resumeInfo.textContent = infoText;

            // Calculate relevance based on resume content vs selected text
            const relevance = this.calculateRelevanceScore(
              selectedText,
              activeResume.text,
              skills,
            );
            relevanceScore.textContent = `✓ ${relevance}% relevance based on your background`;

            (resumeContext as HTMLElement).style.display = "block";
          } else {
            // No active resume found
          }
        } else {
          // No resumes found
          resumeInfo.textContent =
            "No resume profile found. Upload a resume to enable personalized responses.";
          relevanceScore.textContent = "";
          (resumeContext as HTMLElement).style.display = "block";
        }
      }
    } catch (error) {
      console.error("Error loading resume context:", error);
      // Hide the resume context section on error
      const resumeContext = document.getElementById(
        "resume-context",
      ) as HTMLElement;
      if (resumeContext) {
        resumeContext.style.display = "none";
      }
    }
  }

  private async getUserProfileFromStorage(): Promise<any> {
    return new Promise((resolve) => {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["userProfile"], (result) => {
          if (result.userProfile) {
            resolve(result.userProfile);
          } else {
            resolve(null);
          }
        });
      } else {
        console.warn(
          "chrome.storage.local is not available. Cannot fetch resume context.",
        );
        resolve(null);
      }
    });
  }

  private calculateRelevanceScore(
    selectedText: string,
    resumeText: string,
    skills: string[],
  ): number {
    let score = 0;
    const selectedWords = selectedText.toLowerCase().split(/\s+/);
    const resumeWords = resumeText.toLowerCase().split(/\s+/);

    // Check for skill matches
    const skillMatches = skills.filter((skill) =>
      selectedText.toLowerCase().includes(skill.toLowerCase()),
    ).length;
    score += Math.min(skillMatches * 20, 60); // Max 60% from skills

    // Check for keyword matches
    const keywordMatches = selectedWords.filter(
      (word) =>
        word.length > 3 &&
        resumeWords.some((resumeWord) => resumeWord.includes(word)),
    ).length;
    score += Math.min(keywordMatches * 2, 30); // Max 30% from keywords

    // Base score for having relevant content
    if (
      score === 0 &&
      (selectedText.includes("job") ||
        selectedText.includes("position") ||
        selectedText.includes("experience"))
    ) {
      score = 40; // Base relevance for job-related content
    }

    return Math.min(Math.max(score, 25), 95); // Clamp between 25% and 95%
  }

  private setupSettingsButtons(): void {
    const buttons = document.querySelectorAll(".setting-btn");
    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const setting = target.getAttribute("data-setting");
        const value = target.getAttribute("data-value");

        // Update button states
        const groupButtons = document.querySelectorAll(
          `[data-setting="${setting}"]`,
        );
        groupButtons.forEach((btn) => {
          (btn as HTMLElement).style.background = "white";
          (btn as HTMLElement).style.color = "#374151";
        });
        (target as HTMLElement).style.background = "#2563eb";
        (target as HTMLElement).style.color = "white";
      });
    });
  }

  public async generateAnswer(): Promise<void> {
    // Check if popup exists
    const popup = document.getElementById("injected-answer-popup");

    const generateBtn = document.getElementById(
      "generate-btn",
    ) as HTMLButtonElement;
    const loadingState = document.getElementById(
      "loading-state",
    ) as HTMLDivElement;
    const answerSection = document.getElementById(
      "answer-section",
    ) as HTMLDivElement;
    const errorDiv = document.getElementById("popup-error") as HTMLDivElement;
    const errorMsg = document.getElementById(
      "error-message",
    ) as HTMLParagraphElement;

    // Show loading state
    (generateBtn as HTMLElement).style.display = "none";
    (loadingState as HTMLElement).style.display = "block";
    (answerSection as HTMLElement).style.display = "none";
    (errorDiv as HTMLElement).style.display = "none";

    try {
      // Get current settings
      const template = (
        document.getElementById("template-selector") as HTMLSelectElement
      ).value;

      const toneButton = document.querySelector(
        '.setting-btn[style*="background: #2563eb"]',
      ) as HTMLElement;
      const tone = toneButton?.getAttribute("data-value") || "professional";

      // Map template to question type
      const questionTypeMap: {
        [key: string]: "general" | "interview" | "application" | "technical";
      } = {
        "job-application": "application",
        "technical-question": "technical",
        "interview-response": "interview",
        "general-explanation": "general",
      };

      const questionType = questionTypeMap[template] || "general";

      // Send message to background script to generate answer using AI service
      const response = await new Promise<{ answer?: string; error?: string }>(
        (resolve) => {
          chrome.runtime.sendMessage(
            {
              type: "GENERATE_AI_ANSWER",
              data: {
                selectedText: this.popupState.selectedText,
                questionType,
                context: `Tone: ${tone}, Template: ${template}`,
              },
            },
            (response) => {
              resolve(
                response || { error: "No response from background script" },
              );
            },
          );
        },
      );

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.answer) {
        throw new Error("No answer generated");
      }

      // Display AI-generated answer
      const answerElement = document.getElementById(
        "generated-answer",
      ) as HTMLParagraphElement;
      answerElement.textContent = response.answer;
      (answerSection as HTMLElement).style.display = "block";
    } catch (error) {
      console.error("Answer generation error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate answer. Please try again.";
      errorMsg.textContent = errorMessage;
      (errorDiv as HTMLElement).style.display = "block";
    } finally {
      (generateBtn as HTMLElement).style.display = "block";
      (loadingState as HTMLElement).style.display = "none";
    }
  }

  private createPrompt(template: string, tone: string): string {
    const selectedText = this.popupState.selectedText;

    const prompts = {
      "job-application": `You are a professional career coach. Generate a compelling response for a job application based on this text: "${selectedText}". Use a ${tone} tone and highlight relevant qualifications and experience. Please response with your answers only and must don't contain prefix/leading words and please in plain text.`,

      "technical-question": `You are a technical expert. Provide a detailed explanation of this technical concept: "${selectedText}". Use a ${tone} tone with specific examples and clear explanations. Please response with your answers only and must don't contain prefix/leading words and please in plain text.`,

      "interview-response": `You are an interview coach. Help craft a thoughtful response to this interview question: "${selectedText}". Use the STAR method and a ${tone} tone to showcase relevant experience. Please response with your answers only and must don't contain prefix/leading words and please in plain text.`,

      "general-explanation": `You are a helpful assistant. Provide a clear, informative explanation about: "${selectedText}". Use a ${tone} tone and make it easy to understand.Answer in plain text. Please response with your answers only and must don't contain prefix/leading words and please in plain text.`,
    };

    return (
      prompts[template as keyof typeof prompts] ||
      prompts["general-explanation"]
    );
  }

  public async copyAnswer(): Promise<void> {
    const answerElement = document.getElementById(
      "generated-answer",
    ) as HTMLParagraphElement;

    if (!answerElement) {
      console.error("Copy Answer: Answer element not found");
      return;
    }

    const answer = answerElement.textContent || "";

    if (!answer.trim()) {
      console.error("Copy Answer: No answer text to copy");
      return;
    }

    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(answer);
      } else {
        // Fallback for older browsers or restricted contexts
        this.fallbackCopyToClipboard(answer);
      }

      // Show success message
      const successMsg = document.getElementById(
        "copy-success",
      ) as HTMLDivElement;

      if (successMsg) {
        successMsg.style.display = "block";
        setTimeout(() => {
          successMsg.style.display = "none";
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);

      // Try fallback method on error
      try {
        this.fallbackCopyToClipboard(answer);

        // Show success message
        const successMsg = document.getElementById(
          "copy-success",
        ) as HTMLDivElement;
        if (successMsg) {
          successMsg.style.display = "block";
          setTimeout(() => {
            successMsg.style.display = "none";
          }, 2000);
        }
      } catch (fallbackError) {
        console.error("Fallback copy also failed:", fallbackError);

        // Show answer text to user as last resort
        const answerPreview =
          answer.length > 200 ? answer.substring(0, 200) + "..." : answer;
        alert(
          "Failed to copy to clipboard. Here's the answer:\n\n" + answerPreview,
        );
      }
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    // Create a temporary textarea element
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    // Execute the copy command
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (!successful) {
      throw new Error("execCommand copy failed");
    }
  }

  public testPopup(): void {
    // Simulate text selection
    const testPosition = { x: 200, y: 200 };
    this.popupState.selectedText =
      "This is test text for popup verification. Select any text to test the real functionality.";

    this.showInjectedPopup(this.popupState.selectedText, testPosition);
  }

  public debugPopup(): void {
    // Debug popup state for troubleshooting
  }
}

// CRITICAL: Set up immediate global safety wrapper BEFORE anything else

// Set up immediate global safety wrapper - available before any onclick events
(window as any).safeAnswerGenerationManager = {
  generateAnswer: () => {
    try {
      const manager = (window as any).answerGenerationManager;
      if (manager && typeof manager.generateAnswer === "function") {
        return manager.generateAnswer();
      } else {
        console.error("Safe wrapper: Manager not ready yet, waiting...");
        // Wait a bit and retry
        setTimeout(() => {
          const retryManager = (window as any).answerGenerationManager;
          if (
            retryManager &&
            typeof retryManager.generateAnswer === "function"
          ) {
            return retryManager.generateAnswer();
          } else {
            console.error(
              "Safe wrapper: Manager still not available after retry",
            );
            if (typeof alert !== "undefined") {
              alert(
                "Answer Generation: Extension is loading, please try again in a moment.",
              );
            }
          }
        }, 100);
        return Promise.resolve();
      }
    } catch (error) {
      console.error("Safe wrapper: Error in generateAnswer:", error);
      if (typeof alert !== "undefined") {
        alert("Answer Generation: An error occurred. Please try again.");
      }
      return Promise.resolve();
    }
  },

  copyAnswer: () => {
    try {
      const manager = (window as any).answerGenerationManager;
      if (manager && typeof manager.copyAnswer === "function") {
        return manager.copyAnswer();
      } else {
        console.error("Safe wrapper: Manager not ready for copyAnswer");
        return Promise.resolve();
      }
    } catch (error) {
      console.error("Safe wrapper: Error in copyAnswer:", error);
      return Promise.resolve();
    }
  },
};
// Also provide a backup global for onclick handlers
(window as any).AGWrapper = (window as any).safeAnswerGenerationManager;

// Main content script starts here
const answerGenerationManager = new AnswerGenerationManager();

// Make manager globally accessible for popup onclick handlers
(window as any).answerGenerationManager = answerGenerationManager;

// Also expose individual methods as globals for direct onclick access
(window as any).generateAnswer = () => answerGenerationManager.generateAnswer();
(window as any).copyAnswer = () => answerGenerationManager.copyAnswer();

// Make test methods globally available for debugging
(window as any).testAnswerGenerationPopup = () =>
  answerGenerationManager.testPopup();
(window as any).debugAnswerGenerationPopup = () =>
  answerGenerationManager.debugPopup();
