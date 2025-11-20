/**
 * Portal Extensions Loader
 * Dynamically loads all portal extension JavaScript files
 * 
 * @author Daniel Penrod <daniel.penrod@microsoft.com>
 */
(function() {
    'use strict';
    
    // Detect environment: local development vs hosted portal
    function isLocalEnvironment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname.startsWith('192.168.') ||
               hostname.startsWith('10.') ||
               hostname.endsWith('.local') ||
               window.location.protocol === 'file:';
    }
    
    const isLocal = isLocalEnvironment();
    const portalBaseUrl = window.location.origin;
    
    // Configuration: List of all extensions to load
    const extensions = [
        {
            name: 'Portal Inbox',
            filename: 'portal-inbox-extension.js', // Just the filename, always at root on portal
            enabled: true
        }
        // Add more extensions here as they are created
        // {
        //     name: 'Another Extension',
        //     filename: 'another-extension.js',
        //     enabled: true
        // }
    ];
    
    /**
     * Get the full path for an extension
     */
    function getExtensionPath(filename) {
        if (isLocal) {
            // Local development: use relative path to extension folder
            const extensionFolder = filename.replace('.js', '');
            return `${extensionFolder}/${filename}`;
        } else {
            // Portal environment: extension is at domain root
            return `${portalBaseUrl}/${filename}`;
        }
    }
    
    /**
     * Load a single extension script
     */
    function loadExtension(extension) {
        return new Promise((resolve, reject) => {
            if (!extension.enabled) {
                console.log(`Portal Extensions: Skipping disabled extension: ${extension.name}`);
                resolve({ name: extension.name, status: 'skipped' });
                return;
            }
            
            const path = getExtensionPath(extension.filename);
            const script = document.createElement('script');
            script.src = path;
            script.async = false; // Load in order
            
            script.onload = () => {
                console.log(`Portal Extensions: Loaded ${extension.name} from ${path}`);
                resolve({ name: extension.name, status: 'loaded' });
            };
            
            script.onerror = () => {
                console.error(`Portal Extensions: Failed to load ${extension.name} from ${path}`);
                reject({ name: extension.name, status: 'error', path: path });
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Load all extensions
     */
    function loadAllExtensions() {
        console.log('Portal Extensions: Starting to load extensions...');
        console.log(`Portal Extensions: Environment = ${isLocal ? 'Local' : 'Portal (' + portalBaseUrl + ')'}`);
        
        // Load extensions sequentially to maintain order
        const loadPromises = extensions.map(ext => loadExtension(ext));
        
        Promise.allSettled(loadPromises)
            .then(results => {
                const loaded = results.filter(r => r.status === 'fulfilled' && r.value.status === 'loaded');
                const failed = results.filter(r => r.status === 'rejected');
                const skipped = results.filter(r => r.status === 'fulfilled' && r.value.status === 'skipped');
                
                console.log(`Portal Extensions: Loading complete!`);
                console.log(`  - Loaded: ${loaded.length}`);
                console.log(`  - Failed: ${failed.length}`);
                console.log(`  - Skipped: ${skipped.length}`);
                
                // Dispatch custom event when all extensions are loaded
                const event = new CustomEvent('portalExtensionsLoaded', {
                    detail: {
                        total: extensions.length,
                        loaded: loaded.length,
                        failed: failed.length,
                        skipped: skipped.length,
                        results: results
                    }
                });
                document.dispatchEvent(event);
            });
    }
    
    // Auto-load extensions when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllExtensions);
    } else {
        loadAllExtensions();
    }
    
    // Expose API for manual control if needed
    window.PortalExtensions = {
        reload: loadAllExtensions,
        extensions: extensions
    };
    
})();
