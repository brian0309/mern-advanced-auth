# Vercel Configuration Explained

This document explains the `vercel.json` configuration for deploying the MERN Advanced Auth application.

## Configuration Breakdown

### Version
```json
"version": 2
```
- Uses Vercel's Build API v2

### Builds
Defines how different parts of the application should be built:

#### Backend Build
```json
{
  "src": "api/index.ts",
  "use": "@vercel/node"
}
```
- **src**: Entry point for backend serverless function
- **use**: Uses Node.js runtime builder
- The `api/index.ts` imports and exports the Express app from `backend/index.ts`

#### Frontend Build
```json
{
  "src": "frontend/package.json",
  "use": "@vercel/static-build",
  "config": {
    "distDir": "frontend/dist"
  }
}
```
- **src**: Frontend package.json location
- **use**: Static build builder (for Vite/React)
- **config.distDir**: Output directory after build

### Routes
Defines how incoming requests are routed:

#### API Routes
```json
{
  "src": "/api/(.*)",
  "dest": "api/index.ts"
}
```
- All requests to `/api/*` are sent to the serverless function
- Handles backend API endpoints

#### Static Assets
```json
{
  "src": "/(.+\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|webp))",
  "dest": "frontend/dist/$1"
}
```
- Static files are served directly from the build output
- Matches common file extensions

#### Catch-All (SPA)
```json
{
  "src": "/(.*)",
  "dest": "frontend/dist/index.html"
}
```
- All other requests serve the React app's index.html
- Enables client-side routing (React Router)

### Build Configuration

```json
"installCommand": "npm install && npm install --prefix frontend"
```
- Installs dependencies for both backend and frontend

```json
"buildCommand": "npm run build"
```
- Runs the build script from root `package.json`
- Compiles TypeScript backend and builds React frontend

```json
"outputDirectory": "frontend/dist"
```
- Where static files are served from

## How It Works

1. **Deployment Trigger**: Push to Git repository
2. **Install**: Vercel runs `installCommand`
3. **Build**: Vercel runs `buildCommand`
   - Backend: TypeScript compiled to JavaScript in `dist/backend/`
   - Frontend: Vite builds React app to `frontend/dist/`
4. **Serverless Function**: `api/index.ts` becomes a serverless function
5. **Static Hosting**: `frontend/dist/` is served as static files
6. **Routing**: 
   - `/api/*` → Serverless function (backend)
   - Static files → Direct serving
   - All else → `index.html` (React app)

## Environment Variables

Environment variables are set in Vercel project settings, not in `vercel.json`.

Required variables:
- `MONGO_URI`
- `JWT_SECRET`
- `MAILTRAP_TOKEN`
- `MAILTRAP_ENDPOINT`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `CLIENT_URL`
- `NODE_ENV`

## Serverless Function Limitations

Vercel serverless functions have limitations:
- **Execution Time**: 10s (Hobby), 60s (Pro), 900s (Enterprise)
- **Payload Size**: 4.5MB request, 4.5MB response
- **Memory**: 1024MB (default)
- **Cold Start**: First request may be slower

For long-running operations, consider:
- Background jobs with Queue services
- Webhooks
- Scheduled functions (Vercel Cron)

## Differences from Traditional Hosting

### Traditional Hosting (e.g., Heroku, Render)
- Single long-running server
- Persistent connections
- Background jobs on same server
- Single deployment

### Vercel Serverless
- Functions spin up on demand
- Stateless (no persistent connections)
- Separate background job services needed
- Backend and frontend optimized separately

## Benefits of This Setup

1. **Automatic Scaling**: Serverless functions scale automatically
2. **Global CDN**: Frontend served from edge locations
3. **Fast Deployments**: Incremental builds
4. **Preview Deployments**: Each PR gets a unique URL
5. **Zero Config SSL**: Automatic HTTPS
6. **Cost Effective**: Pay for usage, not idle time

## Troubleshooting

### Function Timeout
If requests take too long:
- Optimize database queries
- Add database indexes
- Use connection pooling
- Consider upgrading Vercel plan

### Cold Starts
If first request is slow:
- Expected behavior for serverless
- Vercel Pro has warmer functions
- Optimize import statements
- Reduce bundle size

### Database Connections
MongoDB connections in serverless:
- Use connection pooling
- Reuse connections across invocations
- Set appropriate timeout values
- Consider MongoDB Atlas for better performance

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel Static Build](https://vercel.com/docs/frameworks/vite)
- [Serverless Functions Best Practices](https://vercel.com/docs/functions/best-practices)
