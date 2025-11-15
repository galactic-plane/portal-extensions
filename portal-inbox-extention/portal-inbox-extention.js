/**
 * Portal Inbox Extention
 * A self-contained, namespaced extention for displaying inbox messages
 * Compatible with Bootstrap 5
 */
(function() {
    'use strict';
    
    // Create isolated namespace
    const PortalInboxExtention = {
        config: {
            // Data source configuration
            dataSource: null,
            
            // Container configuration
            containerId: null,
            
            // UI Text configuration
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
            
            // Icon configuration
            icons: {
                inbox: 'bi bi-inbox-fill',
                archive: 'bi bi-archive-fill',
                reply: 'bi bi-reply-fill',
                send: 'bi bi-send-fill'
            },
            
            // Style configuration
            styles: {
                dropdownMinWidth: '350px',
                dropdownMaxHeight: '400px',
                badgeDisplay: 'inline-block'
            },
            
            // Feature flags
            features: {
                enableArchive: true,
                enableReply: true,
                enableExternalLinkWarning: true,
                allowHtmlInMessages: true
            },
            
            // Auto-init flag
            autoInit: false
        },
        
        state: {
            messages: [],
            unreadCount: 0,
            showArchived: false,
            replyMode: false,
            currentMessage: null
        },
        
        /**
         * Initialize the extention
         */
        init: function(options) {
            // Validate required options
            if (!options) {
                console.error('Portal Inbox Extension: Configuration object is required');
                return;
            }
            
            if (!options.dataSource) {
                console.error('Portal Inbox Extension: dataSource is required in configuration');
                return;
            }
            
            if (!options.containerId) {
                console.error('Portal Inbox Extension: containerId is required in configuration');
                return;
            }
            
            // Deep merge user options with defaults
            this.mergeConfig(this.config, options);
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        },
        
        /**
         * Deep merge configuration
         */
        mergeConfig: function(target, source) {
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                        target[key] = target[key] || {};
                        this.mergeConfig(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
        },
        
        /**
         * Setup the widget
         */
        setup: function() {
            this.injectStyles();
            this.createWidget();
            this.loadMessages();
        },
        
        /**
         * Inject CSS styles for the extension
         */
        injectStyles: function() {
            // Check if styles already injected
            if (document.getElementById('portal-inbox-extension-styles')) {
                return;
            }
            
            const styleElement = document.createElement('style');
            styleElement.id = 'portal-inbox-extension-styles';
            styleElement.textContent = `
                /* Portal Inbox Extension Styles */
                .message-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.875rem;
                    flex-shrink: 0;
                    margin-right: 0.75rem;
                }
                
                .message-from {
                    color: #1e293b;
                    font-weight: 600;
                    font-size: 0.95rem;
                }
                
                .message-subject {
                    color: #64748b;
                    font-size: 0.875rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .message-time {
                    color: #94a3b8;
                    font-size: 0.75rem;
                }
                
                #portal-inbox-badge {
                    font-size: 0.65rem;
                    padding: 0.25em 0.5em;
                    font-weight: 600;
                }
                
                .dropdown-menu {
                    border: none;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    padding: 0;
                    overflow: hidden;
                    margin-top: 0.5rem !important;
                }
                
                .dropdown-header {
                    background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
                    color: white;
                    font-weight: 700;
                    font-size: 1rem;
                    padding: 16px 20px;
                    margin: 0;
                    border-radius: 0;
                }
                
                .dropdown-divider {
                    margin: 0;
                    border-color: #e2e8f0;
                }
                
                .dropdown-item {
                    padding: 16px 20px;
                    transition: background-color 0.15s;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .dropdown-item:last-child {
                    border-bottom: none;
                }
                
                .dropdown-item:hover {
                    background-color: #f1f5f9;
                }
                
                .dropdown-item.fw-bold {
                    background-color: #f8f9ff;
                }
            `;
            
            document.head.appendChild(styleElement);
        },
        
        /**
         * Create the widget HTML structure
         */
        createWidget: function() {
            const container = document.getElementById(this.config.containerId);
            if (!container) {
                console.error('Portal Inbox Widget: Container element not found');
                return;
            }
            
            const widgetHTML = `
                <div class="dropdown">
                    <a class="nav-link dropdown-toggle position-relative" href="#" id="portalInboxDropdown" 
                       role="button" data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer;">
                        <i class="${this.config.text.dropdownToggleIcon}"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                              id="portal-inbox-badge" style="display: none; pointer-events: none;">
                            0
                        </span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="portalInboxDropdown" 
                        id="portal-inbox-messages" style="min-width: ${this.config.styles.dropdownMinWidth}; max-height: ${this.config.styles.dropdownMaxHeight}; overflow-y: auto;">
                        <li><h6 class="dropdown-header">${this.config.text.loadingMessages}</h6></li>
                    </ul>
                </div>
            `;
            
            container.innerHTML = widgetHTML;
            
            // Create the message modal
            this.createMessageModal();
        },
        
        /**
         * Create the message detail modal
         */
        createMessageModal: function() {
            // Check if modal already exists
            if (document.getElementById('portalMessageModal')) {
                return;
            }
            
            const modalHTML = `
                <div class="modal fade" id="portalMessageModal" tabindex="-1" aria-labelledby="portalMessageModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="portalMessageModalLabel">${this.config.text.modalTitle}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body" id="portalMessageBody">
                                <!-- Message content will be inserted here -->
                            </div>
                            <div class="modal-footer" id="portalMessageFooter">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${this.config.text.closeButton}</button>
                                ${this.config.features.enableReply ? `<button type="button" class="btn btn-primary" id="portalReplyBtn">
                                    <i class="${this.config.icons.reply} me-2"></i>${this.config.text.replyButton}
                                </button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add reply button event listener if feature is enabled
            if (this.config.features.enableReply) {
                document.getElementById('portalReplyBtn').addEventListener('click', () => {
                    this.toggleReplyMode();
                });
            }
        },
        
        /**
         * Load messages from data source
         */
        loadMessages: function() {
            fetch(this.config.dataSource)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load messages');
                    }
                    return response.json();
                })
                .then(data => {
                    this.state.messages = data.messages || [];
                    this.processMessages();
                    this.renderMessages();
                })
                .catch(error => {
                    console.error('Portal Inbox Widget Error:', error);
                    this.renderError();
                });
        },
        
        /**
         * Process messages to calculate unread count
         */
        processMessages: function() {
            this.state.unreadCount = this.state.messages.filter(msg => !msg.read).length;
        },
        
        /**
         * Render messages in the dropdown
         */
        renderMessages: function() {
            const messagesContainer = document.getElementById('portal-inbox-messages');
            const badge = document.getElementById('portal-inbox-badge');
            
            // Update badge
            if (this.state.unreadCount > 0) {
                badge.textContent = this.state.unreadCount;
                badge.style.display = this.config.styles.badgeDisplay;
            } else {
                badge.style.display = 'none';
            }
            
            // Clear existing messages
            messagesContainer.innerHTML = '';
            
            // Filter messages based on view mode
            const filteredMessages = this.state.showArchived 
                ? this.state.messages.filter(msg => msg.read)
                : this.state.messages.filter(msg => !msg.read);
            
            // Add header
            const header = document.createElement('li');
            const headerText = this.state.showArchived 
                ? `${this.config.text.archivedHeader} (${filteredMessages.length})`
                : `${this.config.text.messagesHeader} (${this.state.unreadCount} ${this.config.text.unreadLabel})`;
            header.innerHTML = `<h6 class="dropdown-header">${headerText}</h6>`;
            messagesContainer.appendChild(header);
            
            // Add divider
            const divider = document.createElement('li');
            divider.innerHTML = '<hr class="dropdown-divider">';
            messagesContainer.appendChild(divider);
            
            // Render messages
            if (filteredMessages.length === 0) {
                const emptyItem = document.createElement('li');
                const emptyText = this.state.showArchived 
                    ? this.config.text.noArchivedMessages
                    : this.config.text.noUnreadMessages;
                emptyItem.innerHTML = `<span class="dropdown-item-text text-muted text-center py-3">${emptyText}</span>`;
                messagesContainer.appendChild(emptyItem);
            } else {
                filteredMessages.forEach((message, index) => {
                    const messageItem = this.createMessageItem(message, index);
                    messagesContainer.appendChild(messageItem);
                });
            }
            
            // Add archive toggle if enabled
            if (this.config.features.enableArchive) {
                // Add divider before toggle
                const bottomDivider = document.createElement('li');
                bottomDivider.innerHTML = '<hr class="dropdown-divider">';
                messagesContainer.appendChild(bottomDivider);
                
                // Add toggle view button
                const toggleItem = document.createElement('li');
                const toggleText = this.state.showArchived 
                    ? `<i class="${this.config.icons.inbox} me-2"></i>${this.config.text.viewUnread}`
                    : `<i class="${this.config.icons.archive} me-2"></i>${this.config.text.viewArchived}`;
                toggleItem.innerHTML = `
                    <a class="dropdown-item text-center fw-bold" href="#" id="portal-toggle-view" style="color: var(--primary-color);">
                        ${toggleText}
                    </a>
                `;
                messagesContainer.appendChild(toggleItem);
                
                // Add toggle click handler
                const toggleLink = document.getElementById('portal-toggle-view');
                toggleLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent dropdown from closing
                    this.toggleView();
                });
            }
        },
        
        /**
         * Toggle between unread and archived view
         */
        toggleView: function() {
            this.state.showArchived = !this.state.showArchived;
            this.renderMessages();
        },
        
        /**
         * Create a message item element
         */
        createMessageItem: function(message, index) {
            const li = document.createElement('li');
            const unreadClass = !message.read ? 'fw-bold' : '';
            const unreadBadge = !message.read ? `<span class="badge bg-primary rounded-pill">${this.config.text.newBadge}</span>` : '';
            const initials = this.getInitials(message.from);
            
            li.innerHTML = `
                <a class="dropdown-item ${unreadClass}" href="#" data-message-id="${message.id}">
                    <div class="d-flex align-items-start">
                        <div class="message-avatar">${initials}</div>
                        <div class="flex-grow-1" style="min-width: 0;">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="message-from">${this.escapeHtml(message.from)}</span>
                                ${unreadBadge}
                            </div>
                            <div class="message-subject text-truncate mb-1" style="max-width: 100%;">
                                ${this.escapeHtml(message.subject)}
                            </div>
                            <small class="message-time">${this.formatDate(message.date)}</small>
                        </div>
                    </div>
                </a>
            `;
            
            // Add click handler
            const link = li.querySelector('a');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleMessageClick(message.id);
            });
            
            return li;
        },
        
        /**
         * Get initials from name
         */
        getInitials: function(name) {
            const parts = name.trim().split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        },
        
        /**
         * Handle message click
         */
        handleMessageClick: function(messageId) {
            const message = this.state.messages.find(msg => msg.id === messageId);
            if (!message) return;
            
            // Mark as read
            if (!message.read) {
                message.read = true;
                this.processMessages();
                this.renderMessages();
            }
            
            // Show message in modal
            this.showMessageModal(message);
            
            // Trigger custom event for external handling
            const event = new CustomEvent('portalInboxMessageClick', {
                detail: { messageId: messageId, message: message }
            });
            document.dispatchEvent(event);
        },
        
        /**
         * Show message in modal
         */
        showMessageModal: function(message) {
            const modalBody = document.getElementById('portalMessageBody');
            const modalTitle = document.getElementById('portalMessageModalLabel');
            const footer = document.getElementById('portalMessageFooter');
            
            modalTitle.textContent = this.escapeHtml(message.subject);
            
            const messageContent = this.config.features.allowHtmlInMessages 
                ? this.sanitizeHtmlForLinks(message.body)
                : this.escapeHtml(message.body);
            
            const messageHTML = `
                <div id="portalMessageContent">
                    <div class="message-header mb-4">
                        <div class="d-flex align-items-start mb-3">
                            <div class="message-avatar me-3" style="width: 50px; height: 50px; font-size: 1.2rem;">
                                ${this.getInitials(message.from)}
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1 fw-bold">${this.escapeHtml(message.from)}</h6>
                                <small class="text-muted">${this.config.text.toLabel}</small>
                            </div>
                            <small class="text-muted">${this.formatDate(message.date)}</small>
                        </div>
                    </div>
                    <div class="message-body">
                        <p>${messageContent}</p>
                    </div>
                </div>
            `;
            
            modalBody.innerHTML = messageHTML;
            
            // Add link click handlers for external domain warnings if enabled
            if (this.config.features.enableExternalLinkWarning && this.config.features.allowHtmlInMessages) {
                const links = modalBody.querySelectorAll('a[data-portal-link]');
                links.forEach(link => {
                    link.addEventListener('click', (e) => this.handleLinkClick(e));
                });
            }
            
            // Reset footer to default state
            footer.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${this.config.text.closeButton}</button>
                ${this.config.features.enableReply ? `<button type="button" class="btn btn-primary" id="portalReplyBtn">
                    <i class="${this.config.icons.reply} me-2"></i>${this.config.text.replyButton}
                </button>` : ''}
            `;
            
            // Re-attach reply button event listener if feature is enabled
            if (this.config.features.enableReply) {
                document.getElementById('portalReplyBtn').addEventListener('click', () => {
                    this.toggleReplyMode();
                });
            }
            
            // Reset reply mode
            this.state.replyMode = false;
            
            // Store current message
            this.state.currentMessage = message;
            
            // Show modal
            const modalElement = document.getElementById('portalMessageModal');
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modal.show();
        },
        
        /**
         * Toggle reply mode
         */
        toggleReplyMode: function() {
            if (this.state.replyMode) {
                // Cancel reply
                this.showMessageModal(this.state.currentMessage);
            } else {
                // Enable reply mode
                this.state.replyMode = true;
                const message = this.state.currentMessage;
                const modalBody = document.getElementById('portalMessageBody');
                const replyBtn = document.getElementById('portalReplyBtn');
                const footer = document.getElementById('portalMessageFooter');
                
                const messageContent = this.config.features.allowHtmlInMessages 
                    ? this.sanitizeHtmlForLinks(message.body)
                    : this.escapeHtml(message.body);
                
                const replyHTML = `
                    <div id="portalReplySection">
                        <div class="reply-compose mb-3">
                            <label class="form-label fw-bold">${this.config.text.replyLabel}</label>
                            <textarea class="form-control" id="portalReplyText" rows="6" 
                                      placeholder="${this.config.text.replyPlaceholder}"></textarea>
                        </div>
                        <hr class="my-4">
                        <div class="text-muted mb-2">
                            <small><strong>${this.config.text.originalMessageLabel}</strong></small>
                        </div>
                    </div>
                    <div id="portalMessageContent">
                        <div class="message-header mb-4 opacity-75">
                            <div class="d-flex align-items-start mb-3">
                                <div class="message-avatar me-3" style="width: 50px; height: 50px; font-size: 1.2rem;">
                                    ${this.getInitials(message.from)}
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-1 fw-bold">${this.escapeHtml(message.from)}</h6>
                                    <small class="text-muted">${this.config.text.toLabel}</small>
                                </div>
                                <small class="text-muted">${this.formatDate(message.date)}</small>
                        </div>
                    </div>
                    <div class="message-body opacity-75">
                        <p>${messageContent}</p>
                    </div>
                </div>
            `;
            
            modalBody.innerHTML = replyHTML;
            
            // Add link click handlers for external domain warnings in reply mode if enabled
            if (this.config.features.enableExternalLinkWarning && this.config.features.allowHtmlInMessages) {
                const links = modalBody.querySelectorAll('a[data-portal-link]');
                links.forEach(link => {
                    link.addEventListener('click', (e) => this.handleLinkClick(e));
                });
            }
            
            // Update footer buttons
            footer.innerHTML = `
                    <button type="button" class="btn btn-secondary" id="portalCancelReplyBtn">${this.config.text.cancelButton}</button>
                    <button type="button" class="btn btn-primary" id="portalSendReplyBtn">
                        <i class="${this.config.icons.send} me-2"></i>${this.config.text.sendReplyButton}
                    </button>
                `;
                
                // Add event listeners
                document.getElementById('portalCancelReplyBtn').addEventListener('click', () => {
                    this.toggleReplyMode();
                });
                
                document.getElementById('portalSendReplyBtn').addEventListener('click', () => {
                    this.sendReply();
                });
                
                // Focus on textarea
                setTimeout(() => {
                    document.getElementById('portalReplyText').focus();
                }, 100);
            }
        },
        
        /**
         * Send reply
         */
        sendReply: function() {
            const replyText = document.getElementById('portalReplyText').value.trim();
            
            if (!replyText) {
                alert(this.config.text.replyPrompt);
                return;
            }
            
            // Confirm send
            if (confirm(this.config.text.confirmSend)) {
                // In a real implementation, this would make an API call
                console.log('Sending reply:', {
                    originalMessage: this.state.currentMessage,
                    replyText: replyText,
                    timestamp: new Date().toISOString()
                });
                
                // Trigger custom event for external handling
                const event = new CustomEvent('portalInboxReplySent', {
                    detail: {
                        originalMessage: this.state.currentMessage,
                        replyText: replyText,
                        timestamp: new Date().toISOString()
                    }
                });
                document.dispatchEvent(event);
                
                // Close modal properly
                const modalElement = document.getElementById('portalMessageModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
                
                // Reset state
                this.state.replyMode = false;
                this.state.currentMessage = null;
                
                // Show success message after modal closes
                const successMessage = this.config.text.replySent;
                modalElement.addEventListener('hidden.bs.modal', function successHandler() {
                    alert(successMessage);
                    // Remove this event listener after it fires once
                    modalElement.removeEventListener('hidden.bs.modal', successHandler);
                }, { once: true });
            }
        },
        
        /**
         * Render error state
         */
        renderError: function() {
            const messagesContainer = document.getElementById('portal-inbox-messages');
            messagesContainer.innerHTML = `
                <li><span class="dropdown-item-text text-danger">${this.config.text.failedToLoad}</span></li>
            `;
        },
        
        /**
         * Format date string
         */
        formatDate: function(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return this.config.text.justNow;
            if (diffMins === 1) return `1 ${this.config.text.minuteAgo}`;
            if (diffMins < 60) return `${diffMins} ${this.config.text.minutesAgo}`;
            if (diffHours === 1) return `1 ${this.config.text.hourAgo}`;
            if (diffHours < 24) return `${diffHours} ${this.config.text.hoursAgo}`;
            if (diffDays === 1) return `1 ${this.config.text.dayAgo}`;
            if (diffDays < 7) return `${diffDays} ${this.config.text.daysAgo}`;
            
            return date.toLocaleDateString();
        },
        
        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        /**
         * Sanitize HTML to allow only links
         * Strips all HTML except <a> tags with href attributes
         */
        sanitizeHtmlForLinks: function(html) {
            // Create a temporary div to parse HTML
            const temp = document.createElement('div');
            temp.innerHTML = html;
            
            // Get all elements
            const allElements = temp.querySelectorAll('*');
            
            // Remove all elements except <a> tags
            allElements.forEach(el => {
                if (el.tagName.toLowerCase() !== 'a') {
                    // Replace non-anchor tags with their text content
                    const text = document.createTextNode(el.textContent);
                    el.parentNode.replaceChild(text, el);
                }
            });
            
            // Get all remaining anchor tags and sanitize them
            const links = temp.querySelectorAll('a');
            links.forEach(link => {
                // Only keep href and target attributes
                const href = link.getAttribute('href');
                const target = link.getAttribute('target');
                const text = link.textContent;
                
                // Remove all attributes
                while (link.attributes.length > 0) {
                    link.removeAttribute(link.attributes[0].name);
                }
                
                // Re-add only safe attributes
                if (href) {
                    link.setAttribute('href', href);
                }
                if (target) {
                    link.setAttribute('target', target);
                } else {
                    // Default to opening in new tab for safety
                    link.setAttribute('target', '_blank');
                }
                // Add rel for security
                link.setAttribute('rel', 'noopener noreferrer');
                
                // Add data attribute to mark for external link handling
                link.setAttribute('data-portal-link', 'true');
            });
            
            return temp.innerHTML;
        },
        
        /**
         * Check if a URL is external (different domain)
         */
        isExternalLink: function(url) {
            try {
                const linkUrl = new URL(url, window.location.href);
                const currentUrl = new URL(window.location.href);
                return linkUrl.hostname !== currentUrl.hostname;
            } catch (e) {
                // If URL parsing fails, treat as external for safety
                return true;
            }
        },
        
        /**
         * Handle link clicks with external domain warnings
         */
        handleLinkClick: function(event) {
            const link = event.target.closest('a[data-portal-link]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href) return;
            
            // Check if link is external
            if (this.isExternalLink(href)) {
                event.preventDefault();
                
                // Show government-style warning
                const domain = new URL(href, window.location.href).hostname;
                const message = this.config.text.externalLinkWarning.replace('{domain}', domain);
                
                if (confirm(message)) {
                    window.open(href, link.getAttribute('target') || '_blank', 'noopener,noreferrer');
                }
            }
        },
        
        /**
         * Public API for manual refresh
         */
        refresh: function() {
            this.loadMessages();
        }
    };
    
    // Expose extention to global scope
    window.PortalInboxExtention = PortalInboxExtention;
    
})();
