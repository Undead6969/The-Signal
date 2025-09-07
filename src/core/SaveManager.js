export class SaveManager {
    constructor() {
        this.saveKey = 'theSignal_saveData';
        this.maxSaveSlots = 3;
        this.currentSlot = 0;

        // Auto-save settings
        this.autoSaveEnabled = true;
        this.autoSaveInterval = 30000; // 30 seconds
        this.lastAutoSave = 0;

        console.log('💾 Save Manager initialized');
    }

    // Save game data to localStorage
    saveGame(gameState, slot = null) {
        try {
            const saveSlot = slot !== null ? slot : this.currentSlot;
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                slot: saveSlot,
                gameState: gameState,
                metadata: {
                    playTime: gameState.gameTime || 0,
                    currentAct: gameState.storyState?.currentAct || 0,
                    playerHealth: gameState.playerState?.health || 100,
                    location: 'Blackstar Research Facility'
                }
            };

            const saves = this.getAllSaves();
            saves[saveSlot] = saveData;

            localStorage.setItem(this.saveKey, JSON.stringify(saves));

            console.log(`💾 Game saved to slot ${saveSlot}`);
            return true;

        } catch (error) {
            console.error('❌ Failed to save game:', error);
            return false;
        }
    }

    // Load game data from localStorage
    loadGame(slot = null) {
        try {
            const saveSlot = slot !== null ? slot : this.currentSlot;
            const saves = this.getAllSaves();

            if (!saves[saveSlot]) {
                console.warn(`⚠️ No save data found in slot ${saveSlot}`);
                return null;
            }

            const saveData = saves[saveSlot];
            console.log(`📁 Game loaded from slot ${saveSlot}`);
            return saveData.gameState;

        } catch (error) {
            console.error('❌ Failed to load game:', error);
            return null;
        }
    }

    // Get all save slots
    getAllSaves() {
        try {
            const savesData = localStorage.getItem(this.saveKey);
            return savesData ? JSON.parse(savesData) : {};
        } catch (error) {
            console.error('❌ Failed to get save slots:', error);
            return {};
        }
    }

    // Check if a save slot exists
    hasSave(slot = null) {
        const saves = this.getAllSaves();
        const saveSlot = slot !== null ? slot : this.currentSlot;
        return saves[saveSlot] !== undefined;
    }

    // Delete a save slot
    deleteSave(slot) {
        try {
            const saves = this.getAllSaves();
            if (saves[slot]) {
                delete saves[slot];
                localStorage.setItem(this.saveKey, JSON.stringify(saves));
                console.log(`🗑️ Save slot ${slot} deleted`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Failed to delete save:', error);
            return false;
        }
    }

    // Get save slot metadata
    getSaveMetadata(slot) {
        const saves = this.getAllSaves();
        if (saves[slot]) {
            return {
                timestamp: saves[slot].timestamp,
                playTime: saves[slot].metadata?.playTime || 0,
                currentAct: saves[slot].metadata?.currentAct || 0,
                playerHealth: saves[slot].metadata?.playerHealth || 100,
                formattedDate: this.formatDate(saves[slot].timestamp)
            };
        }
        return null;
    }

    // Auto-save functionality
    update(gameTime) {
        if (this.autoSaveEnabled && gameTime - this.lastAutoSave > this.autoSaveInterval) {
            // This would be called from the game engine with current game state
            this.lastAutoSave = gameTime;
        }
    }

    // Format timestamp for display
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Export save data (for backup/sharing)
    exportSave(slot) {
        const saves = this.getAllSaves();
        if (saves[slot]) {
            const dataStr = JSON.stringify(saves[slot], null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `the-signal-save-slot-${slot}.json`;
            link.click();

            console.log(`📤 Save slot ${slot} exported`);
            return true;
        }
        return false;
    }

    // Import save data (for restore)
    importSave(file, slot) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    const saves = this.getAllSaves();
                    saves[slot] = saveData;

                    localStorage.setItem(this.saveKey, JSON.stringify(saves));
                    console.log(`📥 Save imported to slot ${slot}`);
                    resolve(true);
                } catch (error) {
                    console.error('❌ Failed to import save:', error);
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    // Get storage usage
    getStorageUsage() {
        try {
            const saves = this.getAllSaves();
            const dataSize = JSON.stringify(saves).length;
            const maxSize = 5 * 1024 * 1024; // 5MB limit for localStorage

            return {
                used: dataSize,
                max: maxSize,
                percentage: Math.round((dataSize / maxSize) * 100)
            };
        } catch (error) {
            return { used: 0, max: 0, percentage: 0 };
        }
    }

    // Clear all saves
    clearAllSaves() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('🗑️ All save data cleared');
            return true;
        } catch (error) {
            console.error('❌ Failed to clear saves:', error);
            return false;
        }
    }

    // Set current save slot
    setCurrentSlot(slot) {
        if (slot >= 0 && slot < this.maxSaveSlots) {
            this.currentSlot = slot;
            console.log(`🎯 Current save slot set to ${slot}`);
            return true;
        }
        return false;
    }

    // Get current slot
    getCurrentSlot() {
        return this.currentSlot;
    }

    // Validate save data
    validateSaveData(saveData) {
        try {
            // Check required fields
            if (!saveData.version || !saveData.timestamp || !saveData.gameState) {
                return false;
            }

            // Check version compatibility
            if (saveData.version !== '1.0.0') {
                console.warn('⚠️ Save data version mismatch');
            }

            return true;
        } catch (error) {
            console.error('❌ Invalid save data:', error);
            return false;
        }
    }

    // Create quick save (slot 0)
    quickSave(gameState) {
        return this.saveGame(gameState, 0);
    }

    // Quick load (slot 0)
    quickLoad() {
        return this.loadGame(0);
    }

    // Debug methods
    getDebugInfo() {
        const saves = this.getAllSaves();
        const storage = this.getStorageUsage();

        return {
            saveSlots: Object.keys(saves).length,
            currentSlot: this.currentSlot,
            storageUsed: `${Math.round(storage.used / 1024)}KB`,
            storagePercentage: `${storage.percentage}%`,
            autoSaveEnabled: this.autoSaveEnabled,
            autoSaveInterval: this.autoSaveInterval
        };
    }

    // List all save slots with metadata
    listSaveSlots() {
        const saves = this.getAllSaves();
        const slots = [];

        for (let i = 0; i < this.maxSaveSlots; i++) {
            if (saves[i]) {
                slots.push({
                    slot: i,
                    exists: true,
                    metadata: this.getSaveMetadata(i)
                });
            } else {
                slots.push({
                    slot: i,
                    exists: false,
                    metadata: null
                });
            }
        }

        return slots;
    }
}
