export function getTodayDate() {
    const d = new Date();
    // Adjust for timezone if needed, but UTC date is safer for consistent daily puzzles
    // Or use locale date. Let's stick to YYYY-MM-DD.
    return d.toISOString().split('T')[0];
}

export function formatDateDisplay(dateStr) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
