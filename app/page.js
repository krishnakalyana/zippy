"use client";

import Link from 'next/link';
import { getTodayDate, formatDateDisplay } from '@/lib/utils';
import styles from './page.module.css';

export default function Home() {
    const today = getTodayDate();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Daily Path</h1>
                <p className={styles.subtitle}>Connect the dots. Every day.</p>
            </header>

            <div className={styles.card}>
                <h2>Today's Puzzle</h2>
                <p>{formatDateDisplay(today)}</p>
                <Link href={`/daily/${today}`} className={styles.playButton}>
                    Play Now
                </Link>
            </div>

            <div className={styles.rules}>
                <h3>How to Play</h3>
                <ul>
                    <li>Connect <strong>1</strong> to <strong>36</strong> in order.</li>
                    <li>Fill <strong>every cell</strong> in the grid.</li>
                    <li>Follow the sequence (1-2-3...).</li>
                    <li>Use <strong>Hint</strong> if you get stuck.</li>
                    <li>Try to beat the timer!</li>
                </ul>
            </div>
        </div>
    );
}
