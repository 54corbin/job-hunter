# Answer Generation Feature - Testing Guide

## How to Test the Feature

### 1. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `/home/corbin/Development/job_hunter/extension_webpack/dist` folder
4. Verify the "Job Hunter" extension appears in your extensions list

### 2. Test the Content Script
1. Open any webpage (or use the test page at `/home/corbin/Development/offer_hunter/extension_webpack/test-page.html`)
2. Open Developer Console (F12)
3. Look for these logs:
   ```
   Answer Generation content script loaded.
   Answer Generation: Initializing AnswerGenerationManager
   Answer Generation: Initialization complete
   ```

### 3. Test Text Selection
1. Select any text on the page (minimum 10 characters)
2. Check console for logs like:
   ```
   Answer Generation: Text selection event triggered
   Answer Generation: Selected text length: 20
   Answer Generation: Calculated position: {x: 634, y: 292}
   Answer Generation: showPopup called with position: {x: 634, y: 292}
   ```

### 4. Manual Test (if selection doesn't work)
1. In the browser console, run:
   ```javascript
   window.testAnswerGenerationPopup()
   ```
2. A popup should appear at position (100, 100)

### 5. Debug Popup State
1. Run this in console:
   ```javascript
   window.debugAnswerGenerationPopup()
   ```
2. This will show detailed information about the popup state

## What Should Happen

### Expected Behavior:
1. **Text Selection**: Select any text ≥10 characters
2. **Popup Appears**: Small blue icon with "Answer" text should appear near selection
3. **Hover to Expand**: Hovering over the icon should open the full answer generation menu
4. **Generate Answers**: You should be able to generate AI-powered answers

### If Nothing Happens:

#### Check Content Script Loading:
- Look for the content script loading logs in console
- If missing, the extension may not be loaded properly

#### Check for JavaScript Errors:
- Look for any red errors in the console
- Common issues: CSP violations, missing permissions

#### Check Extension Permissions:
- Go to `chrome://extensions/`
- Click "Details" on Job Hunter extension
- Verify it has access to the current site

#### Manual Testing:
- Use `window.testAnswerGenerationPopup()` to test manually
- Use `window.debugAnswerGenerationPopup()` to see state

## Common Issues & Solutions

### Content Script Not Loading
**Symptoms**: No logs in console, no popup on text selection
**Solution**: 
1. Refresh the page
2. Check extension is enabled
3. Check site permissions in extension details

### Popup Created But Not Visible
**Symptoms**: Console shows popup creation logs, but no visual popup
**Solution**: 
1. Check if site has strict CSS that might hide the popup
2. Try on different websites
3. Use manual test: `window.testAnswerGenerationPopup()`

### Hover Not Working
**Symptoms**: Popup appears but doesn't expand on hover
**Solution**: 
1. Check console for hover event logs
2. Try moving mouse slowly over the popup
3. Check if site JavaScript is interfering

## Verification Commands

Run these in browser console to verify everything is working:

```javascript
// Check if content script loaded
console.log("Content script loaded:", typeof window.testAnswerGenerationPopup !== 'undefined');

// Test popup manually
window.testAnswerGenerationPopup();

// Debug popup state
window.debugAnswerGenerationPopup();

// Check if element exists in DOM
console.log("Popup element:", document.getElementById("answer-generation-popup"));
```

## Background Script Testing

To test the background script integration:

1. Select text and hover over popup
2. Look for these background logs:
   ```
   Background: OPEN_ANSWER_GENERATION_MENU message received
   Background: handleOpenAnswerGenerationMenu called
   Background: Creating popup window...
   ```

3. A new popup window should open with the answer generation interface

## Performance Notes

- The content script runs on all websites (`<all_urls>`)
- It's designed to be lightweight and non-intrusive
- If you experience performance issues, check browser console for any errors

## File Locations

- Content Script: `/dist/answerGeneration.bundle.js`
- Background Script: `/dist/background.bundle.js`
- Popup UI: `/dist/popup.html#/answer-generation`
- Test Page: `/test-page.html`

## Need More Help?

If the feature still doesn't work:

1. Try the manual test: `window.testAnswerGenerationPopup()`
2. Run debug command: `window.debugAnswerGenerationPopup()`
3. Check browser console for specific error messages
4. Verify extension permissions and site access