"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Game.module.css';
import { isSameCell, isAdjacent } from '@/lib/gameLogic';
import { getUserId } from '@/lib/storage';

export default function Game({ puzzle, date }) {
    // State
    // userPath: [ {r,c}, {r,c}, ... ] ordered list of connected cells. starts with '1'.
    const [userPath, setUserPath] = useState([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [gameState, setGameState] = useState('idle'); // idle, playing, won
    const [timer, setTimer] = useState(0);

    const timerRef = useRef(null);
    const gridRef = useRef(null);

    // fixedNumbers initially from puzzle, but can handle updates (hints)
    const [visibleNumbers, setVisibleNumbers] = useState({});

    // Initialize
    useEffect(() => {
        if (puzzle && puzzle.fixedNumbers) {
            setVisibleNumbers(puzzle.fixedNumbers);

            // Check if already won
            if (typeof window !== 'undefined') {
                try {
                    const saved = localStorage.getItem('puzzle_history');
                    if (saved) {
                        const history = JSON.parse(saved);
                        if (history[date] && history[date].won) {
                            setGameState('won');
                            // Restore timer? Or just show 0 / done.
                            // Ideally we'd store the time too. 
                            // For now, if reloaded, treating as "Done" state.
                            // We can fetch rank data again if we want to show stats, 
                            // or just show "You solved it!"
                            // Let's at least show the modal.
                            setRankData({ percentile: 99 }); // Mock restore
                        }
                    }
                } catch (e) { }
            }

            // Find where '1' is
            let start = null;
            for (let key in puzzle.fixedNumbers) {
                if (puzzle.fixedNumbers[key] === 1) {
                    const [r, c] = key.split(',').map(Number);
                    start = { r, c };
                    break;
                }
            }
            if (start) {
                setUserPath([start]);
            }
        }
    }, [puzzle, date]);

    // Timer
    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => {
                setTimer(t => t + 0.1);
            }, 100);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState]);

    // Actions
    const handleHint = () => {
        if (gameState === 'won') return;

        // Reveal the immediate next number after the user's current tip
        const currentVal = userPath.length;
        const nextVal = currentVal + 1;

        if (nextVal > 36) return;

        // Find coordinates of nextVal in the solution path
        // puzzle.path is array of coords. index 0 is '1'.
        // so nextVal is at index nextVal - 1
        const nextCell = puzzle.path[nextVal - 1];
        const key = `${nextCell.r},${nextCell.c}`;

        // Add to visibleNumbers
        setVisibleNumbers(prev => ({
            ...prev,
            [key]: nextVal
        }));
    };

    // Helper: Get Fixed Number at pos
    const getFixedNumber = (r, c) => {
        // Check visibleNumbers
        return visibleNumbers[`${r},${c}`] || null;
    };

    // Get index in user path
    const getPathIndex = (r, c) => {
        return userPath.findIndex(p => isSameCell(p, { r, c }));
    };

    // Interaction
    const handleStart = (r, c) => {
        if (gameState === 'won') return;

        // Allow starting dragging from the TIP of the current path
        const tip = userPath[userPath.length - 1];
        if (tip && isSameCell(tip, { r, c })) {
            setIsDragActive(true);
            if (gameState === 'idle') setGameState('playing');
        }

        // Also allow clicking anywhere in path to cut?
        // "Undo" usually better button, but let's support tapping back.
        const idx = getPathIndex(r, c);
        if (idx !== -1 && idx < userPath.length - 1) {
            // Cut back to here
            setUserPath(prev => prev.slice(0, idx + 1));
            setIsDragActive(true); // resume dragging from here
        }
    };

    const handleMove = useCallback((e) => {
        if (!isDragActive || gameState === 'won') return;

        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            if (e.buttons !== 1) {
                setIsDragActive(false);
                return;
            }
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const el = document.elementFromPoint(clientX, clientY);
        if (!el) return;
        const cellEl = el.closest(`.${styles.cell}`);
        if (!cellEl) return;

        const r = parseInt(cellEl.dataset.r);
        const c = parseInt(cellEl.dataset.c);
        const target = { r, c };

        const tip = userPath[userPath.length - 1];
        if (isSameCell(tip, target)) return;

        // Validation Logic
        // 1. Must be adjacent
        if (!isAdjacent(tip, target)) return;

        // 2. Must not be in path already (unless it's the tip - handled above)
        // Check for Backtracking (erasing tip)
        const previous = userPath[userPath.length - 2];
        if (previous && isSameCell(target, previous)) {
            setUserPath(prev => prev.slice(0, -1));
            return;
        }

        if (userIdxInPath(target) !== -1) return; // Crossing self

        // 3. Logic for Fixed Numbers
        const targetFixed = getFixedNumber(r, c);
        const currentNum = userPath.length; // 1-based size = value of tip
        const nextNum = currentNum + 1;

        // If target cell has a fixed number:
        if (targetFixed !== null) {
            // Only allowed if it IS the next number
            if (targetFixed === nextNum) {
                // Valid connect!
                appendPath(target);
            } else {
                // Invalid connect (skipping or wrong order)
                // Block move
                return;
            }
        } else {
            // Empty cell. Allowed.
            // BUT check if we are "skipping over" a required fixed number elsewhere?
            // Check if we are improperly covering a HIDDEN fixed number?
            // No, if it's hidden (in solution but not in visibleNumbers),
            // we allow user to overwrite it (incorrectly).
            // Standard game: You can make mistakes.
            // BUT, if we walk onto a cell that is ACTUALLY '20' (hidden) when we are at '5',
            // allow it? Yes. User will get stuck later.

            appendPath(target);
        }

    }, [isDragActive, gameState, userPath, visibleNumbers, puzzle]);

    const userIdxInPath = (cell) => userPath.findIndex(p => isSameCell(p, cell));

    const appendPath = (cell) => {
        const newPath = [...userPath, cell];
        setUserPath(newPath);

        // Check Win
        if (newPath.length === 36) { // 6x6
            // Double check last number is 36 (it should be if logic holds)
            setGameState('won');
            submitResult();
        }
    };

    const handleEnd = () => {
        setIsDragActive(false);
    };

    const handleUndo = () => {
        if (gameState === 'won') return;
        if (userPath.length > 1) {
            setUserPath(prev => prev.slice(0, -1));
        }
    };

    const [rankData, setRankData] = useState(null);

    const submitResult = async () => {
        const userId = getUserId();
        try {
            const res = await fetch('/api/play', {
                method: 'POST',
                body: JSON.stringify({
                    date,
                    moves: 0,
                    time: timer.toFixed(1),
                    userId,
                    won: true
                })
            });
            const data = await res.json();
            setRankData(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        return () => {
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
        };
    }, [handleMove]);

    // SVG Helpers
    // 6x6 grid. Assuming roughly same screen width constraints, cells slightly smaller?
    // Let's use 48px or 50px cell size for 6 cols. 320px width / 6 ~ 53px.
    // CSS defines 56px currently (5 cols).
    // Need to adjust global css or component css for 6 cols.
    const GAP = 4;
    const CELL = 48; // Smaller for 6x6
    const OFFSET = GAP + CELL / 2;
    const STEP = CELL + GAP;
    const getCoord = (idx) => OFFSET + idx * STEP;

    // Points excluding the fixed ones? No, draw full path.
    // Actually, standard Zip game draws line through EVERYTHING.
    const points = userPath.map(p => `${getCoord(p.c)},${getCoord(p.r)}`).join(' ');

    return (
        <div className={styles.container}>
            <div className={styles.headerBar}>
                <div className={styles.timer}>{timer.toFixed(1)}s</div>
                <div className={styles.actions}>
                    <button className={styles.undoBtn} onClick={handleUndo}>Undo</button>
                    <button className={styles.hintBtn} onClick={handleHint}>Hint</button>
                </div>
            </div>

            <div className={styles.gridWrapper}>
                <div className={styles.grid6} ref={gridRef}>
                    {/* SVG Overlay */}
                    <svg className={styles.svgOverlay}>
                        <polyline
                            points={points}
                            fill="none"
                            stroke="#0A66C2"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.5"
                        />
                    </svg>

                    {Array.from({ length: 36 }).map((_, i) => {
                        const r = Math.floor(i / 6);
                        const c = i % 6;
                        const pathIdx = getPathIndex(r, c);
                        const isPath = pathIdx !== -1;
                        const fixedNum = getFixedNumber(r, c);
                        const numToDisplay = fixedNum || (isPath ? pathIdx + 1 : null);

                        const isTip = isPath && pathIdx === userPath.length - 1;
                        const isNextTarget = !isPath && fixedNum === userPath.length + 1;

                        return (
                            <div
                                key={`${r}-${c}`}
                                className={`${styles.cell} ${isPath ? styles.cellActive : ''}`}
                                data-r={r}
                                data-c={c}
                                onMouseDown={() => handleStart(r, c)}
                                onTouchStart={(e) => handleStart(r, c)}
                            >
                                {numToDisplay && (
                                    <span className={`${styles.number} ${fixedNum ? styles.fixed : ''}`}>
                                        {numToDisplay}
                                    </span>
                                )}
                                {isNextTarget && <div className={styles.nextIndicator} />}
                                {isTip && <div className={styles.tipRing} />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {(gameState === 'won') && rankData && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Sequence Complete!</h2>
                        <div className={styles.statsRow}>
                            <div className={styles.finalStat}>
                                <span className={styles.fsLabel}>Time</span>
                                <span className={styles.fsValue}>{timer.toFixed(1)}s</span>
                            </div>
                        </div>
                        <div className={styles.rankInfo}>
                            Top <strong>{rankData.percentile}%</strong>
                        </div>
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Daily Zip\n⏱ ${timer.toFixed(1)}s\n📅 ${date}\n${window.location.origin}/daily/${date}`)}`}
                            target="_blank"
                            className={styles.shareButton}
                        >
                            Share on WhatsApp
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
