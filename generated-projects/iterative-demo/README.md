# Task Manager
Initial version of the task manager application.

## Refinements & Changelog

### Refinement — 2026-09-08 18:21 UTC
- **Change Request:** Add an export to JSON button with download trigger
- **Files Modified:** `index.html`, `app.js`, `tests/app.test.js`
- **Tasks Applied:**
- Step 1: Add the export to JSON button element with id 'export-json-btn' to index.html.
- Step 2: Implement the JSON export and download trigger logic in app.js, attaching it to the export button.
- Step 3: Update unit and integration tests to verify the export functionality.
- **QA Review:** Passed
### Refinement — 2026-09-08 18:21 UTC
- **Change Request:** Add a dark mode toggle button in header and persist theme choice in localStorage
- **Files Modified:** `app.js`
- **Tasks Applied:**
- Update app.js ThemeManager to read from localStorage on initialization and persist the theme choice when toggled.
- **QA Review:** Passed
### Refinement — 2026-09-08 16:14 UTC
- **Change Request:** Add a dark mode toggle button to index.html and app.js with a dark class toggle on body
- **Files Modified:** `index.html`, `app.js`
- **Tasks Applied:**
- Step 1: Update index.html to include a dark mode toggle button with a unique ID.
- Step 2: Update app.js to bind a click event to the toggle button that toggles the 'dark' class on the document body.
- Step 3: Add basic CSS styles in index.html or an updated script block to support the 'dark' class visual changes.
- **QA Review:** Passed
