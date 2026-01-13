import { NextResponse } from 'next/server';
import { generatePuzzle } from '@/lib/gameLogic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const puzzle = generatePuzzle(date);
    return NextResponse.json(puzzle);
}
