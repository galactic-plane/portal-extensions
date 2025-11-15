# Portal Extensions - Development Rules

## File Structure Rules

### Solution Root Files:
1. **portal-demo.html** - Main demo page that loads all extensions
2. **portal-extensions.js** - Loader that dynamically imports all extension JS files
3. **RULES.md** - This file
4. **README.md** - Solution-level documentation
5. **.gitignore** - Git ignore file

### Each Extension Folder Must Contain EXACTLY:
1. **1 JS file** - `{extension-name}.js` (the extension code)
2. **1 JSON file** - `{data-file}.json` (sample data)
3. **1 README file** - `README.md` (documentation)

### Total: 3 files per extension, no more, no less

### HTML files are ONLY at the solution root (portal-demo.html)

## Documentation Rules

### README.md Must Include:
- Quick start guide
- Configuration examples (inline, not separate files)
- All code examples needed for implementation
- Minimal and advanced configuration examples
- Localization examples (if applicable)
- API documentation
- Event handling examples

### No Separate Documentation Files:
- ❌ No config-examples.md
- ❌ No REFACTORING_SUMMARY.md
- ❌ No CHANGELOG.md
- ✅ Everything goes in README.md

## Code Rules

### Extension Isolation (CRITICAL):
- Each extension MUST be completely self-contained
- Extensions MUST inject their own CSS styles into the page
- Extensions MUST NOT rely on external stylesheets
- All extension dependencies must be injected by the extension itself
- The host page (portal-demo.html) should have ZERO extension-specific styles
- Extensions should check if their styles are already injected to avoid duplicates

### Extension JavaScript File:
- Must be completely static
- No hardcoded configuration values
- All dynamic config passed during initialization
- Must validate required configuration
- Must NOT auto-initialize
- Must inject its own CSS styles on initialization
- Must use unique IDs for injected style elements (e.g., `{extension-name}-styles`)
- **Must support an `enabled` flag as the FIRST configuration parameter**
  - If `enabled: false`, extension must not initialize at all
  - If `enabled: true` or omitted, extension runs normally
  - Extension must check this flag before any initialization logic
- **All colors MUST be configurable**
  - No hardcoded color values in injected CSS
  - Colors must be passed via configuration and used in CSS generation
  - Must provide sensible default colors
  - Users must be able to customize all colors to match their site branding

### HTML File:
- Named `portal-demo.html` only
- Lives at solution root (not in extension folders)
- Demonstrates all extensions
- Contains NO extension-specific styles (only demo page styles)
- Loads portal-extensions.js which loads all extension JS files

### No Multiple Example Files:
- ❌ No example-minimal.html
- ❌ No example-customized.html
- ❌ No example-*.html
- ❌ No HTML files in extension folders
- ✅ Only portal-demo.html at solution root

## Before Making Any Changes:
1. Read this RULES.md file
2. Verify current structure follows rules
3. Plan changes to comply with rules
4. Execute changes
5. Verify final structure has exactly 3 files per extension

## Repository Structure:
```
portal-extentions/
├── portal-demo.html (main demo page)
├── portal-extensions.js (loader for all extensions)
├── RULES.md (this file)
├── README.md (solution-level documentation)
├── .gitignore
├── portal-inbox-extention/
│   ├── portal-inbox-extention.js
│   ├── messages.json
│   └── README.md
└── another-extension/
    ├── another-extension.js
    ├── data.json
    └── README.md
```

## Violations to Watch For:
- HTML files in extension folders
- Multiple markdown files in extension folder
- Separate example/demo files
- Configuration files (should be inline in README)
- Any file count > 3 per extension folder
