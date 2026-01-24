/**
 * Portal Inbox Extension
 * A self-contained, namespaced extension for displaying inbox messages
 * Compatible with Bootstrap 5
 *
 * @author Daniel Penrod <daniel.penrod@microsoft.com>
 * @build 20251120.0001
 *
 * Features:
 * - Automatic environment detection (local vs portal)
 * - Local data source: JSON file for development/testing
 * - Portal data source: Power Pages Web API for production
 * - Read/Write operations via OData protocol
 * - CSRF token authentication for Web API
 */
(function () {
  "use strict";

  // ============================================================================
  // DATA NAMESPACE
  // Handles all data operations, API calls, and state management
  // ============================================================================
  const Data = {
    state: {
      messages: [],
      unreadCount: 0,
      showArchived: false,
      replyMode: false,
      currentMessage: null,
      isLoading: false,
      isLoaded: false,
    },

    config: null,

    /**
     * Initialize data namespace with configuration
     */
    init: function (config) {
      this.config = config;
    },

    /**
     * Get configured field name from fieldMapping or return default with publisher prefix
     */
    getFieldName: function (fieldKey) {
      const mapping = this.config.portalDataSource?.fieldMapping || {};
      const prefix = this.config.publisher?.prefix || "msfed";
      return mapping[fieldKey] || `${prefix}_${fieldKey}`;
    },

    /**
     * Get regarding object configuration for reply payloads
     * Returns object with entityName, entitySetName, and navigationProperty
     */
    getRegardingObjectConfig: function () {
      const defaultConfig = this.config.portalDataSource?.regardingObject || {};
      const prefix = this.config.publisher?.prefix || "msfed";

      return {
        entityName: defaultConfig.entityName || `${prefix}_application`,
        entitySetName: defaultConfig.entitySetName || `${prefix}_applications`,
        navigationProperty: defaultConfig.navigationProperty || `regardingobjectid_${prefix}_application`,
      };
    },

    /**
     * Detect if running in local environment
     */
    isLocalEnvironment: function () {
      const hostname = window.location.hostname;
      return (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.endsWith(".local") ||
        window.location.protocol === "file:"
      );
    },

    /**
     * Load messages from appropriate data source
     */
    loadMessages: function () {
      this.state.isLoading = true;
      this.state.isLoaded = false;

      const isLocal = this.isLocalEnvironment();

      if (isLocal && this.config.localDataSource) {
        window.PortalExtensions.log("Portal Inbox Extension: Using local data source");
        this.loadMessagesFromLocal();
      } else if (!isLocal && this.config.portalDataSource) {
        window.PortalExtensions.log("Portal Inbox Extension: Using portal Web API data source");
        this.loadMessagesFromPortal();
      } else if (this.config.localDataSource) {
        window.PortalExtensions.warn("Portal Inbox Extension: Portal data source not configured, falling back to local");
        this.loadMessagesFromLocal();
      } else {
        window.PortalExtensions.error("Portal Inbox Extension: No valid data source configured");
        this.state.isLoading = false;
        this.state.isLoaded = true;
        UI.renderError();
      }
    },

    /**
     * Load messages from local JSON file
     */
    loadMessagesFromLocal: function () {
      setTimeout(() => {
        fetch(this.config.localDataSource)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to load messages from local source");
            }
            return response.json();
          })
          .then((data) => {
            // Supports both legacy (data.messages) and OData (data.value) formats
            const records = data.value || data.messages || [];
            this.state.messages = this.mapPortalDataToMessages(records);
            this.processMessages();
            this.state.isLoading = false;
            this.state.isLoaded = true;
            UI.renderMessages();
          })
          .catch((error) => {
            window.PortalExtensions.error("Portal Inbox Widget Error:", error);
            this.state.isLoading = false;
            this.state.isLoaded = true;
            UI.renderError();
          });
      }, 4000);
    },

    /**
     * Load messages from Power Pages Web API
     */
    loadMessagesFromPortal: async function () {
      try {
        const config = this.config.portalDataSource;
        const readOps = config.operations.read;

        if (!readOps.enabled) {
          throw new Error("Read operations are not enabled");
        }

        const params = new URLSearchParams();

        if (readOps.select) params.append("$select", readOps.select);

        // Build filter - always filter for Outgoing messages (directioncode = 2)
        let filterParts = ["adx_portalcommentdirectioncode eq 2"];
        if (readOps.filter) {
          filterParts.push(`(${readOps.filter})`);
        }
        params.append("$filter", filterParts.join(" and "));

        if (readOps.orderBy) params.append("$orderby", readOps.orderBy);
        if (readOps.expand) params.append("$expand", readOps.expand);

        const url = `${config.baseUrl}/${config.entitySetName}?${params.toString()}`;
        window.PortalExtensions.log("Portal Inbox API Request URL:", url);

        const token = await this.getPortalToken();

        const response = await fetch(url, {
          method: "GET",
          headers: {
            __RequestVerificationToken: token,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        window.PortalExtensions.log("Portal Inbox API Response:", data);
        window.PortalExtensions.log("First record:", data.value?.[0]);

        this.state.messages = this.mapPortalDataToMessages(data.value || []);
        this.processMessages();
        this.state.isLoading = false;
        this.state.isLoaded = true;
        UI.renderMessages();
      } catch (error) {
        window.PortalExtensions.error("Portal Inbox Widget Error:", error);
        this.state.isLoading = false;
        this.state.isLoaded = true;
        UI.renderError();
      }
    },

    /**
     * Get CSRF token for Power Pages Web API authentication
     */
    getPortalToken: function () {
      return new Promise((resolve, reject) => {
        if (typeof shell !== "undefined" && shell.getTokenDeferred) {
          shell
            .getTokenDeferred()
            .done(function (token) {
              resolve(token);
            })
            .fail(function () {
              reject(new Error("Failed to get authentication token"));
            });
        } else {
          const tokenMeta = document.querySelector('meta[name="__RequestVerificationToken"]');
          if (tokenMeta) {
            resolve(tokenMeta.getAttribute("content"));
          } else {
            reject(new Error("Authentication token not available"));
          }
        }
      });
    },

    /**
     * Map Dataverse adx_portalcomments fields to internal message format
     */
    mapPortalDataToMessages: function (records) {
      return records.map((comment) => {
        // Transform Dataverse fields to internal message format
        // Legacy format messages pass through unchanged
        if (comment.from && comment.body && !comment.activityid) {
          return {
            id: comment.id,
            from: comment.from,
            subject: comment.subject || "(No Subject)",
            body: comment.body || "",
            date: comment.date,
            read: comment.read !== undefined ? comment.read : false,
            category: comment.category || "general",
          };
        }

        // Dataverse format - extract sender and recipient
        // From: System user who created the comment (_createdby_value)
        // To: Contact from activity parties (participationtypemask=2)

        if (!comment._createdby_value) {
          window.PortalExtensions.error("Missing _createdby_value for comment:", comment.activityid, comment);
          throw new Error(`Created by value not found for comment ${comment.activityid}. Ensure $select includes _createdby_value.`);
        }

        const parties = comment.adx_portalcomment_activity_parties;
        if (!parties || parties.length === 0) {
          window.PortalExtensions.error("Missing or empty activity parties for comment:", comment.activityid, comment);
          throw new Error(
            `Activity parties not found for comment ${comment.activityid}. Ensure $expand includes adx_portalcomment_activity_parties.`
          );
        }

        const toParty = parties.find((p) => p.participationtypemask === 2 && p.partyid_contact !== null && p.partyid_contact !== undefined);

        if (!toParty) {
          window.PortalExtensions.error("No contact party (participationtypemask=2) found for comment:", comment.activityid, parties);
          throw new Error(
            `Contact party not found for comment ${comment.activityid}. The comment must have a contact party with participationtypemask=2.`
          );
        }

        // Read status priority: server field (configured hasRead field) > localStorage
        let isRead = false;
        const hasReadField = this.getFieldName("hasread");
        if (comment[hasReadField] !== undefined && comment[hasReadField] !== null) {
          // Server-side read status field
          isRead = comment[hasReadField];
        } else {
          // LocalStorage-based timestamp comparison
          const lastChecked = localStorage.getItem("portalInbox_lastCheckedComments");
          const lastCheckedDate = lastChecked ? new Date(lastChecked) : new Date(0);
          const createdDate = new Date(comment.createdon || comment.date || new Date());
          isRead = createdDate <= lastCheckedDate;
        }

        // Message ID fields
        const toContactId = toParty.partyid_contact?.contactid;
        const fromStaffId = comment._createdby_value;

        if (!toContactId) {
          window.PortalExtensions.error("Contact ID missing from party:", toParty);
          throw new Error(`Contact ID not found in party data for comment ${comment.activityid}. Ensure $expand includes partyid_contact.`);
        }

        const fromStaffName = comment["_createdby_value@OData.Community.Display.V1.FormattedValue"];
        if (!fromStaffName) {
          window.PortalExtensions.error("Staff name missing from _createdby_value formatted value:", comment);
          throw new Error(`Staff name not found for comment ${comment.activityid}. Ensure formatted values are included.`);
        }

        return {
          id: comment.activityid,
          from: fromStaffName,
          subject: comment.subject || "(No Subject)",
          body: comment.description || "",
          date: comment.createdon || new Date().toISOString(),
          read: isRead,
          category: "portal-comment",
          // Dataverse metadata fields
          regardingObjectId: comment._regardingobjectid_value,
          toContact: toParty.partyid_contact.fullname,
          toContactId: toContactId,
          fromStaffId: fromStaffId,
          directionCode: comment.adx_portalcommentdirectioncode,
          statecode: comment.statecode,
          statuscode: comment.statuscode,
          hasReadValue: comment[hasReadField],
        };
      });
    },

    /**
     * Update message read status via localStorage
     * For portal comments, we track the last checked time instead of individual read status
     */
    updateMessageReadStatus: async function (messageId, isRead) {
      if (this.isLocalEnvironment() || !this.config.portalDataSource) {
        window.PortalExtensions.log("Local environment: Read status not persisted to server");
        return;
      }

      try {
        // Update localStorage to mark all messages up to this point as read
        const message = this.getMessage(messageId);
        if (message && isRead) {
          const currentLastChecked = localStorage.getItem("portalInbox_lastCheckedComments");
          const currentLastCheckedDate = currentLastChecked ? new Date(currentLastChecked) : new Date(0);
          const messageDate = new Date(message.date);

          // Only update if this message is newer than the last checked time
          if (messageDate > currentLastCheckedDate) {
            localStorage.setItem("portalInbox_lastCheckedComments", messageDate.toISOString());
          }

          // Also update configured hasRead field on the portal comment record
          await this.updatePortalCommentReadStatus(messageId, true);
        }

        window.PortalExtensions.log("Message read status updated in localStorage");
      } catch (error) {
        window.PortalExtensions.error("Failed to update message read status:", error);
      }
    },

    /**
     * Update the configured hasRead field on a portal comment record
     */
    updatePortalCommentReadStatus: async function (messageId, hasRead) {
      try {
        const config = this.config.portalDataSource;
        const updateOps = config.operations.update;

        if (!updateOps || !updateOps.enabled) {
          window.PortalExtensions.log("Update operations are not enabled");
          return;
        }

        const url = `${config.baseUrl}/${config.entitySetName}(${messageId})`;
        const token = await this.getPortalToken();

        const hasReadField = this.getFieldName("hasread");
        const updatePayload = {
          [hasReadField]: hasRead,
          statecode: 1, // Completed state - standard field, no prefix
        };

        const response = await fetch(url, {
          method: "PATCH",
          headers: {
            __RequestVerificationToken: token,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        window.PortalExtensions.log(`Portal comment ${this.getFieldName("hasread")} field updated successfully`);
      } catch (error) {
        window.PortalExtensions.error("Failed to update portal comment read status:", error);
      }
    },

    /**
     * Process messages to calculate unread count and sync localStorage
     */
    processMessages: function () {
      this.state.unreadCount = this.state.messages.filter((msg) => !msg.read).length;

      // Sync localStorage with the most recent read message date from server
      // This ensures localStorage stays in sync with server-side hasRead field values
      const readMessages = this.state.messages.filter((msg) => msg.read && msg.date);
      if (readMessages.length > 0) {
        // Most recent read message timestamp
        const mostRecentRead = readMessages.reduce((latest, msg) => {
          const msgDate = new Date(msg.date);
          const latestDate = new Date(latest.date);
          return msgDate > latestDate ? msg : latest;
        });

        // Update localStorage if this is newer than what's stored
        const currentLastChecked = localStorage.getItem("portalInbox_lastCheckedComments");
        const currentLastCheckedDate = currentLastChecked ? new Date(currentLastChecked) : new Date(0);
        const mostRecentReadDate = new Date(mostRecentRead.date);

        if (mostRecentReadDate > currentLastCheckedDate) {
          localStorage.setItem("portalInbox_lastCheckedComments", mostRecentReadDate.toISOString());
        }
      }
    },

    /**
     * Mark a message as read
     */
    markMessageAsRead: function (messageId) {
      const message = this.state.messages.find((msg) => msg.id === messageId);
      if (!message || message.read) return;

      message.read = true;
      this.updateMessageReadStatus(messageId, true);
      this.processMessages();
    },

    /**
     * Get message by ID
     */
    getMessage: function (messageId) {
      return this.state.messages.find((msg) => msg.id === messageId);
    },

    /**
     * Get filtered messages based on view mode
     */
    getFilteredMessages: function () {
      return this.state.showArchived ? this.state.messages.filter((msg) => msg.read) : this.state.messages.filter((msg) => !msg.read);
    },

    /**
     * Toggle between archived and unread view
     */
    toggleView: function () {
      this.state.showArchived = !this.state.showArchived;
    },

    /**
     * Create a reply to a portal comment
     * This will create a new adx_portalcomment with direction code = 1 (outgoing from contact)
     */
    createReply: async function (messageId, replyText) {
      if (this.isLocalEnvironment() || !this.config.portalDataSource) {
        window.PortalExtensions.log("Local environment: Reply not sent to server");
        return { success: false, message: "Local environment - reply not persisted" };
      }

      try {
        const config = this.config.portalDataSource;
        const createOps = config.operations.create;

        if (!createOps.enabled) {
          throw new Error("Create operations are not enabled");
        }

        const originalMessage = this.getMessage(messageId);
        if (!originalMessage) {
          throw new Error("Original message not found");
        }

        // No fallback - these must exist or fail
        if (!originalMessage.toContactId) {
          window.PortalExtensions.error("Original message:", originalMessage);
          throw new Error("Contact ID not found in original message. API configuration error - check $expand parameter.");
        }
        if (!originalMessage.fromStaffId) {
          window.PortalExtensions.error("Original message:", originalMessage);
          throw new Error("Staff ID not found in original message. API configuration error - check _createdby_value.");
        }

        window.PortalExtensions.log("Reply party info:", {
          fromContactId: originalMessage.toContactId,
          toStaffId: originalMessage.fromStaffId,
        });

        const url = `${config.baseUrl}/${config.entitySetName}`;

        // Get CSRF token for authentication
        const token = await this.getPortalToken();

        // Get the original message parties
        // In the original message: from = staff (_createdby_value), to = contact (party)
        // For the reply: reverse the roles
        //   - From: portal contact (participationtypemask=1)
        //   - To: staff member (participationtypemask=2)

        // Reply message payload
        // Navigation property format using @odata.bind
        const regardingConfig = this.getRegardingObjectConfig();
        const replyPayload = {
          subject: `Re: ${originalMessage.subject}`,
          description: replyText,
          adx_portalcommentdirectioncode: 1, // 1 = incoming (from contact to staff)
          [`${regardingConfig.navigationProperty}@odata.bind`]: `/${regardingConfig.entitySetName}(${originalMessage.regardingObjectId})`,
          // Activity parties with reversed sender/recipient from original
          adx_portalcomment_activity_parties: [
            {
              participationtypemask: 1, // From - portal contact replying
              "partyid_contact@odata.bind": `/contacts(${originalMessage.toContactId})`,
            },
            {
              participationtypemask: 2, // To - staff member from original _createdby_value
              "partyid_systemuser@odata.bind": `/systemusers(${originalMessage.fromStaffId})`,
            },
          ],
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            __RequestVerificationToken: token,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(replyPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        window.PortalExtensions.log("Reply created successfully");
        return { success: true, message: "Reply sent successfully" };
      } catch (error) {
        window.PortalExtensions.error("Failed to create reply:", error);
        return { success: false, message: error.message };
      }
    },

    /**
     * Mark all current messages as read
     */
    markAllMessagesAsRead: function () {
      const now = new Date().toISOString();
      localStorage.setItem("portalInbox_lastCheckedComments", now);

      // Update local state
      this.state.messages.forEach((msg) => {
        msg.read = true;
      });

      this.processMessages();
    },
  };

  // ============================================================================
  // UI NAMESPACE
  // Handles all UI rendering, DOM manipulation, and user interactions
  // ============================================================================
  const UI = {
    config: null,

    /**
     * Initialize UI namespace with configuration
     */
    init: function (config) {
      this.config = config;
    },

    /**
     * Inject CSS styles for the extension
     */
    injectStyles: function () {
      if (document.getElementById("portal-inbox-extension-styles")) {
        return;
      }

      const colors = this.config.colors;
      const styles = this.config.styles;

      const styleElement = document.createElement("style");
      styleElement.id = "portal-inbox-extension-styles";
      styleElement.textContent = `
                /* Portal Inbox Extension Styles */
                .message-avatar {
                    width: 40px !important;
                    height: 40px !important;
                    border-radius: 50% !important;
                    background: linear-gradient(135deg, ${colors.avatarGradientStart} 0%, ${colors.avatarGradientEnd} 100%) !important;
                    color: ${colors.avatarText} !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-weight: 600 !important;
                    font-size: 0.875rem !important;
                    flex-shrink: 0 !important;
                    margin-right: 0.75rem !important;
                }
                
                .message-from {
                    color: ${colors.messageFrom} !important;
                    font-weight: 600 !important;
                    font-size: 0.95rem !important;
                }
                
                .message-subject {
                    color: ${colors.messageSubject} !important;
                    font-size: 0.875rem !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                }
                
                .message-time {
                    color: ${colors.messageTime} !important;
                    font-size: 0.75rem !important;
                }
                
                #portal-inbox-badge {
                    font-size: 0.65rem !important;
                    padding: 0.4em 0.8em !important;
                    font-weight: 600 !important;
                    background-color: ${colors.badgeBackground} !important;
                    color: ${colors.badgeText} !important;
                }
                
                #portal-inbox-extension .nav-link {
                    color: ${colors.navLinkColor} !important;
                    text-decoration: none !important;
                }
                
                #portal-inbox-extension .nav-link:hover {
                    color: ${colors.navLinkColor} !important;
                    text-decoration: none !important;
                }
                
                #portal-inbox-extension .nav-link::after {
                    border-top-color: ${colors.navLinkCaretColor} !important;
                }
                
                .dropdown-menu {
                    border: none !important;
                    border-radius: 12px !important;
                    box-shadow: 0 10px 40px ${colors.dropdownShadow} !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    margin-top: 0.5rem !important;
                    background-color: white !important;
                }
                
                .dropdown-header {
                    background: linear-gradient(135deg, ${colors.headerGradientStart} 0%, ${colors.headerGradientEnd} 100%) !important;
                    color: ${colors.headerText} !important;
                    font-weight: 700 !important;
                    font-size: 1rem !important;
                    padding: 16px 20px !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                }
                
                .dropdown-divider {
                    margin: 0 !important;
                    border-color: ${colors.dropdownBorder} !important;
                }
                
                #portal-inbox-messages .dropdown-item {
                    padding: 16px 20px !important;
                    transition: background-color 0.15s !important;
                    border-bottom: 1px solid ${colors.itemBorderColor} !important;
                    text-decoration: none !important;
                    background-color: white !important;
                }
                
                #portal-inbox-messages .dropdown-item:last-child {
                    border-bottom: none !important;
                }
                
                #portal-inbox-messages .dropdown-item:hover {
                    background-color: white !important;
                    text-decoration: none !important;
                }
                
                #portal-inbox-messages .dropdown-item.fw-bold {
                    background-color: ${colors.itemUnreadBackground} !important;
                }
            `;

      document.head.appendChild(styleElement);
    },

    /**
     * Create the widget HTML structure
     */
    createWidget: function () {
      const container = document.getElementById(this.config.containerId);
      if (!container) {
        window.PortalExtensions.error("Portal Inbox Widget: Container element not found");
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

      // Container already verified to exist above
      container.innerHTML = widgetHTML;

      const dropdownToggle = document.getElementById("portalInboxDropdown");
      if (dropdownToggle) {
        dropdownToggle.addEventListener("show.bs.dropdown", (e) => {
          if (!Data.state.isLoaded) {
            e.preventDefault();
            window.PortalExtensions.log("Portal Inbox: Messages still loading...");
          }
        });
      } else {
        window.PortalExtensions.error("Portal Inbox: Dropdown toggle element not found");
      }

      this.createMessageModal();
    },

    /**
     * Create the message detail modal
     */
    createMessageModal: function () {
      if (document.getElementById("portalMessageModal")) {
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
                                ${
                                  this.config.features.enableReply
                                    ? `<button type="button" class="btn btn-primary" id="portalReplyBtn">
                                    <i class="${this.config.icons.reply} me-2"></i>${this.config.text.replyButton}
                                </button>`
                                    : ""
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;

      document.body.insertAdjacentHTML("beforeend", modalHTML);

      this.createConfirmationModal();
      this.createAlertModal();

      if (this.config.features.enableReply) {
        const replyBtn = document.getElementById("portalReplyBtn");
        if (replyBtn) {
          replyBtn.addEventListener("click", () => {
            this.toggleReplyMode();
          });
        }
      }
    },

    /**
     * Create a reusable confirmation modal
     */
    createConfirmationModal: function () {
      if (document.getElementById("portalConfirmModal")) {
        return;
      }

      const confirmModalHTML = `
                <div class="modal fade" id="portalConfirmModal" tabindex="-1" aria-labelledby="portalConfirmModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="portalConfirmModalLabel">Confirm</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body" id="portalConfirmModalBody">
                                <!-- Confirmation message will be inserted here -->
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="portalConfirmModalConfirmBtn">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      document.body.insertAdjacentHTML("beforeend", confirmModalHTML);
    },

    /**
     * Create a reusable alert modal
     */
    createAlertModal: function () {
      if (document.getElementById("portalAlertModal")) {
        return;
      }

      const alertModalHTML = `
                <div class="modal fade" id="portalAlertModal" tabindex="-1" aria-labelledby="portalAlertModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="portalAlertModalLabel">Alert</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body" id="portalAlertModalBody">
                                <!-- Alert message will be inserted here -->
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      document.body.insertAdjacentHTML("beforeend", alertModalHTML);
    },

    /**
     * Show a Bootstrap confirmation dialog
     */
    showConfirm: function (message, title = "Confirm") {
      return new Promise((resolve) => {
        const modal = document.getElementById("portalConfirmModal");
        const modalBody = document.getElementById("portalConfirmModalBody");
        const modalTitle = document.getElementById("portalConfirmModalLabel");
        const confirmBtn = document.getElementById("portalConfirmModalConfirmBtn");

        if (!modal || !modalBody || !modalTitle || !confirmBtn) {
          window.PortalExtensions.error("Portal Inbox: Confirm modal elements not found");
          resolve(false);
          return;
        }

        modalTitle.textContent = title;
        modalBody.innerHTML = message.replace(/\n/g, "<br>");

        const bsModal = new bootstrap.Modal(modal);

        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        const handleConfirm = () => {
          bsModal.hide();
          resolve(true);
        };

        const handleCancel = () => {
          bsModal.hide();
          resolve(false);
        };

        newConfirmBtn.addEventListener("click", handleConfirm);

        modal.addEventListener(
          "hidden.bs.modal",
          function cancelHandler(e) {
            if (e.target === modal) {
              modal.removeEventListener("hidden.bs.modal", cancelHandler);
              setTimeout(() => resolve(false), 0);
            }
          },
          { once: true }
        );

        bsModal.show();
      });
    },

    /**
     * Show a Bootstrap alert dialog
     */
    showAlert: function (message, title = "Alert") {
      return new Promise((resolve) => {
        const modal = document.getElementById("portalAlertModal");
        const modalBody = document.getElementById("portalAlertModalBody");
        const modalTitle = document.getElementById("portalAlertModalLabel");

        if (!modal || !modalBody || !modalTitle) {
          window.PortalExtensions.error("Portal Inbox: Alert modal elements not found");
          resolve();
          return;
        }

        modalTitle.textContent = title;
        modalBody.innerHTML = message.replace(/\n/g, "<br>");

        const bsModal = new bootstrap.Modal(modal);

        modal.addEventListener(
          "hidden.bs.modal",
          function closeHandler() {
            modal.removeEventListener("hidden.bs.modal", closeHandler);
            resolve();
          },
          { once: true }
        );

        bsModal.show();
      });
    },

    /**
     * Render messages in the dropdown
     */
    renderMessages: function () {
      const messagesContainer = document.getElementById("portal-inbox-messages");
      const badge = document.getElementById("portal-inbox-badge");

      if (!messagesContainer) {
        window.PortalExtensions.error("Portal Inbox: Messages container not found");
        return;
      }

      if (!badge) {
        window.PortalExtensions.error("Portal Inbox: Badge element not found");
        return;
      }

      if (Data.state.unreadCount > 0) {
        badge.textContent = Data.state.unreadCount;
        badge.style.display = this.config.styles.badgeDisplay;
      } else {
        badge.style.display = "none";
      }

      messagesContainer.innerHTML = "";

      const filteredMessages = Data.getFilteredMessages();

      const header = document.createElement("li");
      const headerText = Data.state.showArchived
        ? `${this.config.text.archivedHeader} (${filteredMessages.length})`
        : `${this.config.text.messagesHeader} (${Data.state.unreadCount} ${this.config.text.unreadLabel})`;
      header.innerHTML = `<h6 class="dropdown-header">${headerText}</h6>`;
      messagesContainer.appendChild(header);

      const divider = document.createElement("li");
      divider.innerHTML = '<hr class="dropdown-divider">';
      messagesContainer.appendChild(divider);

      if (filteredMessages.length === 0) {
        const emptyItem = document.createElement("li");
        const emptyText = Data.state.showArchived ? this.config.text.noArchivedMessages : this.config.text.noUnreadMessages;
        emptyItem.innerHTML = `<span class="dropdown-item-text text-muted text-center py-3">${emptyText}</span>`;
        messagesContainer.appendChild(emptyItem);
      } else {
        filteredMessages.forEach((message, index) => {
          const messageItem = this.createMessageItem(message, index);
          messagesContainer.appendChild(messageItem);
        });
      }

      if (this.config.features.enableArchive) {
        const bottomDivider = document.createElement("li");
        bottomDivider.innerHTML = '<hr class="dropdown-divider">';
        messagesContainer.appendChild(bottomDivider);

        const toggleItem = document.createElement("li");
        const toggleText = Data.state.showArchived
          ? `<i class="${this.config.icons.inbox} me-2"></i>${this.config.text.viewUnread}`
          : `<i class="${this.config.icons.archive} me-2"></i>${this.config.text.viewArchived}`;
        toggleItem.innerHTML = `
                    <a class="dropdown-item text-center fw-bold" href="#" id="portal-toggle-view" style="color: var(--primary-color);">
                        ${toggleText}
                    </a>
                `;
        messagesContainer.appendChild(toggleItem);

        const toggleLink = document.getElementById("portal-toggle-view");
        if (toggleLink) {
          toggleLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleToggleView();
          });
        } else {
          window.PortalExtensions.error("Portal Inbox: Toggle view link not found");
        }
      }
    },

    /**
     * Create a message item element
     */
    createMessageItem: function (message, index) {
      const li = document.createElement("li");
      const unreadClass = !message.read ? "fw-bold" : "";
      const unreadBadge = !message.read ? `<span class="badge bg-primary rounded-pill">${this.config.text.newBadge}</span>` : "";
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

      const link = li.querySelector("a");
      if (link) {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.handleMessageClick(message.id);
        });
      } else {
        window.PortalExtensions.error("Portal Inbox: Message link not found in message item");
      }

      return li;
    },

    /**
     * Handle message click
     */
    handleMessageClick: function (messageId) {
      const message = Data.getMessage(messageId);
      if (!message) return;

      if (!message.read) {
        Data.markMessageAsRead(messageId);
        this.renderMessages();
      }

      this.showMessageModal(message);

      const event = new CustomEvent("portalInboxMessageClick", {
        detail: { messageId: messageId, message: message },
      });
      document.dispatchEvent(event);
    },

    /**
     * Handle toggle view
     */
    handleToggleView: function () {
      Data.toggleView();
      this.renderMessages();
    },

    /**
     * Show message in modal
     */
    showMessageModal: function (message) {
      const modalBody = document.getElementById("portalMessageBody");
      const modalTitle = document.getElementById("portalMessageModalLabel");
      const footer = document.getElementById("portalMessageFooter");

      if (!modalBody || !modalTitle || !footer) {
        window.PortalExtensions.error("Portal Inbox: Message modal elements not found");
        return;
      }

      modalTitle.textContent = this.escapeHtml(message.subject);

      const messageContent = this.config.features.allowHtmlInMessages ? this.sanitizeHtmlForLinks(message.body) : this.escapeHtml(message.body);

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

      if (this.config.features.enableExternalLinkWarning && this.config.features.allowHtmlInMessages) {
        const links = modalBody.querySelectorAll("a[data-portal-link]");
        links.forEach((link) => {
          link.addEventListener("click", (e) => this.handleLinkClick(e));
        });
      }

      footer.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${this.config.text.closeButton}</button>
                ${
                  this.config.features.enableReply
                    ? `<button type="button" class="btn btn-primary" id="portalReplyBtn">
                    <i class="${this.config.icons.reply} me-2"></i>${this.config.text.replyButton}
                </button>`
                    : ""
                }
            `;

      if (this.config.features.enableReply) {
        const replyBtn = document.getElementById("portalReplyBtn");
        if (replyBtn) {
          replyBtn.addEventListener("click", () => {
            this.toggleReplyMode();
          });
        }
      }

      Data.state.replyMode = false;
      Data.state.currentMessage = message;

      const modalElement = document.getElementById("portalMessageModal");
      if (!modalElement) {
        window.PortalExtensions.error("Portal Inbox: Message modal element not found");
        return;
      }

      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modal.show();
    },

    /**
     * Toggle reply mode
     */
    toggleReplyMode: function () {
      if (Data.state.replyMode) {
        this.showMessageModal(Data.state.currentMessage);
      } else {
        Data.state.replyMode = true;
        const message = Data.state.currentMessage;
        const modalBody = document.getElementById("portalMessageBody");
        const footer = document.getElementById("portalMessageFooter");

        if (!modalBody || !footer) {
          window.PortalExtensions.error("Portal Inbox: Modal elements not found for reply mode");
          return;
        }

        const messageContent = this.config.features.allowHtmlInMessages ? this.sanitizeHtmlForLinks(message.body) : this.escapeHtml(message.body);

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

        if (this.config.features.enableExternalLinkWarning && this.config.features.allowHtmlInMessages) {
          const links = modalBody.querySelectorAll("a[data-portal-link]");
          links.forEach((link) => {
            link.addEventListener("click", (e) => this.handleLinkClick(e));
          });
        }

        footer.innerHTML = `
                    <button type="button" class="btn btn-secondary" id="portalCancelReplyBtn">${this.config.text.cancelButton}</button>
                    <button type="button" class="btn btn-primary" id="portalSendReplyBtn">
                        <i class="${this.config.icons.send} me-2"></i>${this.config.text.sendReplyButton}
                    </button>
                `;

        const cancelReplyBtn = document.getElementById("portalCancelReplyBtn");
        const sendReplyBtn = document.getElementById("portalSendReplyBtn");

        if (cancelReplyBtn) {
          cancelReplyBtn.addEventListener("click", () => {
            this.toggleReplyMode();
          });
        }

        if (sendReplyBtn) {
          sendReplyBtn.addEventListener("click", () => {
            this.sendReply();
          });
        }

        setTimeout(() => {
          const replyTextArea = document.getElementById("portalReplyText");
          if (replyTextArea) {
            replyTextArea.focus();
          }
        }, 100);
      }
    },

    /**
     * Send reply
     */
    sendReply: async function () {
      const replyTextElement = document.getElementById("portalReplyText");

      if (!replyTextElement) {
        window.PortalExtensions.error("Portal Inbox: Reply text element not found");
        return;
      }

      const replyText = replyTextElement.value.trim();

      if (!replyText) {
        await this.showAlert(this.config.text.replyPrompt, "Message Required");
        return;
      }

      const confirmed = await this.showConfirm(this.config.text.confirmSend, "Confirm Send");

      if (confirmed) {
        // Show loading state
        const sendBtn = document.getElementById("portalSendReplyBtn");

        if (!sendBtn) {
          window.PortalExtensions.error("Portal Inbox: Send reply button not found");
          return;
        }

        const originalText = sendBtn.innerHTML;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

        const result = await Data.createReply(Data.state.currentMessage.id, replyText);

        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;

        if (result.success) {
          const event = new CustomEvent("portalInboxReplySent", {
            detail: {
              originalMessage: Data.state.currentMessage,
              replyText: replyText,
              timestamp: new Date().toISOString(),
              success: true,
            },
          });
          document.dispatchEvent(event);

          const modalElement = document.getElementById("portalMessageModal");
          if (!modalElement) {
            window.PortalExtensions.error("Portal Inbox: Message modal element not found");
            return;
          }

          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }

          Data.state.replyMode = false;
          Data.state.currentMessage = null;

          const successMessage = this.config.text.replySent;
          modalElement.addEventListener(
            "hidden.bs.modal",
            async function successHandler() {
              await window.PortalInboxExtension.UI.showAlert(successMessage, "Success");
              modalElement.removeEventListener("hidden.bs.modal", successHandler);

              // Refresh messages to show the new reply
              Data.loadMessages();
            },
            { once: true }
          );
        } else {
          await this.showAlert(`Failed to send reply: ${result.message}`, "Error");
        }
      }
    },

    /**
     * Render error state
     */
    renderError: function () {
      const messagesContainer = document.getElementById("portal-inbox-messages");

      if (!messagesContainer) {
        window.PortalExtensions.error("Portal Inbox: Messages container not found");
        return;
      }

      messagesContainer.innerHTML = `
                <li><span class="dropdown-item-text text-danger">${this.config.text.failedToLoad}</span></li>
            `;
    },

    /**
     * Get initials from name
     */
    getInitials: function (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    },

    /**
     * Format date string
     */
    formatDate: function (dateString) {
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
    escapeHtml: function (text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    },

    /**
     * Sanitize HTML to allow only links
     */
    sanitizeHtmlForLinks: function (html) {
      const temp = document.createElement("div");
      temp.innerHTML = html;

      const allElements = temp.querySelectorAll("*");

      allElements.forEach((el) => {
        if (el.tagName.toLowerCase() !== "a") {
          const text = document.createTextNode(el.textContent);
          el.parentNode.replaceChild(text, el);
        }
      });

      const links = temp.querySelectorAll("a");
      links.forEach((link) => {
        const href = link.getAttribute("href");
        const target = link.getAttribute("target");

        while (link.attributes.length > 0) {
          link.removeAttribute(link.attributes[0].name);
        }

        if (href) {
          link.setAttribute("href", href);
        }
        if (target) {
          link.setAttribute("target", target);
        } else {
          link.setAttribute("target", "_blank");
        }
        link.setAttribute("rel", "noopener noreferrer");
        link.setAttribute("data-portal-link", "true");
      });

      return temp.innerHTML;
    },

    /**
     * Check if a URL is external
     */
    isExternalLink: function (url) {
      try {
        const linkUrl = new URL(url, window.location.href);
        const currentUrl = new URL(window.location.href);
        return linkUrl.hostname !== currentUrl.hostname;
      } catch (e) {
        return true;
      }
    },

    /**
     * Handle link clicks with external domain warnings
     */
    handleLinkClick: async function (event) {
      const link = event.target.closest("a[data-portal-link]");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      if (this.isExternalLink(href)) {
        event.preventDefault();

        const domain = new URL(href, window.location.href).hostname;
        const message = this.config.text.externalLinkWarning.replace("{domain}", domain);

        const confirmed = await this.showConfirm(message, "External Link Warning");

        if (confirmed) {
          window.open(href, link.getAttribute("target") || "_blank", "noopener,noreferrer");
        }
      }
    },
  };

  // ============================================================================
  // MAIN NAMESPACE
  // Handles initialization, configuration, and orchestration
  // ============================================================================
  const Main = {
    config: {
      // ========================================================================
      // DATA SOURCE CONFIGURATION
      // ========================================================================

      // Local data source - path to JSON file for testing/development
      localDataSource: null,

      // Portal data source - Power Pages Web API configuration
      portalDataSource: {
        entitySetName: "adx_portalcomments",
        baseUrl: "/_api",
        operations: {
          read: {
            enabled: true,
            select: null, // OData $select - comma-separated field list
            filter: null, // OData $filter - additional filter criteria
            orderBy: "createdon desc", // OData $orderby
            expand: "adx_portalcomment_activity_parties($expand=partyid_contact,partyid_systemuser)", // OData $expand
          },
          create: {
            enabled: true,
          },
          update: {
            enabled: true, // Required for updating hasread field
          },
          delete: {
            enabled: false,
          },
        },
      },

      // ========================================================================
      // CONTAINER CONFIGURATION
      // ========================================================================
      containerId: null, // Required - ID of DOM element to inject widget into

      // ========================================================================
      // UI TEXT CONFIGURATION
      // ========================================================================
      text: {
        dropdownToggleIcon: "bi bi-envelope-fill",
        messagesHeader: "Messages",
        archivedHeader: "Archived Messages",
        unreadLabel: "unread",
        noUnreadMessages: "No unread messages",
        noArchivedMessages: "No archived messages",
        viewArchived: "View Archived Messages",
        viewUnread: "View Unread Messages",
        loadingMessages: "Loading messages...",
        failedToLoad: "Failed to load messages",
        modalTitle: "Message",
        closeButton: "Close",
        replyButton: "Reply",
        sendReplyButton: "Send Reply",
        cancelButton: "Cancel",
        replyPlaceholder: "Type your reply here...",
        replyLabel: "Your Reply:",
        originalMessageLabel: "Original Message:",
        toLabel: "To: You",
        newBadge: "New",
        justNow: "Just now",
        minuteAgo: "minute ago",
        minutesAgo: "minutes ago",
        hourAgo: "hour ago",
        hoursAgo: "hours ago",
        dayAgo: "day ago",
        daysAgo: "days ago",
        replyPrompt: "Please enter a reply message.",
        confirmSend: "Are you sure you want to send this reply?",
        replySent: "Reply sent successfully!",
        externalLinkWarning:
          "You are about to leave this website and navigate to an external site.\n\nExternal Site: {domain}\n\nThis link is being provided for your convenience. We are not responsible for the content, privacy policies, or practices of external sites.\n\nDo you wish to continue?",
      },

      // ========================================================================
      // ICON CONFIGURATION
      // ========================================================================
      icons: {
        inbox: "bi bi-inbox-fill",
        archive: "bi bi-archive-fill",
        reply: "bi bi-reply-fill",
        send: "bi bi-send-fill",
      },

      // ========================================================================
      // STYLE CONFIGURATION
      // ========================================================================
      styles: {
        dropdownMinWidth: "350px",
        dropdownMaxHeight: "400px",
        badgeDisplay: "inline-block",
      },

      // ========================================================================
      // COLOR CONFIGURATION
      // ========================================================================
      colors: {
        // Avatar colors
        avatarGradientStart: "#0078d4",
        avatarGradientEnd: "#005a9e",
        avatarText: "#ffffff",

        // Header colors
        headerGradientStart: "#0078d4",
        headerGradientEnd: "#005a9e",
        headerText: "#ffffff",

        // Message text colors
        messageFrom: "#1e293b",
        messageSubject: "#64748b",
        messageTime: "#94a3b8",

        // Dropdown colors
        dropdownBorder: "#e2e8f0",
        dropdownShadow: "rgba(0, 0, 0, 0.15)",

        // Item states
        itemHoverBackground: "#f1f5f9",
        itemUnreadBackground: "#f8f9ff",
        itemBorderColor: "#e2e8f0",

        // Badge colors
        badgeBackground: "#dc3545",
        badgeText: "#ffffff",

        // Navigation link colors
        navLinkColor: "#ffffff",
        navLinkCaretColor: "#ffffff",

        // Primary action color
        primaryColor: "#0078d4",
      },

      // ========================================================================
      // FEATURE FLAGS
      // ========================================================================
      features: {
        enableArchive: true,
        enableReply: true,
        enableExternalLinkWarning: true,
        allowHtmlInMessages: true,
      },

      // ========================================================================
      // AUTO-INIT FLAG
      // ========================================================================
      autoInit: false,
    },

    /**
     * Initialize the extension
     */
    init: function (options) {
      if (!options) {
        window.PortalExtensions.error("Portal Inbox Extension: Configuration object is required");
        return;
      }

      if (!options.localDataSource && !options.portalDataSource) {
        window.PortalExtensions.error("Portal Inbox Extension: Either localDataSource or portalDataSource is required in configuration");
        return;
      }

      if (!options.containerId) {
        window.PortalExtensions.error("Portal Inbox Extension: containerId is required in configuration");
        return;
      }

      this.mergeConfig(this.config, options);

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.setup());
      } else {
        this.setup();
      }
    },

    /**
     * Deep merge configuration
     */
    mergeConfig: function (target, source) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
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
    setup: function () {
      const isLocal = Data.isLocalEnvironment();
      window.PortalExtensions.log(`Portal Inbox Extension: Environment detected as ${isLocal ? "LOCAL" : "PORTAL"}`);
      window.PortalExtensions.log(`Portal Inbox Extension: Using ${isLocal ? "local JSON file" : "Power Pages Web API"}`);

      Data.init(this.config);
      UI.init(this.config);

      UI.injectStyles();
      UI.createWidget();
      Data.loadMessages();
    },

    /**
     * Public API for manual refresh
     */
    refresh: function () {
      Data.loadMessages();
    },
  };

  // ============================================================================
  // EXPOSE PUBLIC API
  // ============================================================================

  // Create public interface with organized namespaces
  const PortalInboxExtension = {
    // Main initialization and control
    init: Main.init.bind(Main),
    refresh: Main.refresh.bind(Main),

    // Testing utilities
    clearReadStatus: function () {
      localStorage.removeItem("portalInbox_lastCheckedComments");
      window.PortalExtensions.log("Portal Inbox: Read status cleared from localStorage");
      Data.loadMessages();
    },

    // Expose namespaces for advanced usage
    Data: Data,
    UI: UI,
    Main: Main,
  };

  // Expose extension to global scope
  window.PortalInboxExtension = PortalInboxExtension;
})();
