import { NextResponse } from 'next/server';

export async function GET() {
    // Mock leaderboard data
    const data = Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        time: (10 + Math.random() * 20).toFixed(1),
        moves: Math.floor(15 + Math.random() * 10)
    }));

    return NextResponse.json(data);
}
