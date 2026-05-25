import { renderHook } from '@testing-library/react-native';
import { useRequireAuth, getPostLoginRedirect } from '../useRequireAuth';
import { Role } from '@/core/auth/AuthContext';

// sessionStorage mock (not available in React Native test env)
const mockSessionStore: Record<string, string> = {};
Object.defineProperty(globalThis, 'sessionStorage', {
  value: {
    getItem: jest.fn((key: string) => mockSessionStore[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { mockSessionStore[key] = value; }),
    removeItem: jest.fn((key: string) => { delete mockSessionStore[key]; }),
    clear: jest.fn(() => { Object.keys(mockSessionStore).forEach(k => delete mockSessionStore[k]); }),
  },
  writable: true,
  configurable: true,
});

// --- Mocks ---

const mockReplace = jest.fn();
let mockPathnameValue = '/models';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathnameValue,
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require('@/hooks/useAuth');

const LOGIN_REDIRECT_KEY = 'ipu_login_redirect';

const DEFAULT_AUTH = {
  isLoading: false,
  user: { id: 'user-001', email: 'test@test.com' },
  profile: { role: 'admin' as Role, active: true, name: 'Test' },
};

// --- Tests: useRequireAuth ---

describe('useRequireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockPathnameValue = '/models';
  });

  describe('loading states', () => {
    it('should not redirect while auth is loading', () => {
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, isLoading: true });

      const { result } = renderHook(() => useRequireAuth());

      expect(mockReplace).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthorized).toBe(false);
    });

    it('should not redirect while checking cache', () => {
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, user: null, profile: null });

      const { result } = renderHook(() => useRequireAuth('viewer', { isCheckingCache: true }));

      expect(mockReplace).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthorized).toBe(false);
    });
  });

  describe('offline access', () => {
    it('should allow access when no user but canAccessOffline is true', () => {
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, user: null, profile: null });

      const { result } = renderHook(() => useRequireAuth('viewer', { canAccessOffline: true }));

      expect(mockReplace).not.toHaveBeenCalled();
      expect(result.current.isAuthorized).toBe(false);
    });

    it('should not redirect when canAccessOffline is true even with checkingCache false', () => {
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, user: null, profile: null });

      const { result } = renderHook(() =>
        useRequireAuth('viewer', { canAccessOffline: true, isCheckingCache: false })
      );

      expect(mockReplace).not.toHaveBeenCalled();
      expect(result.current.isAuthorized).toBe(false);
    });
  });

  describe('unauthenticated redirect', () => {
    it('should redirect to /login when no user and no offline access', () => {
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, user: null, profile: null });

      renderHook(() => useRequireAuth());

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('should save current path to sessionStorage before redirect', () => {
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, user: null, profile: null });

      renderHook(() => useRequireAuth());

      expect(sessionStorage.getItem(LOGIN_REDIRECT_KEY)).toBe('/models');
    });

    it('should NOT save /login path to sessionStorage', () => {
      mockPathnameValue = '/login';
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, user: null, profile: null });

      renderHook(() => useRequireAuth());

      expect(sessionStorage.getItem(LOGIN_REDIRECT_KEY)).toBeNull();
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('should redirect to /login for any minRole when unauthenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, user: null, profile: null });

      renderHook(() => useRequireAuth('admin'));

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  describe('suspended account', () => {
    it('should redirect to /suspended when profile is not active', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...DEFAULT_AUTH,
        profile: { role: 'viewer' as Role, active: false, name: 'Suspended' },
      });

      renderHook(() => useRequireAuth());

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/suspended');
      expect(mockReplace).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('role-based access', () => {
    it('should redirect to /unauthorized when role is below minimum', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...DEFAULT_AUTH,
        profile: { role: 'viewer' as Role, active: true, name: 'Viewer' },
      });

      renderHook(() => useRequireAuth('editor'));

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/unauthorized');
    });

    it('should allow access when role equals minimum', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...DEFAULT_AUTH,
        profile: { role: 'editor' as Role, active: true, name: 'Editor' },
      });

      const { result } = renderHook(() => useRequireAuth('editor'));

      expect(mockReplace).not.toHaveBeenCalled();
      expect(result.current.isAuthorized).toBe(true);
    });

    it('should allow access when role exceeds minimum', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...DEFAULT_AUTH,
        profile: { role: 'admin' as Role, active: true, name: 'Admin' },
      });

      const { result } = renderHook(() => useRequireAuth('viewer'));

      expect(mockReplace).not.toHaveBeenCalled();
      expect(result.current.isAuthorized).toBe(true);
    });

    it('should return isAuthorized false when user is null', () => {
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, user: null, profile: null });

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current.isAuthorized).toBe(false);
    });

    it('should return isAuthorized false when profile is inactive', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...DEFAULT_AUTH,
        profile: { role: 'admin' as Role, active: false, name: 'Admin' },
      });

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current.isAuthorized).toBe(false);
    });
  });

  describe('isAuthorized return value', () => {
    it('should be false when isLoading is true', () => {
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, isLoading: true });

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current.isAuthorized).toBe(false);
    });

    it('should be true when user and active profile exist', () => {
      (useAuth as jest.Mock).mockReturnValue(DEFAULT_AUTH);

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current.isAuthorized).toBe(true);
    });

    it('should return isLoading as true when auth is loading', () => {
      (useAuth as jest.Mock).mockReturnValue({ ...DEFAULT_AUTH, isLoading: true });

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current.isLoading).toBe(true);
    });
  });
});

// --- Tests: getPostLoginRedirect ---

describe('getPostLoginRedirect', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should return saved path when one exists and is not /login', () => {
    sessionStorage.setItem(LOGIN_REDIRECT_KEY, '/models');

    const result = getPostLoginRedirect('viewer');

    expect(result).toBe('/models');
  });

  it('should clear saved path after reading it', () => {
    sessionStorage.setItem(LOGIN_REDIRECT_KEY, '/admin');

    getPostLoginRedirect('admin');

    expect(sessionStorage.getItem(LOGIN_REDIRECT_KEY)).toBeNull();
  });

  it('should ignore saved path if it is /login', () => {
    sessionStorage.setItem(LOGIN_REDIRECT_KEY, '/login');

    const result = getPostLoginRedirect('viewer');

    expect(result).toBe('/models');
  });

  it('should return /admin for admin role when no saved path', () => {
    const result = getPostLoginRedirect('admin');

    expect(result).toBe('/admin');
  });

  it('should return /models for editor role when no saved path', () => {
    const result = getPostLoginRedirect('editor');

    expect(result).toBe('/models');
  });

  it('should return /models for viewer role when no saved path', () => {
    const result = getPostLoginRedirect('viewer');

    expect(result).toBe('/models');
  });

  it('should return /models when no role is provided and no saved path', () => {
    const result = getPostLoginRedirect();

    expect(result).toBe('/models');
  });

  it('should recover from sessionStorage throwing and fallback to default', () => {
    (globalThis.sessionStorage.getItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Storage error');
    });

    const result = getPostLoginRedirect('editor');

    expect(result).toBe('/models');
  });
});
