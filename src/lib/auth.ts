// Nanny's phone number — gates access to the admin (nanny) mode.
// MVP: no real auth, just a shared-secret check against this constant.
export const NANNY_PHONE = '+998949550279';

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s()-]/g, '');
}

const SESSION_KEY = 'nanya_nanny_session';

export function isNannySession(): boolean {
  return localStorage.getItem(SESSION_KEY) === '1';
}

export function tryNannyLogin(phone: string): boolean {
  const ok = normalizePhone(phone) === normalizePhone(NANNY_PHONE);
  if (ok) localStorage.setItem(SESSION_KEY, '1');
  return ok;
}

export function nannyLogout(): void {
  localStorage.removeItem(SESSION_KEY);
}
