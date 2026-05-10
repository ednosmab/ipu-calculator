const signIn = useCallback(async (email: string, password: string) => {
  try {
    const res = await fetch(`${API_BASE}/auth-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? 'INTERNAL_ERROR');
    }

    const { session: newSession, profile: newProfile } = data;

    await Promise.all([
      sessionStorage.setToken(newSession.access_token),
      sessionStorage.setProfile(JSON.stringify(newProfile)),
    ]);

    setSession(newSession);
    setUser({ id: newProfile.id });
    setProfile(newProfile);
  } catch (error) {
    console.error('[Auth] Login failed:', error);

    throw new Error(
      error instanceof Error
        ? error.message
        : 'NETWORK_ERROR'
    );
  }
}, []);
