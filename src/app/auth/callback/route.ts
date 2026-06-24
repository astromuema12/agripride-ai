import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const provider = searchParams.get('provider');
  const next = searchParams.get('next') ?? '/dashboard/farmer';
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${error}`);
  }

  if (provider) {
    return NextResponse.redirect(`${origin}/auth?oauth_success=${provider}`);
  }

  return NextResponse.redirect(`${origin}/auth`);
}
