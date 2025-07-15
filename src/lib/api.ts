import { supabase } from './supabase';

/**
 * Makes an authenticated API request with proper headers
 */
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

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Makes an authenticated API request and returns JSON
 */
export async function makeAuthenticatedJsonRequest<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await makeAuthenticatedRequest(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}