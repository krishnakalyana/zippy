import { generateUUID } from './utils';

const USER_ID_KEY = 'puzzle_user_id';

export function getUserId() {
    if (typeof window === 'undefined') return null;
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
        id = generateUUID();
        localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
}

export function saveGameResult(date, result) {
    if (typeof window === 'undefined') return;
    const history = JSON.parse(localStorage.getItem('puzzle_history') || '{}');
    history[date] = result;
    localStorage.setItem('puzzle_history', JSON.stringify(history));
}

export function getGameResult(date) {
    if (typeof window === 'undefined') return null;
    const history = JSON.parse(localStorage.getItem('puzzle_history') || '{}');
    return history[date];
}
