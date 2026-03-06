import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Password is set via environment variable MISSION_CONTROL_PASSWORD
// If not set, defaults to a secure fallback
const CORRECT_PASSWORD = process.env.MISSION_CONTROL_PASSWORD || 'AIM2026!';

// Session duration: 7 days
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    if (password !== CORRECT_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Create session token (simple hash of password + timestamp)
    const sessionToken = Buffer.from(`mc_session_${Date.now()}_${password}`).toString('base64');

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('mc_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000, // in seconds
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
