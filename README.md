# Portal Extensions

This solution contains multiple portal extension projects that enhance and extend portal functionality.

## Extensions

### Portal Inbox Extension
A widget that displays inbox messages within the portal interface.

- **Location:** `portal-inbox-extention/`
- **Description:** Provides an inbox widget for displaying messages
- **Documentation:** [View Extension README](./portal-inbox-extention/README.md)

## Getting Started

Each extension is self-contained within its own directory. Navigate to the specific extension folder and refer to its README for detailed information about that extension.

## Structure

```
portal-extentions/
├── README.md                    # This file - master documentation
└── portal-inbox-extention/      # Individual extension projects
    ├── README.md                # Extension-specific documentation
    ├── index.html
    ├── portal-inbox-widget.js
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
