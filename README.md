# Portal Extensions

A modular, manifest-based extension system for Microsoft Power Pages that enables self-contained JavaScript extensions with automatic environment detection, dual data sources, and centralized configuration management.

## Architecture Overview

This solution provides a complete framework for building and deploying portal extensions:

- **Manifest-Based Configuration** - Each extension defines its deployment and initialization in `manifest.json`
- **Dual Init Files** - Separate initialization for authenticated (`-auth.js`) and public (`-noauth.js`) extensions
- **Environment Detection** - Extensions automatically switch between local JSON and Web API
- **Static Extension Files** - All configuration externalized to init files, keeping extension code static
- **JSON Schema Validation** - Real-time validation and IntelliSense in VS Code

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Power Pages Portal                                           │
├─────────────────────────────────────────────────────────────┤
│ Head Snippet (Tracking Code)                                │
│ <script src="/portal-extensions.js">                        │
│ <script src="/portal-extensions-init-auth.js">   (logged in)│
│ <script src="/portal-extensions-init-noauth.js"> (public)   │
├─────────────────────────────────────────────────────────────┤
│ Extensions Load & Initialize Based on Auth State            │
│ ├─ Authenticated: Portal Inbox, User Dashboard, etc.        │
│ └─ Public: Announcement Banner, Cookie Consent, etc.        │
└─────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
portal-extensions/
├── manifest.schema.json                   # JSON Schema for manifest validation
├── portal-extensions.js                   # Extension loader (static)
├── portal-extensions-init-auth.js         # GENERATED - Authenticated extensions init
├── portal-extensions-init-noauth.js       # GENERATED - Public extensions init
├── portal-demo.html                       # Demo page showing all extensions
├── RULES.md                              # Development rules and standards
├── README.md                             # This file
│
└── portal-inbox-extension/               # Example extension
    ├── manifest.json                     # Extension manifest
    ├── portal-inbox-extension.js         # Extension code (static)
    ├── localDataSource.json              # Local test data (NOT deployed)
    ├── README.md                         # Extension documentation
    ├── *.png, *.jpg, *.gif               # Optional: Images for documentation
    └── *.zip                             # Optional: Packaged extension for distribution
```

## Current Extensions

### Portal Inbox Extension
**Status:** Production Ready  
**Authentication:** Required (`requiresAuthentication: true`)

A comprehensive messaging system with read/unread tracking, reply functionality, and archive features.

**Key Features:**
- Server-side read status tracking via custom boolean field
- Cross-device/browser synchronization
- localStorage fallback for backward compatibility
- Reply functionality (creates new comments with direction code 1)
- Archive view for read messages
- Bootstrap 5 modals for confirmations/alerts
- Full OData CRUD operations
- Automatic environment detection

**Data Source:** `adx_portalcomments` table in Dataverse

**See:** [Portal Inbox Extension README](./portal-inbox-extension/README.md)

## Getting Started

### For Portal Administrators

1. **Deploy Extensions to Power Pages**
   - Upload extension JavaScript files to Web Files (at root level)
   - Upload initialization files (`portal-extensions-init-auth.js`, `portal-extensions-init-noauth.js`)
   - Upload loader (`portal-extensions.js`)
   
   **Note:** All files should be deployed at the root level of your portal (e.g., `/portal-extensions.js`, not `/portal-extensions/portal-extensions.js`).

2. **Add to Tracking Code (Head)**
   
   In Portal Management > Web Templates > Tracking Code (Head):

   ```html
   <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

   <script type="text/javascript" src="/portal-extensions.js"></script>

   {% if user %}
   <script type="text/javascript" src="/portal-extensions-init-auth.js"></script>
   {% endif %}

   <script type="text/javascript" src="/portal-extensions-init-noauth.js"></script>
   ```

3. **Configure Web API Permissions**
   - Enable required entity permissions for `adx_portalcomments`
   - Configure site settings for Web API
   - Set up Table Permissions for authenticated users

### For Developers

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd portal-extensions
   ```

2. **Open in VS Code**
   - JSON Schema provides validation and IntelliSense
   - No build tools required
   - Extensions are vanilla JavaScript

3. **Test Locally**
   - Open `portal-demo.html` in browser
   - Extensions automatically use local JSON data

4. **Customize Configuration**
   - Edit `manifest.json` for your extension
   - Modify colors, text, features as needed
   - Init files are generated from manifests

## Key Features

### Environment Detection
Extensions automatically detect whether they're running locally or in the portal:

- **Local Environment**: Uses JSON files for data
- **Portal Environment**: Uses Power Pages Web API (OData)
- **Detection Logic**: Checks hostname, protocol, IP ranges

### Dual Data Sources

**Local Development:**
```json
{
  "localDataSource": "portal-inbox-extension/localDataSource.json"
}
```

**Production (Power Pages):**
```json
{
  "portalDataSource": {
    "entitySetName": "adx_portalcomments",
    "baseUrl": "/_api",
    "operations": {
      "read": { "enabled": true, "select": null, "filter": null, "orderBy": "createdon desc", "expand": "..." },
      "create": { "enabled": true },
      "update": { "enabled": true },
      "delete": { "enabled": false }
    }
  }
}
```

### Authentication-Based Loading

Extensions declare authentication requirements in their manifest:

```json
{
  "extension": {
    "id": "portal-inbox-extension",
    "name": "Portal Inbox Extension",
    "version": "1.0.0",
    "requiresAuthentication": true  // ← Controls which init file includes this
  }
}
```

- **`requiresAuthentication: true`** → Loaded in `portal-extensions-init-auth.js`
- **`requiresAuthentication: false`** → Loaded in `portal-extensions-init-noauth.js`

### Manifest-Driven Configuration

All extensions define their configuration in `manifest.json`:

- Publisher information
- Extension metadata
- Dependencies (Bootstrap, Icons)
- Deployment configuration
- Initialization settings (colors, text, features)

> **Note:** Automated init file generation will be available in a future release.

## Adding New Extensions

### Step 1: Create Extension Folder
```bash
mkdir portal-your-extension
cd portal-your-extension
```

### Step 2: Create Required Files

**File Structure (4 files required):**
```
portal-your-extension/
├── manifest.json                  # Deployment & initialization config
├── portal-your-extension.js       # Extension code (static)
├── localDataSource.json          # Local test data
└── README.md                     # Documentation
```

### Step 3: Create manifest.json

```json
{
  "$schema": "../manifest.schema.json",
  "publisher": {
    "name": "Your Organization",
    "prefix": "yourprefix"
  },
  "extension": {
    "id": "portal-your-extension",
    "name": "Your Extension",
    "version": "1.0.0",
    "requiresAuthentication": false
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
        "partialUrl": "portal-extensions/portal-your-extension.js"
      }
    ]
  },
  "initialization": {
    "containerId": "portal-your-extension",
    "features": {
      "enableFeature1": true
    }
  }
}
```

### Step 4: Create Extension JavaScript

```javascript
(function() {
    'use strict';
    
    const YourExtension = {
        config: null,
        
        init: function(options) {
            this.config = options;
            this.setup();
        },
        
        setup: function() {
            // Your extension logic here
        }
    };
    
    window.YourExtension = YourExtension;
})();
```

### Step 5: Test & Deploy

1. Test locally with `portal-demo.html`
2. Manually generate init files from your manifest
3. Deploy JavaScript files to Web Files

## 📚 Documentation

- **[Manifest Schema](./manifest.schema.json)** - Complete schema with validation
- **[Development Rules](./RULES.md)** - Repository standards and conventions
- **[Portal Inbox README](./portal-inbox-extension/README.md)** - Detailed extension docs

## Testing

### Local Testing
1. Open `portal-demo.html` in browser
2. Extensions automatically use local JSON data
3. Test all features without portal environment

### Portal Testing
1. Deploy to development portal
2. Extensions automatically switch to Web API
3. Test with real Dataverse data

### Testing Utilities

Extensions expose testing utilities in their public API:

```javascript
// Clear read status for testing
PortalInboxExtension.clearReadStatus();

// Refresh messages
PortalInboxExtension.refresh();
```

## Advanced Configuration

### OData Query Configuration

Control data retrieval with OData parameters:

```json
{
  "operations": {
    "read": {
      "enabled": true,
      "select": "activityid,subject,description,createdon",
      "filter": "statecode eq 0",
      "orderBy": "createdon desc",
      "expand": "related_table($select=field1,field2)"
    }
  }
}
```

### Color Customization

All colors are configurable to match your branding:

```json
{
  "colors": {
    "avatarGradientStart": "#0078d4",
    "avatarGradientEnd": "#005a9e",
    "badgeBackground": "#dc3545",
    "primaryColor": "#0078d4"
  }
}
```

### Feature Flags

Enable/disable features per environment:

```json
{
  "features": {
    "enableArchive": true,
    "enableReply": true,
    "enableExternalLinkWarning": true,
    "allowHtmlInMessages": true
  }
}
```

## Security

- **CSRF Protection** - All Web API calls include anti-forgery tokens
- **Authentication** - Extensions can require authenticated users
- **Table Permissions** - Dataverse security enforced via Table Permissions
- **XSS Prevention** - HTML escaping for user-generated content
- **External Link Warnings** - Optional warnings for external URLs

## Troubleshooting

### Extensions Not Loading
- Check browser console for errors
- Verify `portal-extensions.js` loaded before init files
- Ensure init files fire `portalExtensionsLoaded` event

### Web API Errors
- Verify Table Permissions configured
- Check site settings for Web API enabled
- Confirm entity set name matches Dataverse table
- Review browser Network tab for 401/403 errors

### Data Not Showing
- Check environment detection (local vs portal)
- Verify local JSON file path for development
- Confirm Web API base URL for production
- Review OData query parameters

## Contributing

1. Fork the repository
2. Create extension in new folder
3. Add manifest.json following schema
4. Document in extension README
5. Submit pull request

## Support

**Contact:** Daniel Penrod  
**Email:** daniel.penrod@microsoft.com

## Disclaimer

This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement. In no event shall the author or copyright holder be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.

Use at your own risk. The author accepts no responsibility for any issues, data loss, or damages that may occur from using this extension framework.

## Automated Deployment

> **Note:** Automated deployment tooling for manifest-based init file generation and Web File deployment will be available in a future release.

## Contributing

When working on extensions, please ensure:
- Each extension has exactly 4 files (JS, JSON, manifest, README)
- Extension JS files are static (no hardcoded configuration)
- All configuration goes in manifest `initialization` section
- Local data files (JSON) are for testing only and not deployed
- Follow the structure defined in [RULES.md](./RULES.md)
- Update manifest.json with both localDataSource and portalDataSource
- Code follows consistent formatting and style
- Test both local and portal data sources
- Validate manifest against schema before committing
- Changes are committed with clear, descriptive messages

## Documentation

- **[manifest.schema.json](./manifest.schema.json)** - JSON Schema for validation
- **[RULES.md](./RULES.md)** - Development rules and repository structure
- **Extension READMEs** - Individual extension documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License allows you to:
- Use commercially in proprietary systems
- Modify and distribute
- Use privately
- Sublicense

**No warranty is provided. Use at your own risk.**
