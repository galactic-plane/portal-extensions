/**
 * Portal Extensions Initialization (No Authentication Required)
 * Initializes all portal extensions available to public (anonymous) users
 * 
 * @author Daniel Penrod <daniel.penrod@microsoft.com>
 */

// Portal extensions loaded event handler
document.addEventListener('portalExtensionsLoaded', function() {
    window.PortalExtensions.log('All non-authenticated portal extensions loaded successfully');
    
    // Public extension initializations can be added below
    // Authenticated extensions are initialized in portal-extensions-init-auth.js
});
