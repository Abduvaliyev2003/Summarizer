/**
 * Retrieves and decodes Laravel XSRF-TOKEN from browser document cookies.
 */
export function getXsrfTokenFromCookie(): string {
    const match = document.cookie.match(new RegExp('(^|; )XSRF-TOKEN=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
}
