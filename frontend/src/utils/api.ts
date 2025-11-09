/**
 * API Configuration Utility
 * Centralizes API URL logic for consistent usage across the application
 */

/**
 * Get the API URL based on the current environment
 * - Development: http://localhost:5000/api/auth
 * - Production with VITE_API_URL set: uses VITE_API_URL
 * - Production without VITE_API_URL: /api/auth (same-origin)
 */
export const getApiUrl = (): string => {
	if (import.meta.env.MODE === "development") {
		return "http://localhost:5000/api/auth";
	}
	
	// In production, prefer VITE_API_URL if set, otherwise use relative path
	return import.meta.env.VITE_API_URL || "/api/auth";
};

export const API_URL = getApiUrl();
