# Portal Extensions

This solution contains multiple portal extension projects that enhance and extend portal functionality for Microsoft Power Pages.

## 🚀 New: Automated Deployment System

This repository now includes a **comprehensive manifest-based deployment system** that enables C# plugins to automatically deploy extensions to Power Pages portals. Each extension includes a `manifest.json` file that describes all deployment requirements.

### Quick Links
- 📋 **[Manifest Guide](./MANIFEST_GUIDE.md)** - Complete manifest documentation
- 📦 **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Overview of the deployment system
- 📐 **[Development Rules](./RULES.md)** - Repository structure and coding standards
- 🔧 **[C# Models](./ExtensionManifest.cs)** - Ready-to-use C# classes for your plugin
- ⚙️ **[Deployment Service](./ExtensionDeploymentService.cs)** - Reference C# implementation

## Extensions

### Portal Inbox Extension
An extension that displays inbox messages within the portal interface using Bootstrap 5 modals for all dialogs.

- **Location:** `portal-inbox-extention/`
- **Description:** Provides an inbox extension for displaying messages with read/unread tracking, reply functionality, and archive features
- **UI Components:** Uses Bootstrap 5 modals exclusively (no native browser popups)
- **Manifest:** [View manifest.json](./portal-inbox-extention/manifest.json)
- **Documentation:** [View Extension README](./portal-inbox-extention/README.md)
- **Demo:** See `portal-demo.html` for full demonstration

## Getting Started

### For Extension Users

Each extension is self-contained within its own directory. Navigate to the specific extension folder and refer to its README for detailed information about that extension.

### For C# Plugin Developers

1. **Copy the C# files to your project:**
   - `ExtensionManifest.cs` - Model classes for manifest deserialization
   - `ExtensionDeploymentService.cs` - Deployment service implementation

2. **Install required NuGet packages:**
   ```bash
   dotnet add package Newtonsoft.Json
   dotnet add package Microsoft.PowerPlatform.Dataverse.Client
   ```

3. **Use the deployment service:**
   ```csharp
   var service = new ExtensionDeploymentService(serviceClient, websiteId, "/portal-extensions/");
   var result = service.DeployExtension("path/to/manifest.json");
   ```

4. **Read the documentation:**
   - [MANIFEST_GUIDE.md](./MANIFEST_GUIDE.md) - Learn about every manifest section
   - [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Understand the deployment flow

## Structure

```
portal-extentions/
├── manifest.schema.json         # JSON Schema for manifest validation
├── MANIFEST_GUIDE.md            # Complete manifest documentation
├── IMPLEMENTATION_SUMMARY.md    # Deployment system overview
├── ExtensionManifest.cs         # C# model classes
├── ExtensionDeploymentService.cs # C# deployment service
├── portal-demo.html             # Main demo page for all extensions
├── portal-extensions.js         # Extension loader
├── RULES.md                     # Development rules and standards
├── README.md                    # This file - master documentation
└── portal-inbox-extention/      # Individual extension projects
    ├── manifest.json            # Deployment manifest
    ├── README.md                # Extension-specific documentation
    ├── portal-inbox-extention.js
    └── messages.json
```

## Manifest System Features

✅ **Automated Deployment** - C# plugin reads manifest and deploys automatically  
✅ **Dataverse Integration** - Automatically creates tables, permissions, and roles  
✅ **Web File Management** - Uploads JavaScript and data files  
✅ **Content Snippets** - Configures tracking code and snippets  
✅ **Site Settings** - Creates configuration settings  
✅ **Security Configuration** - Built-in authentication and authorization  
✅ **Dependency Management** - Validates required libraries  
✅ **Multi-language Support** - Localization ready  
✅ **Type Safety** - Complete C# models included  
✅ **JSON Schema Validation** - Real-time validation in VS Code  

## Adding New Extensions

To add a new extension to this solution:

1. **Create extension folder** at the root level
2. **Add required files** (exactly 4 files per extension):
   - `{extension-name}.js` - Extension code
   - `{data-file}.json` - Sample data
   - `manifest.json` - Deployment configuration
   - `README.md` - Documentation

3. **Configure manifest.json:**
   ```json
   {
     "$schema": "../manifest.schema.json",
     "manifestVersion": "1.0.0",
     "extension": {
       "id": "my-extension",
       "name": "My Extension",
       "version": "1.0.0"
     },
     "deployment": { /* ... */ }
   }
   ```

4. **Update portal-extensions.js** - Add to the extensions array
5. **Follow the rules** - See [RULES.md](./RULES.md) for complete guidelines

## Deployment with C# Plugin

The manifest-based deployment system handles:

1. ✅ Dataverse table creation
2. ✅ Table permission configuration  
3. ✅ Web role setup
4. ✅ Web file uploads
5. ✅ Tracking code injection
6. ✅ Content snippet creation
7. ✅ Site settings configuration
8. ✅ Dependency validation
9. ✅ Customization publishing

**Zero manual configuration required!** 🎉

## Contributing

When working on extensions, please ensure:
- Each extension has exactly 4 files (JS, JSON, manifest, README)
- Follow the structure defined in [RULES.md](./RULES.md)
- Update manifest.json with all deployment requirements
- Code follows consistent formatting and style
- Changes are committed with clear, descriptive messages
- Test manifest validation before committing

## Documentation

- **[MANIFEST_GUIDE.md](./MANIFEST_GUIDE.md)** - Complete guide to the manifest system
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - System overview and quick reference
- **[RULES.md](./RULES.md)** - Development rules and repository structure
- **Extension READMEs** - Individual extension documentation

## License

[Add your license information here]
