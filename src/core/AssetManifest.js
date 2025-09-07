export class AssetManifest {
    constructor() {
        this.assets = new Map();
        this.categories = {
            audio: new Map(),
            textures: new Map(),
            models: new Map()
        };

        this.loadingStats = {
            total: 0,
            loaded: 0,
            failed: 0,
            pending: 0
        };

        console.log('📋 Asset Manifest initialized');
    }

    // Register an asset
    registerAsset(category, name, url, status = 'pending') {
        const asset = {
            name,
            url,
            category,
            status,
            loaded: false,
            error: null,
            size: 0,
            loadTime: 0,
            timestamp: Date.now()
        };

        this.assets.set(`${category}:${name}`, asset);
        this.categories[category].set(name, asset);

        this.loadingStats.total++;
        this.loadingStats.pending++;

        return asset;
    }

    // Update asset status
    updateAssetStatus(category, name, status, data = {}) {
        const key = `${category}:${name}`;
        const asset = this.assets.get(key);

        if (!asset) {
            console.warn(`Asset not found: ${key}`);
            return;
        }

        const oldStatus = asset.status;
        asset.status = status;
        asset.timestamp = Date.now();

        // Update stats
        if (oldStatus !== status) {
            this.updateStats(oldStatus, status);
        }

        // Update asset data
        if (data.error) asset.error = data.error;
        if (data.size) asset.size = data.size;
        if (data.loadTime) asset.loadTime = data.loadTime;
        if (status === 'loaded') {
            asset.loaded = true;
        }

        console.log(`📦 Asset ${status}: ${category}/${name}`);
    }

    // Update loading statistics
    updateStats(oldStatus, newStatus) {
        // Decrease old status count
        if (this.loadingStats[oldStatus] !== undefined) {
            this.loadingStats[oldStatus]--;
        }

        // Increase new status count
        if (this.loadingStats[newStatus] !== undefined) {
            this.loadingStats[newStatus]++;
        } else {
            // Initialize new status if it doesn't exist
            this.loadingStats[newStatus] = 1;
        }
    }

    // Get asset by category and name
    getAsset(category, name) {
        return this.categories[category]?.get(name);
    }

    // Get all assets by category
    getAssetsByCategory(category) {
        return Array.from(this.categories[category].values());
    }

    // Get all assets
    getAllAssets() {
        return Array.from(this.assets.values());
    }

    // Get assets by status
    getAssetsByStatus(status) {
        return this.getAllAssets().filter(asset => asset.status === status);
    }

    // Get loading progress
    getLoadingProgress() {
        const { total, loaded, failed } = this.loadingStats;
        const completed = loaded + failed;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        return {
            ...this.loadingStats,
            completed,
            percentage,
            isComplete: completed >= total
        };
    }

    // Get category summary
    getCategorySummary(category) {
        const assets = this.getAssetsByCategory(category);
        const stats = {
            total: assets.length,
            loaded: 0,
            failed: 0,
            pending: 0
        };

        assets.forEach(asset => {
            stats[asset.status] = (stats[asset.status] || 0) + 1;
        });

        return stats;
    }

    // Get detailed report
    getDetailedReport() {
        const report = {
            overall: this.getLoadingProgress(),
            categories: {},
            failedAssets: [],
            slowAssets: []
        };

        // Category summaries
        Object.keys(this.categories).forEach(category => {
            report.categories[category] = this.getCategorySummary(category);
        });

        // Failed assets
        report.failedAssets = this.getAssetsByStatus('failed');

        // Slow loading assets (>1 second)
        report.slowAssets = this.getAllAssets()
            .filter(asset => asset.loadTime > 1000)
            .sort((a, b) => b.loadTime - a.loadTime);

        return report;
    }

    // Export manifest data
    exportManifest() {
        const data = {
            timestamp: Date.now(),
            stats: this.loadingStats,
            assets: this.getAllAssets().map(asset => ({
                category: asset.category,
                name: asset.name,
                url: asset.url,
                status: asset.status,
                size: asset.size,
                loadTime: asset.loadTime
            }))
        };

        return JSON.stringify(data, null, 2);
    }

    // Import manifest data
    importManifest(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            // Clear current data
            this.assets.clear();
            Object.keys(this.categories).forEach(cat => this.categories[cat].clear());

            // Reset stats
            this.loadingStats = {
                total: 0,
                loaded: 0,
                failed: 0,
                pending: 0
            };

            // Import assets
            data.assets.forEach(assetData => {
                const asset = this.registerAsset(
                    assetData.category,
                    assetData.name,
                    assetData.url,
                    assetData.status
                );

                asset.size = assetData.size;
                asset.loadTime = assetData.loadTime;
                asset.loaded = assetData.status === 'loaded';
            });

            console.log('📋 Asset manifest imported successfully');
        } catch (error) {
            console.error('❌ Failed to import asset manifest:', error);
        }
    }

    // Debug information
    getDebugInfo() {
        const report = this.getDetailedReport();

        console.group('🎮 Asset Manifest Debug Info');
        console.log('📊 Overall Progress:', report.overall);
        console.log('📂 Categories:', report.categories);

        if (report.failedAssets.length > 0) {
            console.warn('❌ Failed Assets:', report.failedAssets);
        }

        if (report.slowAssets.length > 0) {
            console.warn('🐌 Slow Loading Assets:', report.slowAssets);
        }

        console.log('📋 Full Asset List:', this.getAllAssets());
        console.groupEnd();

        return report;
    }

    // Cleanup
    dispose() {
        this.assets.clear();
        Object.keys(this.categories).forEach(cat => this.categories[cat].clear());
        console.log('🧹 Asset Manifest disposed');
    }
}
