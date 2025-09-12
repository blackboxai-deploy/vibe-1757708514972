import { NextRequest, NextResponse } from 'next/server';

interface DinstarConfig {
  baseUrl: string;
  port: number;
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseUrl, port, username, password }: DinstarConfig = body;

    if (!baseUrl || !port || !username || !password) {
      return NextResponse.json({
        success: false,
        message: 'Missing required configuration parameters'
      }, { status: 400 });
    }

    // Test connection to Dinstar gateway using login API
    const loginUrl = `${baseUrl}:${port}/api/login`;
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Connection failed: HTTP ${response.status}`
      }, { status: 500 });
    }

    const result = await response.json();

    if (result.result === 'ok' && result.token) {
      return NextResponse.json({
        success: true,
        message: 'Connection successful',
        data: {
          token: result.token,
          gateway_version: result.gateway_version || 'Unknown'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.reason || 'Authentication failed'
      }, { status: 401 });
    }

  } catch (error: any) {
    console.error('Dinstar connection test error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        message: 'Connection timeout - check gateway IP and port'
      }, { status: 408 });
    }

    return NextResponse.json({
      success: false,
      message: `Connection error: ${error.message}`
    }, { status: 500 });
  }
}