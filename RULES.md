# Portal Extensions - Development Rules

## File Structure Rules

### Solution Root Files:
1. **portal-demo.html** - Main demo page that loads all extensions
2. **portal-extensions.js** - Loader that dynamically imports all extension JS files
3. **portal-extension-init-auth.js** - Initialization for authenticated extensions
4. **portal-extension-init-noauth.js** - Initialization for public extensions
5. **manifest.schema.json** - JSON Schema for manifest validation
6. **RULES.md** - This file
7. **README.md** - Solution-level documentation
8. **.gitignore** - Git ignore file

### Each Extension Folder Must Contain EXACTLY:
1. **1 JS file** - `{extension-name}.js` (the extension code - deployed)
2. **1 JSON file** - `{data-file}.json` (local test data - NOT deployed)
3. **1 README file** - `README.md` (documentation)
4. **1 MANIFEST file** - `manifest.json` (deployment configuration)
5. **OPTIONAL: 1 Solution Folder** - Unpacked Dataverse solution for version control (e.g., `PortalInboxExtension/`)
6. **OPTIONAL: 1 Solution ZIP** - Packaged solution for deployment (e.g., `PortalInboxExtension_1_0_0_1.zip`)

### Total: 4 files per extension minimum (JS, JSON, manifest, README)
### Optional: +1 unpacked solution folder and +1 solution zip file

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

### No Fallback Code (CRITICAL):
- **Code must either work 100% correctly or throw a clear error**
- NO fallback values for missing required data (no "Unknown", "N/A", "Staff", "You", etc.)
- NO optional chaining with default values for required fields
- NO defensive coding that masks configuration errors
- If API data is missing or incorrect, throw an error immediately with:
  - What is missing
  - Why it's needed
  - How to fix it (e.g., API configuration)
- Exception: Only use fallbacks for truly optional features, never for core functionality

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

## Manifest File Requirements

### Every Extension MUST Include manifest.json:
- **Purpose**: Defines deployment and initialization configuration for the extension
- **Location**: Root of extension folder (e.g., `portal-inbox-extension/manifest.json`)
- **Schema**: Must reference `../manifest.schema.json`
- **Required Sections**:
  - `publisher`: Organization name and Dataverse prefix
  - `extension`: ID, name, and version
  - `dependencies`: Bootstrap, Bootstrap Icons, and JavaScript type (ES6+ or jQuery)
  - `deployment.webFiles`: Where to publish the JS file in the portal (NOT the init file)
  - `initialization`: Configuration for the extension initialization

### Manifest Structure:
```json
{
  "$schema": "../manifest.schema.json",
  "publisher": {
    "name": "Microsoft Federal",
    "prefix": "msfed"
  },
  "extension": {
    "id": "portal-inbox-extension",
    "name": "Portal Inbox Extension",
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
        "name": "portal-inbox-extension.js",
        "source": "./portal-inbox-extension.js",
        "partialUrl": "portal-extensions/portal-inbox-extension.js"
      }
    ]
  },
  "initialization": {
    "localDataSource": "portal-inbox-extension/localDataSource.json",
    "portalDataSource": {
      "entitySetName": "adx_portalcomments",
      "baseUrl": "/_api",
      "operations": {
        "read": { 
          "enabled": true, 
          "select": null, 
          "filter": null, 
          "orderBy": "createdon desc", 
          "expand": "adx_portalcomment_activity_parties($expand=partyid_contact,partyid_systemuser)" 
        },
        "create": { "enabled": true },
        "update": { "enabled": true },
        "delete": { "enabled": false }
      }
    },
    "containerId": "portal-inbox-extension",
    "colors": {
      "avatarGradientStart": "#0078d4",
      "avatarGradientEnd": "#005a9e",
      "avatarText": "#ffffff",
      "headerGradientStart": "#0078d4",
      "headerGradientEnd": "#005a9e",
      "headerText": "#ffffff",
      "primaryColor": "#0078d4",
      "badgeBackground": "#dc3545"
    },
    "text": {
      "messagesHeader": "Messages",
      "archivedHeader": "Archived Messages",
      "unreadLabel": "unread",
      "noUnreadMessages": "No unread messages"
    },
    "icons": {
      "inbox": "bi-inbox-fill",
      "reply": "bi-reply-fill",
      "archive": "bi-archive-fill"
    },
    "styles": {
      "dropdownWidth": "400px",
      "messageMaxHeight": "70vh"
    },
    "features": {
      "enableArchive": true,
      "enableReply": true,
      "enableExternalLinkWarning": true,
      "allowHtmlInMessages": true
    }
  }
}
```

### Manual Deployment Workflow:
1. **Review** all `manifest.json` files from extension folders
2. **Separate** extensions based on `requiresAuthentication` flag
3. **Update** init files manually:
   - `portal-extension-init-auth.js` - Extensions requiring authenticated users
   - `portal-extension-init-noauth.js` - Public extensions (no auth required)
4. **Upload** extension JS files to Power Pages as specified in `deployment.webFiles`
5. **Add** scripts to Power Pages tracker code (head):
   ```html
   <!-- Bootstrap Icons -->
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
   
   <script type="text/javascript" src="/portal-extensions.js"></script>
   
   {% if user %}
   <script type="text/javascript" src="/portal-extension-init-auth.js"></script>
   {% endif %}
   
   <script type="text/javascript" src="/portal-extension-init-noauth.js"></script>
   ```
   - Liquid template `{% if user %}` ensures auth extensions only load for authenticated users
   - Public extensions (noauth) always load for everyone

### Authentication Flag (`requiresAuthentication`):
- **true**: Extension only loads for authenticated users (e.g., inbox, profile)
- **false**: Extension loads for all users, including anonymous (e.g., chatbot, help widget)
- Extensions must be manually added to the correct init file based on this flag

### Notes:
- Each extension's own solution handles Dataverse tables, permissions, and web roles
- `{data}.json` files are only for local testing - NOT deployed to portal
- Manifest defines portal web file deployment and initialization config
- `portal-extension-init-auth.js` and `portal-extension-init-noauth.js` must be manually updated when adding extensions
- Extensions auto-detect environment (local vs portal) and use appropriate data source
- Extensions requiring user data MUST set `requiresAuthentication: true`
- Public/anonymous extensions MUST set `requiresAuthentication: false`

### Solution Package Workflow:
- Extensions may include Dataverse solutions for entity configurations and metadata
- Always unpack solutions when making changes: `pac solution unpack --zipfile <solution>.zip --folder <folder>`
- Work with unpacked solution files in the extension folder for version control
- Repack before deployment: `pac solution pack --zipfile <solution>.zip --folder <folder>`
- Keep both unpacked folder and zip file in the extension directory
- Solution folder should be committed to version control for tracking entity/form changes

## Before Making Any Changes:
1. Read this RULES.md file
2. Verify current structure follows rules
3. Plan changes to comply with rules
4. Execute changes
5. Verify final structure has exactly 4 files per extension (JS, JSON, README, MANIFEST)

## Repository Structure:
```
portal-extensions/
├── portal-demo.html                      # Main demo page
├── portal-extensions.js                  # Loader for all extensions
├── portal-extension-init-auth.js         # Authenticated extensions initialization
├── portal-extension-init-noauth.js       # Public extensions initialization
├── manifest.schema.json                  # JSON schema for manifests
├── RULES.md                              # This file
├── README.md                             # Solution-level documentation
├── .gitignore
├── portal-inbox-extension/               # Requires Authentication
│   ├── portal-inbox-extension.js         # Extension code (deployed)
│   ├── localDataSource.json              # Local test data (NOT deployed)
│   ├── manifest.json                     # Deployment config (requiresAuthentication: true)
│   ├── README.md                         # Documentation
│   ├── PortalInboxExtension_1_0_0_1.zip  # Dataverse solution package (optional)
│   └── PortalInboxExtension/             # Unpacked solution for version control (optional)
│       ├── Entities/
│       ├── Other/
│       └── powerpagecomponents/
└── another-public-extension/             # Public (No Auth Required)
    ├── another-public-extension.js       # Extension code (deployed)
    ├── data.json                         # Local test data (NOT deployed)
    ├── manifest.json                     # Deployment config (requiresAuthentication: false)
    └── README.md                         # Documentation
```

## Violations to Watch For:
- HTML files in extension folders
- Multiple markdown files in extension folder
- Separate example/demo files
- Configuration files (should be inline in README)
- Any file count < 4 per extension folder (JS, JSON, manifest, README minimum)
- Deploying local test JSON files to portal
- Missing `requiresAuthentication` flag in manifest
- Extensions with user data not requiring authentication
- Extensions requiring authentication for public features
- Forgetting to update init files when adding new extensions
