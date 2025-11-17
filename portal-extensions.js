/**
 * Portal Extensions Loader
 * Dynamically loads all portal extension JavaScript files
 */
(function() {
    'use strict';
    
    // Configuration: List of all extensions to load
    const extensions = [
        {
            name: 'Portal Inbox',
            path: 'portal-inbox-extension/portal-inbox-extension.js',
            enabled: true
        }
        // Add more extensions here as they are created
        // {
        //     name: 'Another Extension',
        //     path: 'another-extension/another-extension.js',
        //     enabled: true
        // }
    ];
    
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
            
            const script = document.createElement('script');
            script.src = extension.path;
            script.async = false; // Load in order
            
            script.onload = () => {
                console.log(`Portal Extensions: Loaded ${extension.name}`);
                resolve({ name: extension.name, status: 'loaded' });
            };
            
            script.onerror = () => {
                console.error(`Portal Extensions: Failed to load ${extension.name} from ${extension.path}`);
                reject({ name: extension.name, status: 'error', path: extension.path });
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Load all extensions
     */
    function loadAllExtensions() {
        console.log('Portal Extensions: Starting to load extensions...');
        
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
