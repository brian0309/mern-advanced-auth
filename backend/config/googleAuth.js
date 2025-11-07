import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

// Initialize with default values that will be replaced by environment variables
let googleClient;
let redirectUri;

const initializeGoogleClient = () => {
    console.log('Initializing Google OAuth client...');
    console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        const errorMsg = 'Missing required Google OAuth environment variables. ' +
            `GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'set' : 'missing'}, ` +
            `GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'missing'}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Validate and set redirect URI
    const allowedRedirectUris = [
        'http://localhost:5000/api/auth/google/callback',
        // Add your production URI here when deploying
        // 'https://yourdomain.com/api/auth/google/callback',
    ];

    redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    if (!redirectUri) {
        throw new Error('GOOGLE_REDIRECT_URI environment variable is required');
    }

    if (!allowedRedirectUris.includes(redirectUri)) {
        console.warn(`Warning: Redirect URI ${redirectUri} not in allowed list. Allowed URIs: ${allowedRedirectUris.join(', ')}`);
        // In development, we'll allow it with a warning, but log it
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Invalid redirect URI: ${redirectUri}. Must be one of: ${allowedRedirectUris.join(', ')}`);
        }
    }

    console.log('Using redirect URI:', redirectUri);
    
    try {
        googleClient = new OAuth2Client({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: redirectUri
        });
        console.log('Google OAuth client initialized successfully');
        return googleClient;
    } catch (error) {
        console.error('Error initializing Google OAuth client:', error);
        throw new Error(`Failed to initialize Google OAuth client: ${error.message}`);
    }
};

export const getGoogleAuthURL = () => {
    try {
        // Initialize client if not already done
        if (!googleClient) {
            googleClient = initializeGoogleClient();
        }

        // Generate cryptographically secure random state for CSRF protection
        const state = crypto.randomBytes(32).toString('hex');

        const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        const options = {
            redirect_uri: redirectUri,
            client_id: process.env.GOOGLE_CLIENT_ID,
            access_type: 'offline',
            response_type: 'code',
            prompt: 'consent',
            state: state, // CSRF protection
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
            ].join(' '),
        };

        const url = `${rootUrl}?${new URLSearchParams(options).toString()}`;
        
        // Return both URL and state - controller must store state in session/cookie
        return { url, state };
    } catch (error) {
        console.error('Error generating Google Auth URL:', error.message);
        throw new Error('Failed to generate Google authentication URL');
    }
};

export const getGoogleUser = async (code) => {
    try {
        // Initialize client if not already done
        if (!googleClient) {
            googleClient = initializeGoogleClient();
        }

        const { tokens } = await googleClient.getToken({
            code,
            redirect_uri: redirectUri,
        });

        if (!tokens.access_token || !tokens.id_token) {
            throw new Error('Failed to get access token from Google');
        }

        // Verify the ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        // Verify the token is for your application
        if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            throw new Error('Token audience mismatch');
        }

        // Verify email is verified by Google
        if (!payload.email_verified) {
            throw new Error('Google email not verified');
        }

        // Return verified user data from the ID token
        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            verified_email: payload.email_verified,
        };
    } catch (error) {
        console.error('Error getting Google user:', error.message);
        throw new Error('Failed to authenticate with Google');
    }
};
