# Portal Extensions - Development Rules

## File Structure Rules

### Each Extension Folder Must Contain EXACTLY:
1. **1 HTML file** - `index.html` (for testing/demo)
2. **1 JS file** - `{extension-name}.js` (the extension code)
3. **1 JSON file** - `{data-file}.json` (sample data)
4. **1 README file** - `README.md` (documentation)

### Total: 4 files per extension, no more, no less

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
- Must demonstrate all features
- Must show both minimal and customized configurations
- Should include inline examples/documentation

### No Multiple Example Files:
- ❌ No example-minimal.html
- ❌ No example-customized.html
- ❌ No example-*.html
- ✅ Only index.html with multiple examples in the page

## Before Making Any Changes:
1. Read this RULES.md file
2. Verify current structure follows rules
3. Plan changes to comply with rules
4. Execute changes
5. Verify final structure has exactly 4 files per extension

## Repository Structure:
```
portal-extentions/
├── RULES.md (this file)
├── README.md (solution-level documentation)
├── .gitignore
├── extension-1/
│   ├── index.html
│   ├── extension-1.js
│   ├── data.json
│   └── README.md
└── extension-2/
    ├── index.html
    ├── extension-2.js
    ├── data.json
    └── README.md
```

## Violations to Watch For:
- Multiple HTML files in extension folder
- Multiple markdown files in extension folder
- Separate example/demo files
- Configuration files (should be inline in README)
- Any file count > 4 per extension folder
