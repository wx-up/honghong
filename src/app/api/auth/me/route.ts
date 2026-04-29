import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'honeymoon-simulator-secret-key-2024';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
    };

    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.userId,
        username: decoded.username,
      }
    });

  } catch (error) {
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
}
