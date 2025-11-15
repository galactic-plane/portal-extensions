# Portal Inbox Extention

A self-contained, namespace-isolated JavaScript extention for displaying inbox messages in Power Pages portals. Built with Bootstrap 5 and designed to work without conflicts with other JavaScript on the page.

## Features

- **Isolated Namespace**: Runs in its own IIFE (Immediately Invoked Function Expression) to prevent global scope pollution
- **Bootstrap 5 Compatible**: Uses Bootstrap 5 components and styling
- **Modular Design**: Self-contained with all functionality encapsulated
- **Easy Integration**: Simply include the script and add a container element
- **No Conflicts**: Won't interfere with other JavaScript running on the page
- **JSON Data Source**: Loads messages from JSON (easily replaceable with Dataverse Web API)
- **Read/Unread Tracking**: Tracks and displays unread message counts
- **Custom Events**: Fires events for external integration and custom handling
- **Responsive**: Works on all screen sizes with Bootstrap's responsive utilities

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

That's it! The extention will automatically initialize and load messages from `messages.json`.

## Configuration

### Default Configuration
## Configuration

The extention auto-initializes with these defaults:

```javascript
{
    containerId: 'portal-inbox-extention',

### Custom Configuration
To customize the extention, set `autoInit: false` and manually initialize:
```javascript
PortalInboxExtention.init({
    dataSource: 'https://your-api-endpoint.com/messages',
    containerId: 'custom-container-id',
    autoInit: false
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
            "body": "Message body content"
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
- `body` (string, optional): Message body content

## API Methods

### `PortalInboxWidget.init(options)`
Initialize the widget with custom options.
```javascript
## API

### `PortalInboxExtention.init(options)`
Initialize the extention with custom options.

```javascript
PortalInboxExtention.init({
    messagesUrl: '/api/messages',
    containerId: 'my-extention-container'
```

### `PortalInboxWidget.refresh()`
Manually reload messages from the data source.
```javascript
PortalInboxWidget.refresh();
```

## Events

### `portalInboxMessageClick`
Fired when a user clicks on a message.
```javascript
document.addEventListener('portalInboxMessageClick', function(e) {
    console.log('Message ID:', e.detail.messageId);
    console.log('Message Object:', e.detail.message);
    // Handle message click (e.g., open modal, navigate to detail page)
});
```

## Integration with Dataverse Web API

To integrate with Power Pages Dataverse Web API, update the `dataSource` configuration:

```javascript
PortalInboxWidget.init({
    dataSource: '/_api/your_entity_name?$filter=_recipient_value eq ' + userId + ' and statuscode eq 1',
    containerId: 'portal-inbox-widget'
});
```

You may need to transform the Dataverse response to match the expected JSON format.

## Browser Support

Works in all modern browsers that support:
- ES6 (ES2015)
- Fetch API
- Custom Events
- Bootstrap 5

## Files

- `portal-inbox-widget.js` - Main widget JavaScript file
- `messages.json` - Sample JSON data file
- `index.html` - Demo page showing widget integration
- `README.md` - This file

## License

MIT License - Feel free to use in your projects

## Demo

Open `index.html` in a web browser to see the widget in action. The demo shows:
- Widget integration in a Bootstrap navbar
- Unread message badge
- Dropdown message list
- Message read/unread functionality
- Integration examples and documentation
