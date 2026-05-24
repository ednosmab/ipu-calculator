import { render, fireEvent, waitFor } from '@testing-library/react-native';

// sessionStorage mock
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

// --- Mocks (must be before imports) ---

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
}));

const mockUseAuth = jest.fn(() => ({
  signIn: jest.fn(),
  profile: null,
  isLoading: false,
  user: null,
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseNetworkStatus = jest.fn(() => true);

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

const mockGetAll = jest.fn();

jest.mock('@/features/models/infra/modelRepository', () => ({
  modelRepository: {
    getAll: () => mockGetAll(),
  },
}));

// Must import after mocks are set up
import LoginScreen from '../../app/login';

const LOGIN_REDIRECT_KEY = 'ipu_login_redirect';
const OFFLINE_ACCESS_KEY = 'ipu_offline_access';

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      profile: null,
      isLoading: false,
      user: null,
    });
    mockUseNetworkStatus.mockReturnValue(true);
    mockGetAll.mockResolvedValue([]);
  });

  it('renders email, password inputs and submit button', () => {
    const { getByTestId } = render(<LoginScreen />);

    expect(getByTestId('login-email-input')).toBeTruthy();
    expect(getByTestId('login-password-input')).toBeTruthy();
    expect(getByTestId('login-submit-button')).toBeTruthy();
  });

  describe('offline button visibility', () => {
    it('shows offline button when disconnected and cache exists', async () => {
      mockUseNetworkStatus.mockReturnValue(false);
      mockGetAll.mockResolvedValue([{ id: 'm1', name: 'Model' }]);

      const { findByText } = render(<LoginScreen />);

      expect(await findByText('Acessar Offline (Cache)')).toBeTruthy();
    });

    it('hides offline button when online even with cache', async () => {
      mockUseNetworkStatus.mockReturnValue(true);
      mockGetAll.mockResolvedValue([{ id: 'm1', name: 'Model' }]);

      const { queryByText } = render(<LoginScreen />);

      await waitFor(() => {
        expect(queryByText('Acessar Offline (Cache)')).toBeNull();
      });
    });

    it('hides offline button when disconnected but no cache', async () => {
      mockUseNetworkStatus.mockReturnValue(false);
      mockGetAll.mockResolvedValue([]);

      const { queryByText } = render(<LoginScreen />);

      await waitFor(() => {
        expect(queryByText('Acessar Offline (Cache)')).toBeNull();
      });
    });

    it('hides offline button when network status is null (checking)', async () => {
      mockUseNetworkStatus.mockReturnValue(null);
      mockGetAll.mockResolvedValue([{ id: 'm1', name: 'Model' }]);

      const { queryByText } = render(<LoginScreen />);

      await waitFor(() => {
        expect(queryByText('Acessar Offline (Cache)')).toBeNull();
      });
    });
  });

  describe('offline access flow', () => {
    it('sets sessionStorage flag and navigates to /models on offline access', async () => {
      mockUseNetworkStatus.mockReturnValue(false);
      mockGetAll.mockResolvedValue([{ id: 'm1', name: 'Model' }]);

      const { findByText } = render(<LoginScreen />);
      fireEvent.press(await findByText('Acessar Offline (Cache)'));

      expect(sessionStorage.getItem(OFFLINE_ACCESS_KEY)).toBe('true');
      expect(mockReplace).toHaveBeenCalledWith('/models');
    });
  });

  describe('login flow', () => {
    it('shows validation error when email is empty', () => {
      const { getByTestId, getByText } = render(<LoginScreen />);

      fireEvent.press(getByTestId('login-submit-button'));

      expect(getByText('Preencha e-mail e senha.')).toBeTruthy();
    });

    it('shows validation error when password is empty', () => {
      const { getByTestId, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByTestId('login-email-input'), 'user@test.com');
      fireEvent.press(getByTestId('login-submit-button'));

      expect(getByText('Preencha e-mail e senha.')).toBeTruthy();
    });

    it('calls signIn and redirects on successful login', async () => {
      const mockSignIn = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        profile: { role: 'editor' },
        isLoading: false,
        user: null,
      });

      const { getByTestId } = render(<LoginScreen />);

      fireEvent.changeText(getByTestId('login-email-input'), 'user@test.com');
      fireEvent.changeText(getByTestId('login-password-input'), 'password123');
      fireEvent.press(getByTestId('login-submit-button'));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'password123');
        expect(mockReplace).toHaveBeenCalledWith('/models');
      });
    });

    it('redirects to /admin when admin logs in without saved redirect', async () => {
      const mockSignIn = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        profile: { role: 'admin' },
        isLoading: false,
        user: null,
      });

      const { getByTestId } = render(<LoginScreen />);

      fireEvent.changeText(getByTestId('login-email-input'), 'admin@test.com');
      fireEvent.changeText(getByTestId('login-password-input'), 'admin123');
      fireEvent.press(getByTestId('login-submit-button'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin');
      });
    });

    it('redirects to saved path when one exists after login', async () => {
      sessionStorage.setItem(LOGIN_REDIRECT_KEY, '/models');
      const mockSignIn = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        profile: { role: 'admin' },
        isLoading: false,
        user: null,
      });

      const { getByTestId } = render(<LoginScreen />);

      fireEvent.changeText(getByTestId('login-email-input'), 'user@test.com');
      fireEvent.changeText(getByTestId('login-password-input'), 'pass123');
      fireEvent.press(getByTestId('login-submit-button'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/models');
      });
    });

    it('displays INVALID_CREDENTIALS error message', async () => {
      const mockSignIn = jest.fn().mockRejectedValue(new Error('INVALID_CREDENTIALS'));
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        profile: null,
        isLoading: false,
        user: null,
      });

      const { getByTestId, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByTestId('login-email-input'), 'wrong@test.com');
      fireEvent.changeText(getByTestId('login-password-input'), 'wrong');
      fireEvent.press(getByTestId('login-submit-button'));

      expect(await waitFor(() => getByText('E-mail ou senha inválidos.'))).toBeTruthy();
    });

    it('displays ACCOUNT_SUSPENDED error message', async () => {
      const mockSignIn = jest.fn().mockRejectedValue(new Error('ACCOUNT_SUSPENDED'));
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        profile: null,
        isLoading: false,
        user: null,
      });

      const { getByTestId, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByTestId('login-email-input'), 'suspended@test.com');
      fireEvent.changeText(getByTestId('login-password-input'), 'pass');
      fireEvent.press(getByTestId('login-submit-button'));

      expect(
        await waitFor(() => getByText('Sua conta foi suspensa. Contate o administrador.'))
      ).toBeTruthy();
    });

    it('displays generic error for unknown error codes', async () => {
      const mockSignIn = jest.fn().mockRejectedValue(new Error('UNKNOWN_ERROR'));
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        profile: null,
        isLoading: false,
        user: null,
      });

      const { getByTestId, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByTestId('login-email-input'), 'user@test.com');
      fireEvent.changeText(getByTestId('login-password-input'), 'pass');
      fireEvent.press(getByTestId('login-submit-button'));

      expect(
        await waitFor(() => getByText('Erro interno. Tente novamente.'))
      ).toBeTruthy();
    });

    it('disables inputs while loading', async () => {
      // signIn never resolves during this test
      const mockSignIn = jest.fn(() => new Promise(() => {}));
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        profile: null,
        isLoading: false,
        user: null,
      });

      const { getByTestId } = render(<LoginScreen />);

      fireEvent.changeText(getByTestId('login-email-input'), 'user@test.com');
      fireEvent.changeText(getByTestId('login-password-input'), 'pass123');
      fireEvent.press(getByTestId('login-submit-button'));

      await waitFor(() => {
        expect(getByTestId('login-email-input').props.editable).toBe(false);
        expect(getByTestId('login-password-input').props.editable).toBe(false);
      });
    });
  });
});
