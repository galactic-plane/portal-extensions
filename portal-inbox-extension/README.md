# Portal Inbox Extension

A production-ready, self-contained messaging system for Microsoft Power Pages with server-side read status tracking, reply functionality, and cross-device synchronization.

## 📋 Overview

The Portal Inbox Extension displays messages from the `adx_portalcomments` table in a dropdown inbox with unread badges, message details, reply capabilities, and archive functionality. Built with Bootstrap 5, fully isolated, and completely configurable via manifest.

### PortalInboxExtension Solution Package

This extension includes a **Dataverse unmanaged solution** (`PortalInboxExtension_1_0_0_1.zip`) that contains:

- **Custom Entity Configuration**: `adx_portalcomment` entity with custom fields including `msfed_hasread`
- **Form Customizations**: Main form with ribbon customizations for the comment entity
- **Web Files**: Portal extension JavaScript files as Power Pages components
- **Solution Components**: All required metadata for deploying the extension to Dataverse

The solution is unpacked into the `PortalInboxExtension/` folder for version control and can be repacked for deployment to other environments. This allows you to modify entity configurations, forms, and web files, then repack and deploy the solution.

### Key Highlights

- ✅ **Server-Side Read Tracking** - Uses `msfed_hasread` field for cross-device consistency
- ✅ **Dual Environment Support** - Automatic switching between local JSON and Web API
- ✅ **Reply Functionality** - Create responses with proper direction codes
- ✅ **Archive View** - Toggle between unread and archived messages
- ✅ **Zero Conflicts** - IIFE pattern prevents global scope pollution
- ✅ **Bootstrap 5 Modals** - No native alerts/confirms
- ✅ **Fully Customizable** - All colors, text, and features configurable
- ✅ **Static Extension File** - All configuration externalized to manifest

## 🎯 Features

### Core Functionality

- **Message Display** - Dropdown inbox with avatar initials, subject, timestamp
- **Unread Badge** - Shows count of unread messages in navbar
- **Message Details** - Full message view in Bootstrap modal
- **Read Status** - Server-side tracking via `msfed_hasread` field
- **Reply** - Create responses (direction code = 1, incoming from contact)
- **Archive** - View read messages separately from unread
- **Auto-Sync** - localStorage synchronized with server read status

### Technical Features

- **Environment Detection** - Automatically detects local vs portal
- **OData CRUD Operations** - Full Read, Create, Update support
- **CSRF Token Authentication** - Secure Web API calls
- **Activity Party Expansion** - Retrieves sender and recipient details
- **Field Mapping** - Maps `adx_portalcomment` fields to internal format
- **LocalStorage Fallback** - Works when `msfed_hasread` unavailable
- **Cross-Device Sync** - Read status syncs across browsers/devices
- **External Link Warnings** - Optional security warnings for external URLs

## 🏗️ Architecture

### Namespace Isolation

```javascript
(function() {
    'use strict';
    
    // Three namespaces:
    const Data = { /* data operations */ };
    const UI = { /* UI rendering */ };
    const Main = { /* initialization */ };
    
    // Public API
    window.PortalInboxExtension = {
        init: Main.init.bind(Main),
        refresh: Main.refresh.bind(Main),
        clearReadStatus: function() { /* testing utility */ },
        Data: Data,
        UI: UI,
        Main: Main
    };
})();
```

### Data Flow

```
1. User Authentication
   ↓
2. Extension Loads (portal-extensions-init-auth.js)
   ↓
3. Environment Detection
   ├─ Local: Fetch localDataSource.json
   └─ Portal: Fetch via Web API /_api/adx_portalcomments
   ↓
4. Map Dataverse Fields to Internal Format
   ├─ Check msfed_hasread field (server-side read status)
   └─ Fallback to localStorage if msfed_hasread unavailable
   ↓
5. Render Messages in Dropdown
   ↓
6. User Clicks Message
   ↓
7. Mark as Read
   ├─ Update localStorage timestamp
   ├─ PATCH msfed_hasread = true to server
   └─ Re-render UI
   ↓
8. Sync on Next Load
   └─ Server read status takes precedence over localStorage
```

### Read Status Logic

```
Priority: Server > LocalStorage > Default (false)

When Loading Messages:
1. Check if msfed_hasread exists in comment
2. If yes → Use msfed_hasread value
3. If no → Compare createdon with localStorage timestamp
4. Update localStorage with most recent read message date

When Marking as Read:
1. Update localStorage with message date
2. PATCH msfed_hasread = true to server
3. On next load, server value takes precedence
```

## 📦 Data Sources

### Local Development (JSON)

**File:** `localDataSource.json`

```json
{
  "value": [
    {
      "activityid": "guid-1",
      "subject": "Welcome Message",
      "description": "Welcome to the portal!",
      "createdon": "2025-11-19T10:00:00Z",
      "adx_portalcommentdirectioncode": 2,
      "msfed_hasread": false,
      "adx_portalcomment_activity_parties": [
        {
          "partyid_systemuser": {
            "fullname": "Support Team"
          }
        },
        {
          "partyid_contact": {
            "fullname": "John Doe"
          }
        }
      ],
      "_regardingobjectid_value": "guid-app-1",
      "statecode": 0,
      "statuscode": 1
    }
  ]
}
```

### Production (Power Pages Web API)

**Entity:** `adx_portalcomments`  
**Endpoint:** `/_api/adx_portalcomments`

**Query Parameters:**
- **$filter:** `adx_portalcommentdirectioncode eq 2` (Outgoing to contact)
- **$orderby:** `createdon desc`
- **$expand:** `adx_portalcomment_activity_parties($expand=partyid_contact,partyid_systemuser)`

**Field Mapping:**
| Dataverse Field | Internal Property | Description |
|----------------|------------------|-------------|
| `activityid` | `id` | Unique message ID |
| `subject` | `subject` | Message subject line |
| `description` | `body` | Message body text |
| `createdon` | `date` | Message timestamp |
| `msfed_hasread` | `read` | Server-side read status |
| `adx_portalcommentdirectioncode` | `directionCode` | 1=Incoming, 2=Outgoing |
| `_regardingobjectid_value` | `regardingObjectId` | Related application |
| `statecode` | `statecode` | 0=Active, 1=Inactive |
| `statuscode` | `statuscode` | Status reason |

## ⚙️ Configuration

All configuration is defined in `manifest.json` and loaded via `portal-extensions-init-auth.js`:

### Portal Data Source

```json
{
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
      "create": {
        "enabled": true
      },
      "update": {
        "enabled": true
      },
      "delete": {
        "enabled": false
      }
    }
  }
}
```

### Colors

```json
{
  "colors": {
    "avatarGradientStart": "#0078d4",
    "avatarGradientEnd": "#005a9e",
    "avatarText": "#ffffff",
    "headerGradientStart": "#0078d4",
    "headerGradientEnd": "#005a9e",
    "headerText": "#ffffff",
    "messageFrom": "#1e293b",
    "messageSubject": "#64748b",
    "messageTime": "#94a3b8",
    "dropdownBorder": "#e2e8f0",
    "dropdownShadow": "rgba(0, 0, 0, 0.15)",
    "itemHoverBackground": "#f1f5f9",
    "itemUnreadBackground": "#f8f9ff",
    "itemBorderColor": "#e2e8f0",
    "badgeBackground": "#dc3545",
    "badgeText": "#ffffff",
    "navLinkColor": "#ffffff",
    "navLinkCaretColor": "#ffffff",
    "primaryColor": "#0078d4"
  }
}
```

### Text Labels

All text is customizable for localization:

```json
{
  "text": {
    "messagesHeader": "Messages",
    "archivedHeader": "Archived Messages",
    "unreadLabel": "unread",
    "noUnreadMessages": "No unread messages",
    "viewArchived": "View Archived Messages",
    "modalTitle": "Message",
    "replyButton": "Reply",
    "sendReplyButton": "Send Reply",
    "replyPrompt": "Please enter a reply message.",
    "confirmSend": "Are you sure you want to send this reply?",
    "replySent": "Reply sent successfully!"
  }
}
```

### Features

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

## 🚀 Deployment

### PAC CLI Commands

To work with the solution package:

**Unpack solution:**
```bash
pac solution unpack --zipfile PortalInboxExtension_1_0_0_1.zip --folder PortalInboxExtension
```

**Pack solution:**
```bash
pac solution pack --zipfile PortalInboxExtension_1_0_0_1.zip --folder PortalInboxExtension
```

### Prerequisites

1. **Power Pages Portal** with authenticated users
2. **Bootstrap 5** and **Bootstrap Icons** in portal
3. **Web API enabled** in site settings
4. **Table Permissions** for `adx_portalcomment` entity
5. **Custom Field** `msfed_hasread` (Boolean) on `adx_portalcomment`

### Step 1: Add Custom Field

Add to `adx_portalcomment` table:
- **Field Name:** `msfed_hasread`
- **Data Type:** Yes/No (Boolean)
- **Default Value:** No (false)
- **Description:** Indicates if contact has read this message

### Step 2: Configure Table Permissions

Create Table Permission for `adx_portalcomment`:
- **Access Type:** Read, Write, Append
- **Scope:** Contact
- **Relationship:** adx_portalcomment > Contact (regardingobjectid)

### Step 3: Deploy Files

Upload to Power Pages Web Files:
1. `portal-inbox-extension.js` → `/portal-extensions/portal-inbox-extension.js`
2. `portal-extensions.js` → `/portal-extensions/portal-extensions.js`
3. `portal-extensions-init-auth.js` → `/portal-extensions/portal-extensions-init-auth.js`

### Step 4: Add to Tracking Code

In Portal Management > Web Templates > Tracking Code (Head):

```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

<script type="text/javascript" src="/portal-extensions.js"></script>

{% if user %}
<script type="text/javascript" src="/portal-extension-init-auth.js"></script>
{% endif %}

<script type="text/javascript" src="/portal-extension-init-noauth.js"></script>
```

**Note:** The `{% if user %}` Liquid template ensures authenticated extensions only load when a user is signed in.

Before closing `</body>`:
```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
```

### Step 5: Inject Container

The init file automatically injects the container into the navbar. No manual HTML required.

## 🧪 Testing

### Local Testing

1. Open `portal-demo.html` in browser
2. Extension uses `localDataSource.json`
3. Test all features without portal environment

### Testing Utilities

```javascript
// Clear read status for testing
PortalInboxExtension.clearReadStatus();

// Manually refresh messages
PortalInboxExtension.refresh();

// Access internal namespaces for debugging
PortalInboxExtension.Data.state;
PortalInboxExtension.UI.config;
```

### Browser Console

```javascript
// Check configuration
console.log(PortalInboxExtension.Main.config);

// Check message state
console.log(PortalInboxExtension.Data.state.messages);

// Check unread count
console.log(PortalInboxExtension.Data.state.unreadCount);
```

## 📊 Events

The extension fires custom events for integration:

```javascript
// Message clicked
document.addEventListener('portalInboxMessageClick', function(e) {
    console.log('Message clicked:', e.detail.messageId);
    console.log('Message data:', e.detail.message);
});

// Reply sent successfully
document.addEventListener('portalInboxReplySent', function(e) {
    console.log('Reply sent:', e.detail);
    console.log('Original message:', e.detail.originalMessage);
    console.log('Reply text:', e.detail.replyText);
    console.log('Timestamp:', e.detail.timestamp);
});
```

## 🔒 Security

### CSRF Protection
All Web API calls include anti-forgery tokens:
```javascript
'__RequestVerificationToken': token
```

### XSS Prevention
HTML content is escaped by default:
```javascript
escapeHtml: function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### External Link Warnings
Optional warnings when clicking external links in messages (configurable).

### Table Permissions
Dataverse security enforced via Table Permissions - users can only see their own messages.

## 🐛 Troubleshooting

### Messages Not Loading

**Check:**
- Browser console for errors
- Network tab for API calls
- Table Permissions configured correctly
- Web API enabled in site settings

**Common Issues:**
- 401 Unauthorized → User not authenticated
- 403 Forbidden → Table Permissions missing
- 404 Not Found → Incorrect entity set name
- No data → Filter excluding all records

### Read Status Not Syncing

**Check:**
- `msfed_hasread` field exists on table
- Update operations enabled in manifest
- Table Permissions include Write access
- Browser localStorage not blocked

### Reply Not Working

**Check:**
- Create operations enabled in manifest
- `regardingobjectid` lookup exists
- Direction code set correctly (1 = incoming)
- User has Append permission

## 📝 Customization

### Change Colors

Edit `manifest.json`:
```json
{
  "colors": {
    "primaryColor": "#your-color",
    "badgeBackground": "#your-color"
  }
}
```

### Add/Remove Features

Edit `manifest.json`:
```json
{
  "features": {
    "enableArchive": false,  // Disable archive view
    "enableReply": false     // Disable reply functionality
  }
}
```

### Customize OData Query

Edit `manifest.json`:
```json
{
  "operations": {
    "read": {
      "select": "activityid,subject,description",
      "filter": "statecode eq 0",
      "orderBy": "createdon asc"
    }
  }
}
```

## 🔗 Integration

### With Other Extensions

Extensions don't conflict due to IIFE isolation:
```javascript
// Each extension in own closure
(function() {
    'use strict';
    // Extension code
})();
```

### With Custom Code

Access public API:
```javascript
// Refresh inbox from external code
document.getElementById('myButton').addEventListener('click', function() {
    PortalInboxExtension.refresh();
});
```

## 📚 API Reference

### Public Methods

```javascript
// Initialize extension
PortalInboxExtension.init(config);

// Refresh messages from server
PortalInboxExtension.refresh();

// Clear read status (testing only)
PortalInboxExtension.clearReadStatus();
```

### Internal Namespaces (Advanced)

```javascript
// Data operations
PortalInboxExtension.Data.loadMessages();
PortalInboxExtension.Data.markMessageAsRead(messageId);

// UI operations
PortalInboxExtension.UI.renderMessages();
PortalInboxExtension.UI.showMessageModal(message);

// Main orchestration
PortalInboxExtension.Main.setup();
```

## 🎨 Styling

Extension injects its own CSS - no external stylesheets needed. All styles scoped to prevent conflicts.

### Custom CSS Override (Optional)

```html
<style>
#portal-inbox-extension .message-avatar {
    border-radius: 0 !important;  /* Square avatars */
}
</style>
```

## 📄 License

[Your License Here]

## 🤝 Support

[Your Support Information]

## 🗺️ Roadmap

- [ ] Push notifications for new messages
- [ ] Message search/filter
- [ ] Attachments support
- [ ] Message categories/labels
- [ ] Batch operations (mark all read, delete)
            create: {
                enabled: true,
                fields: 'msfed_subject,msfed_body,msfed_from,msfed_sentdate'
            },
            update: {
                enabled: true,
                fields: 'msfed_isread'    // Allow marking as read/unread
            },
            delete: {
                enabled: false            // Typically disabled for messages
            }
        }
    },
    containerId: 'portal-inbox-extension'
});
```

#### Environment Detection

The extension automatically detects the environment based on:
- `localhost` or `127.0.0.1` → **Local**
- `192.168.x.x` or `10.x.x.x` → **Local** (private networks)
- `.local` domain → **Local**
- `file://` protocol → **Local**
- All others → **Portal** (production)

**Console Output:**
```
Portal Inbox Extension: Environment detected as LOCAL
Portal Inbox Extension: Using local JSON file
```
or
```
Portal Inbox Extension: Environment detected as PORTAL
Portal Inbox Extension: Using Power Pages Web API
```

### Minimal Configuration (Required)

```javascript
PortalInboxExtension.init({
    enabled: true,                      // Optional: Set to false to disable extension (default: true)
    localDataSource: 'localDataSource.json',   // Required: Local JSON file path
    portalDataSource: { ... },          // Optional: Web API config (required for production)
    containerId: 'portal-inbox-extension'  // Required: ID of container element
});
```

### Basic Configuration with Common Customizations

```javascript
PortalInboxExtension.init({
    // Extension control
    enabled: true,                      // Set to false to completely disable this extension
    
    // Required
    dataSource: 'api/messages',
    containerId: 'portal-inbox-extension',
    
    // Customize text labels
    text: {
        messagesHeader: 'My Inbox',
        noUnreadMessages: 'All caught up! 🎉',
        replyButton: 'Respond'
    },
    
    // Feature toggles
    features: {
        enableArchive: true,
        enableReply: false,  // Disable reply feature
        enableExternalLinkWarning: false
    }
});
```

### Full Configuration Options

```javascript
PortalInboxExtension.init({
    // Extension control (FIRST parameter)
    enabled: boolean,         // Optional: true (default) to run, false to disable entirely
    
    // Required
    dataSource: string,       // URL to fetch messages
    containerId: string,      // Container element ID
    
    // Optional - Colors (all customizable to match your site)
    colors: {
        // Avatar colors
        avatarGradientStart: string,   // Default: '#0078d4'
        avatarGradientEnd: string,     // Default: '#005a9e'
        avatarText: string,            // Default: '#ffffff'
        
        // Header colors
        headerGradientStart: string,   // Default: '#0078d4'
        headerGradientEnd: string,     // Default: '#005a9e'
        headerText: string,            // Default: '#ffffff'
        
        // Message text colors
        messageFrom: string,           // Default: '#1e293b'
        messageSubject: string,        // Default: '#64748b'
        messageTime: string,           // Default: '#94a3b8'
        
        // Dropdown colors
        dropdownBorder: string,        // Default: '#e2e8f0'
        dropdownShadow: string,        // Default: 'rgba(0, 0, 0, 0.15)'
        
        // Item states
        itemHoverBackground: string,   // Default: '#f1f5f9'
        itemUnreadBackground: string,  // Default: '#f8f9ff'
        itemBorderColor: string,       // Default: '#e2e8f0'
        
        // Badge colors
        badgeBackground: string,       // Default: '#dc3545'
        badgeText: string,             // Default: '#ffffff'
        
        // Primary action color
        primaryColor: string           // Default: '#0078d4'
    },
    
    // Optional - Text labels
    text: {                   // All UI text labels
        messagesHeader: string,
        noUnreadMessages: string,
        // ... see below for full list
    },
    
    // Optional - Icons
    icons: {                  // Bootstrap Icons classes
        inbox: string,
        archive: string,
        reply: string,
        send: string
    },
    
    // Optional - Styles
    styles: {                 // Style customizations
        dropdownMinWidth: string,
        dropdownMaxHeight: string,
        badgeDisplay: string
    },
    
    // Optional - Features
    features: {               // Feature flags
        enableArchive: boolean,
        enableReply: boolean,
        enableExternalLinkWarning: boolean,
        allowHtmlInMessages: boolean
    }
});
```

### Color Customization Example

Match the inbox to your site's branding:

```javascript
PortalInboxExtension.init({
    enabled: true,
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extension',
    colors: {
        // Use your brand colors
        avatarGradientStart: '#ff6b35',    // Orange brand color
        avatarGradientEnd: '#f7931e',
        headerGradientStart: '#ff6b35',
        headerGradientEnd: '#f7931e',
        primaryColor: '#ff6b35',
        badgeBackground: '#e63946',        // Red for urgency
        itemHoverBackground: '#fff5f0',    // Light orange tint
        itemUnreadBackground: '#ffe5d9'    // Slightly darker orange tint
    }
});
```

## Message Data Format

The extension expects JSON in the following format:
```json
{
    "messages": [
        {
            "id": "msg-001",
            "from": "Sender Name",
            "subject": "Message Subject",
            "date": "2025-11-15T10:30:00Z",
            "read": false,
            "body": "Message body content with <a href='https://example.com'>links</a>"
        }
    ]
}
```

### Fields
- `id` (string, required): Unique message identifier
- `from` (string, required): Sender name
- `subject` (string, required): Message subject line
- `date` (string, required): ISO 8601 date format
- `read` (boolean, required): Whether the message has been read
- `body` (string, optional): Message body content (can contain HTML links if `allowHtmlInMessages` is enabled)

## API

### `PortalInboxExtension.init(options)`
Initialize the extension with configuration options.

**Parameters:**
- `options` (object, required): Configuration object
  - `dataSource` (string, required): URL to fetch messages from
  - `containerId` (string, required): ID of the container element
  - `text` (object, optional): UI text customizations
  - `icons` (object, optional): Icon class customizations
  - `styles` (object, optional): Style customizations
  - `features` (object, optional): Feature flags

**Example:**
```javascript
PortalInboxExtension.init({
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extension'
});
```

### `PortalInboxExtension.refresh()`
Manually refresh messages from the data source.

**Example:**
```javascript
PortalInboxExtension.refresh();
```

## HTML Integration Examples

### Minimal Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Inbox Extension</title>
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">My Portal</a>
            
            <!-- Extension Container -->
            <ul class="navbar-nav ms-auto">
                <li class="nav-item" id="portal-inbox-extension"></li>
            </ul>
        </div>
    </nav>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Portal Inbox Extension -->
    <script src="portal-inbox-extension.js"></script>
    
    <!-- Initialize Extension -->
    <script>
        PortalInboxExtension.init({
            dataSource: 'localDataSource.json',
            containerId: 'portal-inbox-extension'
        });
    </script>
</body>
</html>
```

### Customized Example

```html
<script>
    PortalInboxExtension.init({
        // Required
        dataSource: 'localDataSource.json',
        containerId: 'my-custom-inbox',
        
        // Custom text
        text: {
            dropdownToggleIcon: 'bi bi-chat-dots-fill',
            messagesHeader: 'My Notifications',
            noUnreadMessages: 'You\'re all caught up! 🎉',
            newBadge: '!',
            replyButton: 'Respond'
        },
        
        // Custom icons
        icons: {
            inbox: 'bi bi-envelope',
            archive: 'bi bi-folder',
            reply: 'bi bi-arrow-return-left'
        },
        
        // Custom styles
        styles: {
            dropdownMinWidth: '450px',
            dropdownMaxHeight: '500px'
        },
        
        // Feature flags
        features: {
            enableArchive: true,
            enableReply: false
        }
    });
    
    // Event listener
    document.addEventListener('portalInboxMessageClick', function(e) {
        console.log('Message clicked:', e.detail.message);
    });
</script>
```

## Configuration Examples

### Read-Only Display (No Reply, No Archive)

```javascript
PortalInboxExtension.init({
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extension',
    features: {
        enableArchive: false,
        enableReply: false
    }
});
```

### Custom Styling

```javascript
PortalInboxExtension.init({
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extension',
    styles: {
        dropdownMinWidth: '500px',
        dropdownMaxHeight: '600px'
    }
});
```

### Spanish Localization

```javascript
PortalInboxExtension.init({
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extension',
    text: {
        messagesHeader: 'Mensajes',
        archivedHeader: 'Mensajes Archivados',
        unreadLabel: 'no leídos',
        noUnreadMessages: 'No hay mensajes sin leer',
        viewArchived: 'Ver Mensajes Archivados',
        viewUnread: 'Ver Mensajes No Leídos',
        replyButton: 'Responder',
        sendReplyButton: 'Enviar Respuesta',
        cancelButton: 'Cancelar',
        newBadge: 'Nuevo'
    }
});
```

### Custom Icons

```javascript
PortalInboxExtension.init({
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extension',
    text: {
        dropdownToggleIcon: 'bi bi-chat-dots-fill'
    },
    icons: {
        inbox: 'bi bi-envelope',
        archive: 'bi bi-folder',
        reply: 'bi bi-arrow-return-left',
        send: 'bi bi-cursor-fill'
    }
});
```

## Events

### `portalInboxMessageClick`
Fired when a user clicks on a message.

```javascript
document.addEventListener('portalInboxMessageClick', function(e) {
    console.log('Message ID:', e.detail.messageId);
    console.log('Message Object:', e.detail.message);
});
```

### `portalInboxReplySent`
Fired when a user sends a reply (if reply feature is enabled).

```javascript
document.addEventListener('portalInboxReplySent', function(e) {
    console.log('Original Message:', e.detail.originalMessage);
    console.log('Reply Text:', e.detail.replyText);
    console.log('Timestamp:', e.detail.timestamp);
    
    // Send to server
    fetch('/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(e.detail)
    });
});
```

## Integration with Dataverse Web API

To integrate with Power Pages Dataverse Web API:

```javascript
PortalInboxExtension.init({
    dataSource: '/_api/your_entity_name?$filter=_recipient_value eq ' + userId,
    containerId: 'portal-inbox-extension'
});
```

You may need to transform the Dataverse response to match the expected JSON format.

## Complete Text Configuration Reference

All customizable text labels with their defaults:

```javascript
text: {
    // Dropdown
    dropdownToggleIcon: 'bi bi-envelope-fill',
    messagesHeader: 'Messages',
    archivedHeader: 'Archived Messages',
    unreadLabel: 'unread',
    noUnreadMessages: 'No unread messages',
    noArchivedMessages: 'No archived messages',
    viewArchived: 'View Archived Messages',
    viewUnread: 'View Unread Messages',
    loadingMessages: 'Loading messages...',
    failedToLoad: 'Failed to load messages',
    
    // Modal
    modalTitle: 'Message',
    closeButton: 'Close',
    replyButton: 'Reply',
    sendReplyButton: 'Send Reply',
    cancelButton: 'Cancel',
    replyPlaceholder: 'Type your reply here...',
    replyLabel: 'Your Reply:',
    originalMessageLabel: 'Original Message:',
    toLabel: 'To: You',
    newBadge: 'New',
    
    // Time formatting
    justNow: 'Just now',
    minuteAgo: 'minute ago',
    minutesAgo: 'minutes ago',
    hourAgo: 'hour ago',
    hoursAgo: 'hours ago',
    dayAgo: 'day ago',
    daysAgo: 'days ago',
    
    // Prompts
    replyPrompt: 'Please enter a reply message.',
    confirmSend: 'Are you sure you want to send this reply?',
    replySent: 'Reply sent successfully!',
    externalLinkWarning: 'You are about to leave this website...'
}
```

## Browser Support

Works in all modern browsers that support:
- ES6 (ES2015)
- Fetch API
- Custom Events
- Bootstrap 5

## User Interface Components

### Bootstrap 5 Modals
The extension uses **Bootstrap 5 modals exclusively** for all dialogs and confirmations. No native browser `alert()` or `confirm()` dialogs are used, ensuring:
- Consistent branding and styling
- Better user experience
- Full customization control
- Accessibility compliance
- Mobile-friendly interactions

**Modal Types Used:**
1. **Message Detail Modal** - Displays full message content with reply options
2. **Confirmation Modal** - Used for confirming actions (e.g., sending replies, external link warnings)
3. **Alert Modal** - Used for informational messages (e.g., validation errors, success messages)

All modals are dynamically created and managed by the extension with proper cleanup and event handling.

## Files

- `portal-inbox-extension.js` - Main extension JavaScript file (static, no config)
- `localDataSource.json` - Sample JSON data file
- `README.md` - This file

**Demo:** See `portal-demo.html` in the solution root for a full demonstration.

## Important Notes

⚠️ **The extension does NOT auto-initialize!** You must call `init()` with configuration.

✅ **The .js file is completely static** - all configuration is passed during initialization.

✅ **Required parameters**: `dataSource` and `containerId` must be provided.

## Demo

See `portal-demo.html` in the solution root for a complete demonstration of all features and configuration options.
