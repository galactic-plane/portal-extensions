# Portal Extensions

This solution contains multiple portal extension projects that enhance and extend portal functionality.

## Extensions

### Portal Inbox Extension
An extention that displays inbox messages within the portal interface using Bootstrap 5 modals for all dialogs.

- **Location:** `portal-inbox-extention/`
- **Description:** Provides an inbox extention for displaying messages with read/unread tracking, reply functionality, and archive features
- **UI Components:** Uses Bootstrap 5 modals exclusively (no native browser popups)
- **Documentation:** [View Extension README](./portal-inbox-extention/README.md)
- **Demo:** See `portal-demo.html` for full demonstration

## Getting Started

Each extension is self-contained within its own directory. Navigate to the specific extension folder and refer to its README for detailed information about that extension.

## Structure

```
portal-extentions/
├── portal-demo.html             # Main demo page for all extensions
├── portal-extensions.js         # Extension loader
├── README.md                    # This file - master documentation
└── portal-inbox-extention/      # Individual extension projects
    ├── README.md                # Extension-specific documentation
    ├── portal-inbox-extention.js
    └── messages.json
```

## Adding New Extensions

To add a new extension to this solution:
1. Create a new folder at the root level
2. Add your extension files
3. Create a README.md specific to that extension
4. Update this master README to list the new extension

## Contributing

When working on extensions, please ensure:
- Each extension has its own README with specific documentation
- Code follows consistent formatting and style
- Changes are committed with clear, descriptive messages

## License

[Add your license information here]
