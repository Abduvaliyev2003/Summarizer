/**
 * Formats a date string into a localized readable string.
 */
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Formats a date string with time (e.g. "Aug 8, 15:30").
 */
export function formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Formats price/amount into currency format (e.g. "$19").
 */
export function formatPrice(amount: number | string | null | undefined, currency: string = 'USD'): string {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numericAmount);
}
