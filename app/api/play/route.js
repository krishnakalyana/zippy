import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();
    const { date, moves, time, userId } = body;

    // In a real app, validat e the solution here

    // Mock rank generation
    const rank = Math.floor(Math.random() * 500) + 1;
    const percentile = Math.floor(Math.random() * 100);

    return NextResponse.json({
        success: true,
        rank,
        percentile
    });
}
