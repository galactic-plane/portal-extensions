/**
 * Portal Inbox Widget
 * A self-contained, namespaced widget for displaying inbox messages
 * Compatible with Bootstrap 5
 */
(function() {
    'use strict';
    
    // Create isolated namespace
    const PortalInboxWidget = {
        config: {
            dataSource: 'messages.json',
            containerId: 'portal-inbox-widget',
            autoInit: true
        },
        
        state: {
            messages: [],
            unreadCount: 0,
            showArchived: false,
            replyMode: false,
            currentMessage: null
        },
        
        /**
         * Initialize the widget
         */
        init: function(options) {
            // Merge user options with defaults
            if (options) {
                Object.assign(this.config, options);
            }
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        },
        
        /**
         * Setup the widget
         */
        setup: function() {
            this.createWidget();
            this.loadMessages();
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
                        <i class="bi bi-envelope-fill"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                              id="portal-inbox-badge" style="display: none; pointer-events: none;">
                            0
                        </span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="portalInboxDropdown" 
                        id="portal-inbox-messages" style="min-width: 350px; max-height: 400px; overflow-y: auto;">
                        <li><h6 class="dropdown-header">Loading messages...</h6></li>
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
                                <h5 class="modal-title" id="portalMessageModalLabel">Message</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body" id="portalMessageBody">
                                <!-- Message content will be inserted here -->
                            </div>
                            <div class="modal-footer" id="portalMessageFooter">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" id="portalReplyBtn">
                                    <i class="bi bi-reply-fill me-2"></i>Reply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add reply button event listener
            document.getElementById('portalReplyBtn').addEventListener('click', () => {
                this.toggleReplyMode();
            });
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
                badge.style.display = 'inline-block';
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
                ? `Archived Messages (${filteredMessages.length})`
                : `Messages (${this.state.unreadCount} unread)`;
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
                    ? 'No archived messages'
                    : 'No unread messages';
                emptyItem.innerHTML = `<span class="dropdown-item-text text-muted text-center py-3">${emptyText}</span>`;
                messagesContainer.appendChild(emptyItem);
            } else {
                filteredMessages.forEach((message, index) => {
                    const messageItem = this.createMessageItem(message, index);
                    messagesContainer.appendChild(messageItem);
                });
            }
            
            // Add divider before toggle
            const bottomDivider = document.createElement('li');
            bottomDivider.innerHTML = '<hr class="dropdown-divider">';
            messagesContainer.appendChild(bottomDivider);
            
            // Add toggle view button
            const toggleItem = document.createElement('li');
            const toggleText = this.state.showArchived 
                ? '<i class="bi bi-inbox-fill me-2"></i>View Unread Messages'
                : '<i class="bi bi-archive-fill me-2"></i>View Archived Messages';
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
            const unreadBadge = !message.read ? '<span class="badge bg-primary rounded-pill">New</span>' : '';
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
            
            const messageHTML = `
                <div id="portalMessageContent">
                    <div class="message-header mb-4">
                        <div class="d-flex align-items-start mb-3">
                            <div class="message-avatar me-3" style="width: 50px; height: 50px; font-size: 1.2rem;">
                                ${this.getInitials(message.from)}
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1 fw-bold">${this.escapeHtml(message.from)}</h6>
                                <small class="text-muted">To: You</small>
                            </div>
                            <small class="text-muted">${this.formatDate(message.date)}</small>
                        </div>
                    </div>
                    <div class="message-body">
                        <p>${this.sanitizeHtmlForLinks(message.body)}</p>
                    </div>
                </div>
            `;
            
            modalBody.innerHTML = messageHTML;
            
            // Add link click handlers for external domain warnings
            const links = modalBody.querySelectorAll('a[data-portal-link]');
            links.forEach(link => {
                link.addEventListener('click', (e) => this.handleLinkClick(e));
            });
            
            // Reset footer to default state
            footer.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="portalReplyBtn">
                    <i class="bi bi-reply-fill me-2"></i>Reply
                </button>
            `;
            
            // Re-attach reply button event listener
            document.getElementById('portalReplyBtn').addEventListener('click', () => {
                this.toggleReplyMode();
            });
            
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
                
                const replyHTML = `
                    <div id="portalReplySection">
                        <div class="reply-compose mb-3">
                            <label class="form-label fw-bold">Your Reply:</label>
                            <textarea class="form-control" id="portalReplyText" rows="6" 
                                      placeholder="Type your reply here..."></textarea>
                        </div>
                        <hr class="my-4">
                        <div class="text-muted mb-2">
                            <small><strong>Original Message:</strong></small>
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
                                    <small class="text-muted">To: You</small>
                                </div>
                                <small class="text-muted">${this.formatDate(message.date)}</small>
                        </div>
                    </div>
                    <div class="message-body opacity-75">
                        <p>${this.sanitizeHtmlForLinks(message.body)}</p>
                    </div>
                </div>
            `;
            
            modalBody.innerHTML = replyHTML;
            
            // Add link click handlers for external domain warnings in reply mode
            const links = modalBody.querySelectorAll('a[data-portal-link]');
            links.forEach(link => {
                link.addEventListener('click', (e) => this.handleLinkClick(e));
            });
            
            // Update footer buttons
            footer.innerHTML = `
                    <button type="button" class="btn btn-secondary" id="portalCancelReplyBtn">Cancel</button>
                    <button type="button" class="btn btn-primary" id="portalSendReplyBtn">
                        <i class="bi bi-send-fill me-2"></i>Send Reply
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
                alert('Please enter a reply message.');
                return;
            }
            
            // Confirm send
            if (confirm('Are you sure you want to send this reply?')) {
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
                modalElement.addEventListener('hidden.bs.modal', function successHandler() {
                    alert('Reply sent successfully!');
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
                <li><span class="dropdown-item-text text-danger">Failed to load messages</span></li>
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
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            
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
                const message = `You are about to leave this website and navigate to an external site.\n\n` +
                              `External Site: ${domain}\n\n` +
                              `This link is being provided for your convenience. We are not responsible for ` +
                              `the content, privacy policies, or practices of external sites.\n\n` +
                              `Do you wish to continue?`;
                
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
    
    // Expose widget to global scope
    window.PortalInboxWidget = PortalInboxWidget;
    
    // Auto-initialize if configured
    if (PortalInboxWidget.config.autoInit) {
        PortalInboxWidget.init();
    }
    
})();
