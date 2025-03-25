
export const LOGIN = '/signin';
export const ROOT = '/';

export const PUBLIC_ROUTES = [
    '/signin',
    '/api/auth/callback/google',
    '/forgot-password',
    '/reset-password',
    '/emailVerification/success',
    '/emailVerification/error',
]

export const PROTECTED_SUB_ROUTES = [
    '/(authenticated)',
]