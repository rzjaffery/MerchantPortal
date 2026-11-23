// src/utils/dateTime.ts
// Every date and time format used in the app, in one place.

// Adds a leading zero: 7 becomes "07".
function pad(value: number): string {
    return String(value).padStart(2, '0');
}

// The format the server uses: 20261120105130
// (year, month, day, hour, minute, second, with nothing between them).
export function toServerDateTime(date: Date): string {
    return (
        `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
        `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
    );
}

// Reads the server format back into a date.
// "20261120105130" becomes 20 November 2026, 10:51:30.
// Returns null when the text isn't in that format.
export function parseServerDateTime(text: string): Date | null {
    const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(
        text.trim()
    );

    if (!match) {
        return null;
    }

    const [, year, month, day, hour, minute, second] = match.map(Number);

    // Months start at 0 in JavaScript: January is 0, December is 11.
    const date = new Date(year, month - 1, day, hour, minute, second);

    return Number.isNaN(date.getTime()) ? null : date;
}

// The format people read: 2026-11-20 10:51:30
// Shows "—" when there is no date.
export function formatDateTime(date: Date | null): string {
    if (!date || Number.isNaN(date.getTime())) {
        return '—';
    }

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}

// Shortcut: turns the server format straight into the readable one.
// "20261120105130" becomes "2026-11-20 10:51:30".
export function formatServerDateTime(text: string): string {
    return formatDateTime(parseServerDateTime(text));
}