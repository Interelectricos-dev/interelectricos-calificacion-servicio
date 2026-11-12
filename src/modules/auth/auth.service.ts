'use client';

const ADMIN_STORAGE_KEY = 'ie_admin_session_token';
const DEFAULT_ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234';

export class AdminAuthService {
  /**
   * Valida si el PIN ingresado es correcto
   */
  loginWithPin(pin: string): boolean {
    if (typeof window === 'undefined') return false;

    if (pin.trim() === DEFAULT_ADMIN_PIN) {
      const sessionData = {
        authenticated: true,
        timestamp: Date.now(),
      };
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(sessionData));
      return true;
    }
    return false;
  }

  /**
   * Verifica si hay una sesión activa válida
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return Boolean(data && data.authenticated);
    } catch {
      return false;
    }
  }

  /**
   * Cierra la sesión
   */
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  }
}

export const adminAuthService = new AdminAuthService();

