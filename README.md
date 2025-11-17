# Portal Extensions

This solution contains multiple portal extension projects that enhance and extend portal functionality for Microsoft Power Pages.

## 🚀 Architecture Overview

This repository includes a **manifest-based deployment system** where:
- Each extension has a `manifest.json` defining deployment configuration
- C# plugin reads manifests and generates `portal-extensions-init.js`
- Extensions automatically detect environment (local vs portal)
- Dual data sources: Local JSON for dev, Power Pages Web API for production

### Quick Links
- 📋 **[Manifest Schema](./manifest.schema.json)** - JSON Schema for validation
- 📐 **[Development Rules](./RULES.md)** - Repository structure and coding standards
- 📘 **[Extension README](./portal-inbox-extension/README.md)** - Detailed extension docs

## Extensions

### Portal Inbox Extension
A messaging extension with environment-aware data loading and full CRUD operations.

- **Location:** `portal-inbox-extension/`
- **Description:** Inbox messages with read/unread tracking, reply functionality, and archive features
- **Data Sources:** 
  - Local: `localDataSource.json` (development/testing)
  - Portal: Power Pages Web API (production)
- **Features:** Environment detection, OData queries, CSRF authentication, field mapping
- **Manifest:** [View manifest.json](./portal-inbox-extension/manifest.json)
- **Documentation:** [View Extension README](./portal-inbox-extension/README.md)
- **Demo:** See `portal-demo.html` for full demonstration

## Getting Started

### For Extension Users

Each extension is self-contained within its own directory. Navigate to the specific extension folder and refer to its README for detailed information about that extension.

### For C# Plugin Developers

The C# plugin should:

1. **Read all `manifest.json` files** from extension folders
2. **Generate `portal-extensions-init.js`** in the root with all initialization configs
3. **Deploy web files** to Power Pages as specified in manifests
4. **Upload to tracker code** (head content snippet):
   ```html
   <script src="/portal-extensions/portal-extensions.js"></script>
   <script src="/portal-extensions/portal-extensions-init.js"></script>
   ```

## Structure

```
portal-extensions/
├── manifest.schema.json              # JSON Schema for manifest validation
├── portal-extensions-init.js         # GENERATED - Combined initialization (DO NOT EDIT)
├── portal-demo.html                  # Demo page showing all extensions
├── portal-extensions.js              # Extension loader (static)
├── RULES.md                          # Development rules and standards
├── README.md                         # This file - master documentation
└── portal-inbox-extension/           # Individual extension projects
    ├── manifest.json                 # Deployment manifest
    ├── README.md                     # Extension-specific documentation
    ├── portal-inbox-extension.js     # Extension code (deployed)
    └── localDataSource.json          # Local test data (NOT deployed)
```

## Manifest System Features

✅ **Environment Detection** - Auto-switches between local JSON and Web API  
✅ **Dual Data Sources** - Development (JSON) and Production (Dataverse)  
✅ **Generated Initialization** - C# plugin creates init file from manifests  
✅ **Web File Management** - Uploads JavaScript files to portal  
✅ **OData Query Support** - $select, $filter, $orderby, $expand  
✅ **CRUD Operations** - Read, Create, Update, Delete via Web API  
✅ **CSRF Authentication** - Secure Web API calls  
✅ **Field Mapping** - Dataverse fields mapped to internal format  
✅ **JSON Schema Validation** - Real-time validation in VS Code  
✅ **Static Extensions** - All config in init, extensions remain static  

## Adding New Extensions

To add a new extension to this solution:

1. **Create extension folder** at the root level
2. **Add required files** (exactly 4 files per extension):
   - `{extension-name}.js` - Extension code (static, no hardcoded config)
   - `{data-file}.json` - Sample data for local testing (NOT deployed)
   - `manifest.json` - Deployment configuration with initialization section
   - `README.md` - Documentation

3. **Configure manifest.json:**
   ```json
   {
     "$schema": "../manifest.schema.json",
     "publisher": {
       "name": "Your Organization",
       "prefix": "prefix"
     },
     "extension": {
       "id": "my-extension",
       "name": "My Extension",
       "version": "1.0.0"
     },
     "dependencies": {
       "bootstrap": "5.x",
       "javascript": "ES6+"
     },
     "deployment": {
       "webFiles": [
         {
           "name": "my-extension.js",
           "source": "./my-extension.js",
           "partialUrl": "portal-extensions/my-extension.js"
         }
       ]
     },
     "initialization": {
       "localDataSource": "my-extension/data.json",
       "portalDataSource": {
         "entitySetName": "prefix_tablename",
         "baseUrl": "/_api",
         "operations": { /* CRUD config */ }
       },
       "containerId": "my-extension-container",
       "config": { /* Extension-specific config */ }
     }
   }
   ```

4. **Follow the rules** - See [RULES.md](./RULES.md) for complete guidelines

## C# Plugin Workflow

The C# plugin should implement this workflow:

1. ✅ **Scan** extension folders for `manifest.json` files
2. ✅ **Validate** manifests against JSON schema
3. ✅ **Generate** `portal-extensions-init.js` from all `initialization` sections
4. ✅ **Deploy** web files specified in `deployment.webFiles`
5. ✅ **Upload** both scripts to tracker code (head) content snippet:
   ```html
   <script src="/portal-extensions/portal-extensions.js"></script>
   <script src="/portal-extensions/portal-extensions-init.js"></script>
   ```
6. ✅ **Configure** Power Pages Web API site settings (if using portalDataSource)
7. ✅ **Publish** customizations

**Result:** Zero manual configuration! Extensions work locally and in production. 🎉

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

[Add your license information here]
