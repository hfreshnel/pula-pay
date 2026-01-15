export function sanitizeCountryCode(code: string): string {
    return code.startsWith('+') ? code.slice(1) : code;
}

export function sanitizePhoneNumber(phone: string): string {
    return phone.replace(/\s+/g, '');
}