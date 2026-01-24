# Portal Extensions - Development Rules

## Overview

This document defines the standards and structure for building portal extensions. Extensions are self-contained JavaScript modules that can be deployed to Microsoft Power Pages.

## File Structure

### Solution Root Files

Required files at the root level:
- `portal-demo.html` - Demo page showing all extensions
- `portal-extensions.js` - Extension loader
- `portal-extensions-init-auth.js` - Initialization for authenticated users
- `portal-extensions-init-noauth.js` - Initialization for public users
- `manifest.schema.json` - JSON schema for validation
- `RULES.md` - This file
- `README.md` - Solution documentation

### Extension Folder Structure

Each extension folder must contain these 4 files:
1. `{extension-name}.js` - Extension code (deployed to portal)
2. `localDataSource.json` - Test data (NOT deployed, local dev only)
3. `manifest.json` - Configuration and deployment info
4. `README.md` - Extension documentation

Optional files:
- `*.zip` - Dataverse solution package
- `{SolutionFolder}/` - Unpacked solution for version control
- `*.png, *.jpg, *.gif` - Documentation images

### Important Rules

- HTML files only exist at solution root (portal-demo.html)
- No separate config files or changelogs
- All documentation goes in README.md
- Minimum 4 files per extension

## Extension Code Rules

### Self-Contained Design

Extensions must be completely isolated:
- Each extension is wrapped in an IIFE (Immediately Invoked Function Expression)
- Inject their own CSS styles
- No external stylesheets required
- No global scope pollution
- Check for existing styles before injecting to avoid duplicates

### Static Extension Files

Extension JavaScript files must be static:
- No hardcoded configuration
- All settings passed during initialization
- Must not auto-initialize
- Must validate required configuration parameters

### Configuration Requirements

Every extension must support:
- `enabled` flag as first parameter (if false, extension does not initialize)
- All colors must be configurable (no hardcoded colors in CSS)
- Sensible default values for all configuration options

### Error Handling

Code must fail fast and clearly:
- Either work correctly or throw a clear error
- NO fallback values for missing required data (no "Unknown", "N/A", etc.)
- NO optional chaining with defaults for required fields
- Throw errors immediately with:
  - What is missing
  - Why it's needed  
  - How to fix it

Exception: Use fallbacks only for truly optional features.

### Environment Detection

Extensions automatically detect their environment:
- Local: `localhost`, `127.0.0.1`, `192.168.x.x`, `10.x.x.x`, `.local` domain, or `file://` protocol
- Portal: All other hostnames

Data sources switch automatically:
- Local: Uses `localDataSource.json`
- Portal: Uses Power Pages Web API

## Manifest Configuration

### Purpose

The `manifest.json` file defines:
- Publisher information
- Extension metadata
- Dependencies
- Deployment configuration
- Initialization settings

### Required Sections

```json
{
  "$schema": "../manifest.schema.json",
  "publisher": {
    "name": "Your Organization",
    "prefix": "yourprefix"
  },
  "extension": {
    "id": "portal-your-extension",
    "name": "Your Extension Name",
    "version": "1.0.0",
    "requiresAuthentication": true
  },
  "dependencies": {
    "bootstrap": "5.x",
    "bootstrapIcons": "1.11.x",
    "javascript": "ES6+"
  },
  "deployment": {
    "webFiles": [
      {
        "name": "portal-your-extension.js",
        "source": "./portal-your-extension.js",
        "partialUrl": "portal-your-extension.js"
      }
    ]
  },
  "initialization": {
    "containerId": "portal-your-extension",
    "colors": { },
    "text": { },
    "features": { }
  }
}
```

### Authentication Flag

The `requiresAuthentication` flag determines which init file loads the extension:

- `true` - Extension loads in `portal-extensions-init-auth.js` (authenticated users only)
- `false` - Extension loads in `portal-extensions-init-noauth.js` (all users including anonymous)

Examples:
- `true`: Portal inbox, user dashboard, profile settings
- `false`: Cookie consent, announcement banner, help widget

## Deployment Process

### Manual Deployment Steps

1. **Prepare Files**
   - Review `manifest.json` files from all extensions
   - Identify which extensions require authentication

2. **Update Init Files**
   - Add authenticated extensions to `portal-extensions-init-auth.js`
   - Add public extensions to `portal-extensions-init-noauth.js`
   - Copy initialization config from manifest

3. **Upload to Power Pages**
   - Upload extension JS files to Web Files at root level
   - Upload `portal-extensions.js` to root
   - Upload both init files to root

4. **Add to Tracking Code**
   
   In Power Pages > Settings > Tracking Code (Head):
   ```html
   <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

   <script type="text/javascript" src="/portal-extensions.js"></script>

   {% if user %}
   <script type="text/javascript" src="/portal-extensions-init-auth.js"></script>
   {% endif %}

   <script type="text/javascript" src="/portal-extensions-init-noauth.js"></script>
   ```

   Note: The `{% if user %}` Liquid template ensures authenticated extensions only load for logged-in users.

### File Deployment Paths

All files deploy to root level:
- `/portal-extensions.js`
- `/portal-extensions-init-auth.js`
- `/portal-extensions-init-noauth.js`
- `/portal-inbox-extension.js` (or your extension name)

NOT in a subdirectory like `/portal-extensions/`

### Test Data

- `localDataSource.json` files are ONLY for local development
- Never deploy test JSON files to the portal
- Extensions automatically switch to Web API in production

## Dataverse Solutions

### Solution Packages

Extensions may include Dataverse solution packages for:
- Custom entity configurations
- Forms and views
- Table permissions
- Web API settings

### Working with Solutions

Unpack solutions for version control:
```bash
pac solution unpack --zipfile MySolution_1_0_0_1.zip --folder MySolution
```

Repack after making changes:
```bash
pac solution pack --zipfile MySolution_1_0_0_1.zip --folder MySolution
```

Keep both the unpacked folder and ZIP file in the extension directory.

## Repository Structure

```
portal-extensions/
├── portal-demo.html                       # Demo page
├── portal-extensions.js                   # Extension loader
├── portal-extensions-init-auth.js         # Auth extensions init
├── portal-extensions-init-noauth.js       # Public extensions init
├── manifest.schema.json                   # JSON schema
├── RULES.md                               # This file
├── README.md                              # Documentation
│
└── portal-inbox-extension/                # Example extension
    ├── portal-inbox-extension.js          # Extension code (deploy this)
    ├── localDataSource.json               # Test data (local only)
    ├── manifest.json                      # Configuration
    ├── README.md                          # Documentation
    ├── PortalInboxExtension_1_0_0_3.zip   # Solution package (optional)
    └── PortalInboxExtension/              # Unpacked solution (optional)
        ├── Entities/
        ├── Other/
        └── powerpagecomponents/
```

## Common Mistakes to Avoid

- Creating HTML files in extension folders (only at root)
- Multiple markdown files per extension (only README.md)
- Separate config or example files (include in README)
- Deploying test JSON files to portal
- Hardcoding colors or configuration in extension code
- Missing `requiresAuthentication` flag in manifest
- Forgetting to update init files when adding extensions
- Uploading files to wrong paths (use root level)
- Using fallback values for required data (fail fast instead)

## Before Making Changes

1. Read this RULES.md file
2. Verify current structure follows rules
3. Plan changes to comply with standards
4. Make changes
5. Verify extension has minimum 4 files (JS, JSON, manifest, README)
