import { generatePuzzle } from '@/lib/gameLogic';
import Game from '@/components/Game';
import styles from '@/app/page.module.css'; // Reuse basic styles for header if needed, or inline

export async function generateMetadata({ params }) {
    return {
        title: `Daily Puzzle - ${params.date}`,
    };
}

export default function DailyPage({ params }) {
    const puzzle = generatePuzzle(params.date);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <header style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4F46E5' }}>Daily Path</h1>
                <p style={{ color: '#666' }}>{params.date}</p>
            </header>

            <Game puzzle={puzzle} date={params.date} />
        </div>
    );
}
