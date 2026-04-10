# Production Deployment Guide

## Fixed Issues
The live session auto-termination issue has been resolved with the following fixes:

### 1. Socket Connection Configuration
- **Problem**: Guests were trying to connect to `localhost:3000` in production
- **Solution**: Dynamic socket URL detection that automatically uses the current domain
- **Files Modified**: `src/engine/lib/socket.js`

### 2. Content Security Policy (CSP)
- **Problem**: CSP headers blocked WebSocket connections in production
- **Solution**: Added `ws:` and `wss:` protocols to `connect-src` directive
- **Files Modified**: `next.config.js`

### 3. Enhanced Error Handling
- **Problem**: No visibility into connection failures
- **Solution**: Added connection status tracking and error logging
- **Files Modified**: `src/engine/SessionProvider.jsx`

### 4. Session Persistence
- **Problem**: In-memory storage lost sessions on server restart
- **Solution**: Redis-based session storage with in-memory fallback
- **Files Modified**: `server.js`, `src/engine/lib/redisStore.js`

## Production Deployment Steps

### 1. Environment Variables
Set these environment variables in your Render dashboard:

```bash
# Production Configuration
NODE_ENV=production

# Socket Configuration (Optional - auto-detects if not set)
NEXT_PUBLIC_SOCKET_URL=https://your-app-name.onrender.com

# Redis Configuration (Recommended for production)
REDIS_URL=redis://your-redis-host:6379

# NextAuth Configuration
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=your-secure-secret-key

# Database
DATABASE_URL=mongodb+srv://...
MONGODB_URI=mongodb+srv://...

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 2. Redis Setup (Recommended)
For production reliability, set up Redis:

#### Option A: Render Redis (Recommended)
1. In Render dashboard, create a new Redis instance
2. Copy the Redis URL
3. Add `REDIS_URL` to your environment variables

#### Option B: External Redis
1. Use Redis Cloud, Upstash, or another Redis provider
2. Add the connection URL to `REDIS_URL`

#### Option C: No Redis (Fallback)
The app will automatically fall back to in-memory storage if Redis is not available, but sessions will be lost on server restarts.

### 3. Build and Deploy
```bash
# Build the application
npm run build

# Start production server
npm start
```

### 4. Render Configuration
In your Render service settings:

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health` (if available) or `/`

### 5. Testing the Fix
After deployment:

1. **Host creates a session**:
   - Go to `/live/[sessionId]?is_host=true`
   - Should see "Mission Control" interface

2. **Guest joins session**:
   - Share the link: `https://your-app.onrender.com/live/[sessionId]`
   - Guest should see "Squadron Entry" or "Clearance Pending"
   - Host should receive the guest request in the "Pending Admission" section

3. **Host approves guest**:
   - Click the checkmark button next to the guest
   - Guest should be moved to "Active Squadron"
   - Both should remain connected

## Troubleshooting

### Guests Still Get Disconnected
1. Check browser console for WebSocket errors
2. Verify `NEXT_PUBLIC_SOCKET_URL` is correct
3. Check CSP headers in Network tab
4. Ensure Redis is accessible (if configured)

### Host Doesn't See Guest Requests
1. Check that both host and guest are using the same sessionId
2. Verify socket connection status in browser console
3. Check Redis connection logs in Render dashboard

### Sessions Lost on Restart
1. Verify Redis is properly configured
2. Check `REDIS_URL` environment variable
3. Look for Redis connection errors in logs

## Monitoring
Add these monitoring endpoints to your Render service:

- **Socket Connection Status**: Check browser console for `???? Socket Connected Successfully`
- **Redis Status**: Look for `???? Redis connected successfully` or fallback message
- **Session State**: Sessions should persist across server restarts with Redis

## Security Notes
- The app now allows WebSocket connections from the same origin
- CSP headers are configured for production security
- Redis connection should use authentication in production
- Always use HTTPS for production deployments

## Success Indicators
You'll know the fix is working when:
- Guests can join without immediate disconnection
- Hosts receive guest approval requests
- Sessions persist across server restarts (with Redis)
- No WebSocket connection errors in browser console
- Socket status shows "Connected" in console logs
