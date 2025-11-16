# Portal Inbox Extention

A completely self-contained, namespace-isolated JavaScript extention for displaying inbox messages in Power Pages portals. Built with Bootstrap 5 and designed to work without conflicts with other JavaScript on the page.

## Features

- **Environment Detection**: Automatically detects local vs portal environment
- **Dual Data Sources**: Uses local JSON for development, Power Pages Web API for production
- **Completely Isolated**: Runs in its own IIFE (Immediately Invoked Function Expression) to prevent global scope pollution
- **Self-Contained Styling**: Injects its own CSS styles - no external stylesheets required
- **Zero Dependencies on Host Page**: Only requires Bootstrap 5 JavaScript and Icons
- **Bootstrap 5 Compatible**: Uses Bootstrap 5 components and styling
- **Bootstrap 5 Modals**: Uses Bootstrap modals for all confirmations, alerts, and dialogs (no native popups)
- **Fully Customizable Colors**: All colors configurable to match your site branding - no hardcoded colors
- **Modular Design**: All functionality, styles, and dependencies encapsulated in the extension file
- **Easy Integration**: Simply include the script and add a container element
- **No Conflicts**: Won't interfere with other JavaScript or CSS on the page
- **Power Pages Web API**: Full CRUD operations via OData protocol in production
- **Read/Unread Tracking**: Tracks and displays unread message counts (persisted to Dataverse)
- **Custom Events**: Fires events for external integration and custom handling
- **Responsive**: Works on all screen sizes with Bootstrap's responsive utilities
- **Fully Configurable**: All text, icons, styles, and features can be customized via configuration
- **Localization Ready**: Easy to translate to any language
- **Static Extension File**: All dynamic configuration is in the initialization, keeping the .js file static

## Architecture

This extension follows a strict isolation pattern:
- **Injects its own CSS** on initialization (no external stylesheets needed)
- **Self-contained namespace** using IIFE pattern
- **No global variables** except the extension namespace (`PortalInboxExtention`)
- **No host page pollution** - all styles and scripts are contained
- **Smart environment detection** - uses hostname and protocol to determine local vs portal
- **Automatic data source switching** - JSON files locally, Web API in production

## Quick Start

1. Include Bootstrap 5 and Bootstrap Icons in your HTML:
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
```

2. Add the extention container in your navbar:
```html
<ul class="navbar-nav ms-auto">
    <li class="nav-item" id="portal-inbox-extention"></li>
</ul>
```

3. Include the extention script:
```html
<script src="portal-inbox-extention.js"></script>
```

4. Include Bootstrap 5 JavaScript:
```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
```

5. Initialize the extension with configuration:
```html
<script>
    PortalInboxExtention.init({
        enabled: true,  // Optional: Set to false to disable
        dataSource: 'localDataSource.json',
        containerId: 'portal-inbox-extention'
    });
</script>
```

## Configuration

### Data Source Configuration

The extension supports **two data sources** that automatically switch based on environment:

#### Local Development (JSON File)
```javascript
PortalInboxExtention.init({
    localDataSource: 'localDataSource.json',  // Local JSON file for development
    containerId: 'portal-inbox-extention'
});
```

#### Production (Power Pages Web API)
```javascript
PortalInboxExtention.init({
    localDataSource: 'localDataSource.json',  // Fallback for local testing
    portalDataSource: {
        entitySetName: 'msfed_messages',  // Dataverse table EntitySetName
        baseUrl: '/_api',                 // Web API base URL
        operations: {
            read: {
                enabled: true,
                select: 'msfed_messageid,msfed_subject,msfed_body,msfed_from,msfed_sentdate,msfed_isread',
                filter: '',               // Optional OData filter
                orderBy: 'msfed_sentdate desc',
                expand: ''                // Optional related tables
            },
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
    containerId: 'portal-inbox-extention'
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
PortalInboxExtention.init({
    enabled: true,                      // Optional: Set to false to disable extension (default: true)
    localDataSource: 'localDataSource.json',   // Required: Local JSON file path
    portalDataSource: { ... },          // Optional: Web API config (required for production)
    containerId: 'portal-inbox-extention'  // Required: ID of container element
});
```

### Basic Configuration with Common Customizations

```javascript
PortalInboxExtention.init({
    // Extension control
    enabled: true,                      // Set to false to completely disable this extension
    
    // Required
    dataSource: 'api/messages',
    containerId: 'portal-inbox-extention',
    
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
PortalInboxExtention.init({
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
PortalInboxExtention.init({
    enabled: true,
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extention',
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

The extention expects JSON in the following format:
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

### `PortalInboxExtention.init(options)`
Initialize the extention with configuration options.

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
PortalInboxExtention.init({
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extention'
});
```

### `PortalInboxExtention.refresh()`
Manually refresh messages from the data source.

**Example:**
```javascript
PortalInboxExtention.refresh();
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
                <li class="nav-item" id="portal-inbox-extention"></li>
            </ul>
        </div>
    </nav>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Portal Inbox Extension -->
    <script src="portal-inbox-extention.js"></script>
    
    <!-- Initialize Extension -->
    <script>
        PortalInboxExtention.init({
            dataSource: 'localDataSource.json',
            containerId: 'portal-inbox-extention'
        });
    </script>
</body>
</html>
```

### Customized Example

```html
<script>
    PortalInboxExtention.init({
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
PortalInboxExtention.init({
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extention',
    features: {
        enableArchive: false,
        enableReply: false
    }
});
```

### Custom Styling

```javascript
PortalInboxExtention.init({
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extention',
    styles: {
        dropdownMinWidth: '500px',
        dropdownMaxHeight: '600px'
    }
});
```

### Spanish Localization

```javascript
PortalInboxExtention.init({
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extention',
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
PortalInboxExtention.init({
    dataSource: 'localDataSource.json',
    containerId: 'portal-inbox-extention',
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
PortalInboxExtention.init({
    dataSource: '/_api/your_entity_name?$filter=_recipient_value eq ' + userId,
    containerId: 'portal-inbox-extention'
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

- `portal-inbox-extention.js` - Main extension JavaScript file (static, no config)
- `localDataSource.json` - Sample JSON data file
- `README.md` - This file

**Demo:** See `portal-demo.html` in the solution root for a full demonstration.

## Important Notes

⚠️ **The extension does NOT auto-initialize!** You must call `init()` with configuration.

✅ **The .js file is completely static** - all configuration is passed during initialization.

✅ **Required parameters**: `dataSource` and `containerId` must be provided.

## Demo

See `portal-demo.html` in the solution root for a complete demonstration of all features and configuration options.
