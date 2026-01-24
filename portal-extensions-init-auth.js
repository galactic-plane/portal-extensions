/**
 * Portal Extensions Initialization (Authentication Required)
 * Initializes all portal extensions that require user authentication
 * 
 * @author Daniel Penrod <daniel.penrod@microsoft.com>
 */

// Injects the inbox extension container element into the navigation bar
function injectInboxContainer() {
    // Navbar weblinks ul element
    const navbarWeblinks = document.querySelector('ul.nav.navbar-nav.weblinks');
    
    if (navbarWeblinks) {
        // New li element with utility-nav class
        const utilityNavItem = document.createElement('li');
        utilityNavItem.className = 'utility-nav';
        
        // Container div for the inbox extension
        const containerDiv = document.createElement('div');
        containerDiv.id = 'portal-inbox-extension';
        containerDiv.style.marginRight = '10px';
        
        // Attach container to list item
        utilityNavItem.appendChild(containerDiv);
        
        // Position before user dropdown (after last divider)
        const dividers = navbarWeblinks.querySelectorAll('li.nav-item.divider-vertical');
        const lastDivider = dividers[dividers.length - 1];
        
        if (lastDivider) {
            // Position after the last divider
            lastDivider.parentNode.insertBefore(utilityNavItem, lastDivider.nextSibling);
        } else {
            // Append to end if no divider exists
            navbarWeblinks.appendChild(utilityNavItem);
        }
        
        window.PortalExtensions.log('Inbox extension container injected into navbar');
    } else {
        window.PortalExtensions.warn('Navbar weblinks not found, could not inject inbox container');
    }
}

// Portal extensions loaded event handler
document.addEventListener('portalExtensionsLoaded', function() {
    window.PortalExtensions.log('All portal extensions loaded successfully');
    
    // Inject container element into DOM
    injectInboxContainer();
    
    // Portal Inbox Extension configuration
    PortalInboxExtension.init({
        // ========================================================================
        // PUBLISHER CONFIGURATION
        // ========================================================================
        publisher: {
            prefix: 'msfed'  // Change to your organization's publisher prefix (e.g., 'usss', 'contoso')
        },
        
        // ========================================================================
        // DATA SOURCE CONFIGURATION
        // ========================================================================
        
        // JSON file for local development and testing
        localDataSource: 'portal-inbox-extension/localDataSource.json',
        
        // Power Pages Web API configuration for portal environment
        portalDataSource: {
            entitySetName: 'adx_portalcomments',
            baseUrl: '/_api',
            fieldMapping: {
                hasread: 'msfed_hasread'  // Override default {prefix}_hasread if needed
            },
            regardingObject: {
                entityName: 'msfed_application',           // Logical name of your custom entity
                entitySetName: 'msfed_applications',        // Entity set name for Web API
                navigationProperty: 'regardingobjectid_msfed_application'  // Navigation property name
            },
            operations: {
                read: {
                    enabled: true,
                    select: 'subject,description,_regardingobjectid_value,statecode,statuscode,activityid,activitytypecode,adx_portalcommentdirectioncode,createdon,_createdby_value,msfed_hasread',  // Fields to retrieve from portal comments (update msfed_hasread to match your fieldMapping)
                    filter: '(adx_portalcommentdirectioncode eq 2)',  // Filter for messages sent to contact from staff (direction = 2). Note: The extension always applies this filter automatically, so this is technically redundant but kept for clarity.
                    orderBy: 'createdon desc',  // Sort by creation date descending
                    expand: 'adx_portalcomment_activity_parties($select=_partyid_value,participationtypemask;$expand=partyid_systemuser($select=fullname,systemuserid);$filter=(participationtypemask eq 1)),adx_portalcomment_activity_parties($select=_partyid_value;$expand=partyid_contact($select=fullname,contactid);$filter=(participationtypemask eq 2))'  // Related sender and recipient entities
                },
                create: {
                    enabled: true  // Enables reply functionality
                },
                update: {
                    enabled: true  // Enables read status tracking
                },
                delete: {
                    enabled: false  // Prevents deletion of messages
                }
            }
        },
        
        // ========================================================================
        // CONTAINER CONFIGURATION
        // ========================================================================
        containerId: 'portal-inbox-extension',
        
        // ========================================================================
        // COLOR CONFIGURATION
        // ========================================================================
        colors: {
            // Circular avatar icon gradient for message senders
            avatarGradientStart: '#0078d4',
            avatarGradientEnd: '#005a9e',
            avatarText: '#ffffff',
            
            // Dropdown header section gradient
            headerGradientStart: '#0078d4',
            headerGradientEnd: '#005a9e',
            headerText: '#ffffff',
            
            // Message list item text colors
            messageFrom: '#1e293b',
            messageSubject: '#64748b',
            messageTime: '#94a3b8',
            
            // Dropdown menu container styling
            dropdownBorder: '#e2e8f0',
            dropdownShadow: 'rgba(0, 0, 0, 0.15)',
            
            // Message list item background states
            itemHoverBackground: '#f1f5f9',
            itemUnreadBackground: '#f8f9ff',
            itemBorderColor: '#e2e8f0',
            
            // Unread count badge styling
            badgeBackground: '#dc3545',
            badgeText: '#ffffff',
            
            // Navbar inbox icon styling
            navLinkColor: '#ffffff',
            navLinkCaretColor: '#ffffff',
            
            // Primary action buttons and interactive elements
            primaryColor: '#0078d4'
        },
        
        // ========================================================================
        // TEXT CONFIGURATION
        // ========================================================================
        text: {
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
            justNow: 'Just now',
            minuteAgo: 'minute ago',
            minutesAgo: 'minutes ago',
            hourAgo: 'hour ago',
            hoursAgo: 'hours ago',
            dayAgo: 'day ago',
            daysAgo: 'days ago',
            replyPrompt: 'Please enter a reply message.',
            confirmSend: 'Are you sure you want to send this reply?',
            replySent: 'Reply sent successfully!',
            externalLinkWarning: 'You are about to leave this website and navigate to an external site.\n\nExternal Site: {domain}\n\nThis link is being provided for your convenience. We are not responsible for the content, privacy policies, or practices of external sites.\n\nDo you wish to continue?'
        },
        
        // ========================================================================
        // ICON CONFIGURATION
        // ========================================================================
        icons: {
            inbox: 'bi bi-inbox-fill',
            archive: 'bi bi-archive-fill',
            reply: 'bi bi-reply-fill',
            send: 'bi bi-send-fill'
        },
        
        // ========================================================================
        // STYLE CONFIGURATION
        // ========================================================================
        styles: {
            dropdownMinWidth: '350px',
            dropdownMaxHeight: '400px',
            badgeDisplay: 'inline-block'
        },
        
        // ========================================================================
        // FEATURE FLAGS
        // ========================================================================
        features: {
            enableArchive: true,
            enableReply: true,
            enableExternalLinkWarning: true,
            allowHtmlInMessages: true
        }
    });
});
