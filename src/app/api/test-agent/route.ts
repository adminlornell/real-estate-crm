import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authorization header missing',
        hint: 'Make sure you are logged in and the request includes auth headers'
      });
    }

    // Get current user with token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated',
        userError: userError?.message
      });
    }

    // Get agent record for this user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (agentError) {
      return NextResponse.json({
        success: false,
        user: {
          id: user.id,
          email: user.email
        },
        agentError: {
          message: agentError.message,
          code: agentError.code,
          details: agentError.details
        },
        agent: null
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      agent: {
        id: agent.id,
        user_id: agent.user_id,
        agent_name: agent.agent_name,
        email: agent.email
      },
      relationship: {
        userIdMatches: user.id === agent.user_id,
        agentExists: !!agent.id
      }
    });

  } catch (error) {
    console.error('Test agent endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: (error as any)?.message || 'Unknown error'
    }, { status: 500 });
  }
}