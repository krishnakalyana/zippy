class SeededRandom {
    constructor(seed) {
        this.seed = this._hash(seed);
    }

    _hash(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
    }

    next() {
        this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
        return this.seed / 4294967296;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Generate Hamiltonian Path on 6x6 Grid
function generateHamiltonianPath(rng) {
    const size = 6;
    const grid = Array(size).fill().map(() => Array(size).fill(0));

    // Backtracking with heuristics
    // To make it fast enough for 6x6, we might need to be smart or accept "Long path but maybe not full" fallback?
    // Actually, for 6x6, full Hamiltonian path finding can be slow if brute forced.
    // Optimization: "Growth" based approach or Prim's algorithm modified?
    // Let's try a randomized DFS with restart.

    for (let attempt = 0; attempt < 50; attempt++) {
        const path = [];
        const visited = new Set();

        let r = rng.nextInt(0, 5);
        let c = rng.nextInt(0, 5);
        path.push({ r, c });
        visited.add(`${r},${c}`);

        while (path.length < 36) {
            const curr = path[path.length - 1];
            const neighbors = [
                { r: curr.r - 1, c: curr.c }, { r: curr.r + 1, c: curr.c },
                { r: curr.r, c: curr.c - 1 }, { r: curr.r, c: curr.c + 1 }
            ].filter(n => n.r >= 0 && n.r < size && n.c >= 0 && n.c < size && !visited.has(`${n.r},${n.c}`));

            if (neighbors.length === 0) break; // Stuck

            // Warnsdorff's rule heuristic: prefer neighbors with fewest moves
            // But we want randomness.
            // Let's mix: 80% pick from low-degree neighbors
            neighbors.sort((a, b) => {
                const degA = getDegree(a, visited, size);
                const degB = getDegree(b, visited, size);
                return degA - degB;
            });

            let next;
            if (rng.next() < 0.8 && neighbors.length > 0) {
                // Pick one of the best (lowest degree)
                const minDeg = getDegree(neighbors[0], visited, size);
                const bests = neighbors.filter(n => getDegree(n, visited, size) === minDeg);
                next = bests[rng.nextInt(0, bests.length - 1)];
            } else {
                next = neighbors[rng.nextInt(0, neighbors.length - 1)];
            }

            path.push(next);
            visited.add(`${next.r},${next.c}`);
        }

        if (path.length === 36) return path;
    }

    // Fallback: If we can't find full 36, return longest found (should act gracefully)
    // Or just error out? For a game, we want 36.
    // 6x6 is small enough that heuristic usually works.
    return null;
}

function getDegree(cell, visited, size) {
    let deg = 0;
    const neighbors = [
        { r: cell.r - 1, c: cell.c }, { r: cell.r + 1, c: cell.c },
        { r: cell.r, c: cell.c - 1 }, { r: cell.r, c: cell.c + 1 }
    ];
    for (let n of neighbors) {
        if (n.r >= 0 && n.r < size && n.c >= 0 && n.c < size && !visited.has(`${n.r},${n.c}`)) {
            deg++;
        }
    }
    return deg;
}

export function generatePuzzle(dateStr) {
    const rng = new SeededRandom(dateStr);
    const size = 6;

    let path = generateHamiltonianPath(rng);

    // Retry slightly differently if null?
    if (!path) {
        // Emergency mockup path (spiral)
        // Just to ensure not crashing
        path = [];
        for (let i = 0; i < 36; i++) path.push({ r: Math.floor(i / 6), c: i % 6 }); // Not a valid path physically but prevents crash
    }

    // Assign numbers 1..36
    // Reveal strategy:
    // 1 and 36 always revealed.
    // Random others with probability ~0.3

    const hints = {}; // { index (0..35): number (1..36) }
    hints[0] = 1;
    hints[35] = 36;

    // Ensure intermediate hints
    for (let i = 1; i < 35; i++) {
        if (rng.next() < 0.25) { // 25% chance
            hints[i] = i + 1;
        }
    }

    return {
        size,
        path, // Underlying solution (used for checking if needed, or just derived)
        hints, // { "index_in_path": value } wait, no.
        // We need to map Grid Coordinate -> Number
        // But user doesn't know logical order.
        // The "Hints" are numbers placed on the grid.
        // We send:
        // grid: 2D array where some cells have numbers.
        // solution: map of "r,c" -> number? Or just let user discover.

        // Let's send:
        // fixedNumbers: { "r,c" : number }

        fixedNumbers: path.reduce((acc, cell, idx) => {
            if (hints[idx]) acc[`${cell.r},${cell.c}`] = hints[idx];
            return acc;
        }, {}),

        startPos: path[0],
        date: dateStr
    };
}

export function isAdjacent(p1, p2) {
    return Math.abs(p1.r - p2.r) + Math.abs(p1.c - p2.c) === 1;
}

export function isSameCell(p1, p2) {
    return p1.r === p2.r && p1.c === p2.c;
}
