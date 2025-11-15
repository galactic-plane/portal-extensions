# Portal Extensions - Development Rules

## File Structure Rules

### Solution Root Files:
1. **index.html** - Main demo page that loads all extensions
2. **portal-extensions.js** - Loader that dynamically imports all extension JS files
3. **RULES.md** - This file
4. **README.md** - Solution-level documentation
5. **.gitignore** - Git ignore file

### Each Extension Folder Must Contain EXACTLY:
1. **1 JS file** - `{extension-name}.js` (the extension code)
2. **1 JSON file** - `{data-file}.json` (sample data)
3. **1 README file** - `README.md` (documentation)

### Total: 3 files per extension, no more, no less

### HTML files are ONLY at the solution root (index.html)

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

### Extension JavaScript File:
- Must be completely static
- No hardcoded configuration values
- All dynamic config passed during initialization
- Must validate required configuration
- Must NOT auto-initialize

### HTML File:
- Named `index.html` only
- Lives at solution root (not in extension folders)
- Demonstrates all extensions
- Loads portal-extensions.js which loads all extension JS files

### No Multiple Example Files:
- ❌ No example-minimal.html
- ❌ No example-customized.html
- ❌ No example-*.html
- ❌ No HTML files in extension folders
- ✅ Only index.html at solution root

## Before Making Any Changes:
1. Read this RULES.md file
2. Verify current structure follows rules
3. Plan changes to comply with rules
4. Execute changes
5. Verify final structure has exactly 3 files per extension

## Repository Structure:
```
portal-extentions/
├── index.html (main demo page)
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
