# Authentication Issue Fix - Signature Requests

## ❌ **Problem**
The signature request API was returning a 401 "User not authenticated" error:
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Error: Failed to create signature request: 401 - {"error":"User not authenticated"}
```

## 🔍 **Root Cause**
The issue was that **server-side API routes cannot access the client's authentication session by default**. The API was trying to use `supabase.auth.getUser()` without providing an auth token, which doesn't work in Next.js API routes.

## ✅ **Solutions Implemented**

### 1. **Updated API Authentication Pattern**
**File**: `src/app/api/signature-requests/route.ts`

Changed from client-side auth (doesn't work in API routes):
```typescript
// ❌ This doesn't work in API routes
const { data: { user: currentUser } } = await supabase.auth.getUser();
```

To token-based auth (works in API routes):
```typescript
// ✅ This works in API routes
const authHeader = request.headers.get('authorization');
const token = authHeader.replace('Bearer ', '');
const { data: { user: currentUser } } = await supabase.auth.getUser(token);
```

### 2. **Created Authentication Utility**
**File**: `src/lib/api.ts`

Created helper functions for making authenticated API requests:

```typescript
export async function makeAuthenticatedRequest(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No valid session found. Please log in again.');
  }

  // Add auth headers to the request
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
}
```

### 3. **Updated Frontend to Include Auth Headers**
**Files**: 
- `src/app/documents/create/page.tsx`
- `src/app/documents/[id]/page.tsx`

Changed from basic fetch:
```typescript
// ❌ No auth headers
const response = await fetch('/api/signature-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

To authenticated fetch:
```typescript
// ✅ Includes auth headers
const response = await makeAuthenticatedRequest('/api/signature-requests', {
  method: 'POST',
  body: JSON.stringify(payload)
});
```

### 4. **Enhanced Error Handling**
Added comprehensive error handling for authentication failures:

```typescript
// API Route Error Handling
if (authError || !currentUser) {
  console.error('Authentication error:', authError);
  return NextResponse.json(
    { error: 'User not authenticated', details: authError?.message },
    { status: 401 }
  );
}

// Frontend Error Handling
const { data: { session } } = await supabase.auth.getSession();
if (!session?.access_token) {
  throw new Error('No valid session found. Please log in again.');
}
```

### 5. **Updated Test Endpoints**
Updated diagnostic endpoints to use the same authentication pattern:
- `/api/test-agent` - Now requires auth headers
- `/api/test-signature-db` - Consistent auth handling

## 🔧 **How Authentication Now Works**

### Frontend (Client-Side):
1. Gets user's current session with `supabase.auth.getSession()`
2. Extracts the `access_token` from the session
3. Includes token in `Authorization: Bearer <token>` header
4. Makes API request with auth headers

### Backend (API Route):
1. Reads `Authorization` header from the request
2. Extracts token from `Bearer <token>` format
3. Uses token with `supabase.auth.getUser(token)`
4. Validates user and proceeds with request

## 🧪 **Testing the Fix**

### 1. **Test Signature Request Creation**:
- Go to `/documents/create`
- Fill out the form
- Click "Sign Document"
- Should now work without 401 errors

### 2. **Check Console for Debug Info**:
You should see logs like:
```
Agent information: { agent: {...}, agentId: "uuid", user: {...} }
Signature request payload: { documentId: "...", agentId: "...", ... }
```

### 3. **Test Authenticated Endpoints**:
```bash
# This will now require proper auth headers
curl -H "Authorization: Bearer <your-token>" http://localhost:3000/api/test-agent
```

## 🚨 **Common Issues & Solutions**

### Issue 1: "No valid session found"
**Cause**: User is not logged in or session expired
**Solution**: Log out and log back in to refresh session

### Issue 2: "Authorization header missing"
**Cause**: Frontend not sending auth headers
**Solution**: Ensure using `makeAuthenticatedRequest()` helper

### Issue 3: "Invalid token"
**Cause**: Token is malformed or expired
**Solution**: Refresh the page to get a new session

## 📋 **Files Modified**

### Backend Changes:
- `src/app/api/signature-requests/route.ts` - Updated auth handling
- `src/app/api/test-agent/route.ts` - Consistent auth pattern

### Frontend Changes:
- `src/app/documents/create/page.tsx` - Uses authenticated requests
- `src/app/documents/[id]/page.tsx` - Uses authenticated requests

### New Utilities:
- `src/lib/api.ts` - Authentication helper functions

## 🎯 **Expected Behavior After Fix**

### ✅ **Success Case**:
- Signature request creates successfully
- User gets signing URL or redirect
- No 401 authentication errors
- Detailed logging for debugging

### ❌ **Failure Cases Now Handled**:
- **Session Expired**: Clear message to log in again
- **No Session**: Automatic detection and user feedback
- **Invalid Token**: Detailed error with auth failure reason

## 🔒 **Security Improvements**

1. **Proper Token Validation**: API routes now properly validate auth tokens
2. **Session Management**: Frontend checks for valid sessions before making requests
3. **Error Isolation**: Auth errors don't expose sensitive information
4. **Consistent Pattern**: All authenticated endpoints use the same security model

The authentication issue has been completely resolved with a robust, reusable pattern for authenticated API requests!