import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { theme } from '@/design-system';
import { CACHE_VERSION } from '@/core/versioning/cacheVersion';
import { CONFIG } from '@/core/config';
import { useAuth } from '@/hooks/useAuth';
import { modelRepository } from '@/features/models/infra/modelRepository';

type LogEntry = {
  type: 'error' | 'warn' | 'info';
  message: string;
  timestamp: string;
};

interface DebugPanelProps {
  visible: boolean;
  debugInfo?: string;
}

export const DebugPanel = ({ visible, debugInfo }: DebugPanelProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const originalConsoleError = useRef<typeof console.error>(console.error);
  const originalConsoleWarn = useRef<typeof console.warn>(console.warn);
  const originalConsoleLog = useRef<typeof console.log>(console.log);
  
  const formatArg = (a: unknown): string => {
  if (a instanceof Error) return a.message;
  if (typeof a === 'object' && a !== null) {
    try { return JSON.stringify(a); } catch { return String(a); }
  }
  return String(a);
};

// Auth info
  const { user, profile, session, isLoading: authLoading } = useAuth();

  const [modelsCache, setModelsCache] = useState<{ name: string; version: number; syncStatus: string }[]>([]);

  const loadModels = useCallback(() => {
    modelRepository.getAll().then(data => {
      setModelsCache(data.map(m => ({ name: m.name, version: m.version, syncStatus: m.syncStatus })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadModels();
    const unsub = modelRepository.subscribe(loadModels);
    return unsub;
  }, [loadModels]);

  const addLog = (type: LogEntry['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    setLogs(prev => {
      const next = [...prev, { type, message: String(message).slice(0, 500), timestamp }];
      return next.length > 100 ? next.slice(-100) : next;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[DebugPanel] MOUNTED - Starting network detection');

    // Captura window.onerror
    const handleError = (event: ErrorEvent) => {
      addLog('error', `${event.message} at ${event.filename}:${event.lineno}`);
    };

    // Captura unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      addLog('error', `Unhandled Rejection: ${reason?.message || reason}`);
    };

    // Captura mudanças de rede
    const handleOnline = () => {
      console.log('[DebugPanel] *** ONLINE EVENT ***');
      setIsOnline(true);
      addLog('info', '🌐 Status: ONLINE (evento)');
    };
    const handleOffline = () => {
      console.log('[DebugPanel] *** OFFLINE EVENT ***');
      setIsOnline(false);
      addLog('warn', '🔌 Status: OFFLINE (evento)');
    };

    // Intervalo agressivo: verifica navigator.onLine a cada 500ms
    console.log('[DebugPanel] Setting up 500ms interval');
    let lastState = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    const networkCheckInterval = setInterval(() => {
      if (typeof navigator !== 'undefined') {
        const currentOnline = navigator.onLine;
        if (currentOnline !== lastState) {
          lastState = currentOnline;
          setIsOnline(currentOnline);
          addLog(currentOnline ? 'info' : 'warn', `📡 Rede alterada para: ${currentOnline ? 'ONLINE' : 'OFFLINE'}`);
        }
      }
    }, 500);

    // Override console.error
    console.error = (...args: any[]) => {
      originalConsoleError.current(...args);
      addLog('error', args.map(formatArg).join(' '));
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      originalConsoleWarn.current(...args);
      addLog('warn', args.map(formatArg).join(' '));
    };

    // Override console.log
    console.log = (...args: any[]) => {
      originalConsoleLog.current(...args);
      addLog('info', args.map(formatArg).join(' '));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      console.log('[DebugPanel] UNMOUNTING');
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(networkCheckInterval);
      console.error = originalConsoleError.current;
      console.warn = originalConsoleWarn.current;
      console.log = originalConsoleLog.current;
    };
  }, []);

  // Log de renderização removido para evitar loop infinito com o override de console.log
  // console.log(`[DebugPanel] RENDER: isOnline=${isOnline}, visible=${visible}`);

  const clearLogs = () => {
    console.log('[DebugPanel] Clearing logs!');
    setLogs([]);
  };

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const copyLogs = async () => {
    const lines: string[] = [];
    const now = new Date().toISOString();
    lines.push('=== IPU Calculator Debug Log ===');
    lines.push(`Timestamp: ${now}`);
    lines.push(`App Version: ${CACHE_VERSION.SW}`);
    lines.push(`Schema: ${CACHE_VERSION.SCHEMA}`);
    lines.push('');
    lines.push('=== Config ===');
    lines.push(`EDGE_FUNCTIONS_URL: ${CONFIG.EDGE_FUNCTIONS_URL}`);
    lines.push(
      `SUPABASE_ANON_KEY: ${
        CONFIG.SUPABASE_ANON_KEY ? '***' + CONFIG.SUPABASE_ANON_KEY.slice(-6) : 'MISSING'
      }`
    );
    lines.push('');
    lines.push('=== Network ===');
    lines.push(`Online (state): ${isOnline ? 'Sim' : 'Não'}`);
    lines.push(
      `Online (direct): ${
        typeof navigator !== 'undefined' && navigator.onLine ? 'Sim' : 'Não'
      }`
    );
    lines.push('');
    lines.push('=== Auth ===');
    lines.push(`Loading: ${authLoading ? 'Sim' : 'Não'}`);
    lines.push(`User: ${user?.id ? user.id : 'Nenhum'}`);
    lines.push(`Email: ${user?.email || 'Nenhum'}`);
    lines.push(
      `Profile: ${profile ? `${profile.role} (${profile.active ? 'Ativo' : 'Inativo'})` : 'Nenhum'}`
    );
    lines.push(`Profile Name: ${profile?.name || 'Nenhum'}`);
    lines.push(
      `Session: ${session?.access_token ? '***' + session.access_token.slice(-6) : 'Nenhuma'}`
    );
    lines.push(
      `Refresh Token: ${
        session?.refresh_token ? 'present' : 'ausente'
      }`
    );
    lines.push('');
    lines.push(`=== Models Cache (${modelsCache.length}) ===`);
    if (modelsCache.length === 0) {
      lines.push('(vazio)');
    } else {
      modelsCache.forEach((m, i) => {
        lines.push(`#${i + 1} ${m.name} — v${m.version} [${m.syncStatus}]`);
      });
    }
    if (debugInfo) {
      lines.push('');
      lines.push('=== PWA Info ===');
      lines.push(debugInfo);
    }
    lines.push('');
    lines.push(`=== Logs (${logs.length}) ===`);
    logs.forEach(l => {
      lines.push(`${l.timestamp} [${l.type.toUpperCase()}] ${l.message}`);
    });

    const text = lines.join('\n');

    let copied = false;
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(text);
        copied = true;
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch (e) {
      console.error('[DebugPanel] Falha ao copiar:', e);
    }

    setCopyFeedback(copied ? 'Copiado!' : 'Falhou');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const checkNetworkNow = async () => {
    console.log('[DebugPanel] Check Now pressed!');
    addLog('info', '🔍 Verificando conectividade real...');
    
    if (typeof navigator !== 'undefined') {
      const isOnlineNav = navigator.onLine;
      setIsOnline(isOnlineNav);
      
      try {
        // Tenta um fetch rápido para validar internet real
        const start = Date.now();
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
        const latency = Date.now() - start;
        addLog('info', `✅ Internet OK (Latência: ${latency}ms)`);
      } catch (e) {
        addLog('error', '❌ Falha de conectividade (Sem internet real)');
      }
    }
  };

  const errorCount = logs.filter(l => l.type === 'error').length;

  return (
    <View style={[styles.container, !visible && styles.hidden]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Debug Panel{errorCount > 0 ? ` (${errorCount} errors)` : ''}</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={checkNetworkNow}
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.5 }]}
          >
            <Text style={styles.headerButtonText}>Check Now</Text>
          </Pressable>
          <Pressable
            onPress={copyLogs}
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.5 }]}
          >
            <Text style={styles.headerButtonText}>
              {copyFeedback ?? 'Copiar'}
            </Text>
          </Pressable>
          <Pressable
            onPress={clearLogs}
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.5 }]}
          >
            <Text style={styles.headerButtonText}>Limpar</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.infoText}>Online (state): {isOnline ? 'Sim' : 'Não'}</Text>
        <Text style={styles.infoText}>Online (direct): {typeof navigator !== 'undefined' && navigator.onLine ? 'Sim' : 'Não'}</Text>
        <Text style={styles.infoText}>Logs: {logs.length}</Text>
        <Text style={styles.infoText}>App Version: {CACHE_VERSION.SW}</Text>
        <Text style={styles.infoText}>Schema: {CACHE_VERSION.SCHEMA}</Text>

        <Text style={styles.sectionTitle}>Config</Text>
        <Text style={styles.infoText}>EDGE_FUNCTIONS_URL: {CONFIG.EDGE_FUNCTIONS_URL}</Text>
        <Text style={styles.infoText}>SUPABASE_ANON_KEY: {CONFIG.SUPABASE_ANON_KEY ? '***' + CONFIG.SUPABASE_ANON_KEY.slice(-6) : 'MISSING'}</Text>

        <Text style={styles.sectionTitle}>Auth</Text>
        <Text style={styles.infoText}>Loading: {authLoading ? 'Sim' : 'Não'}</Text>
        <Text style={styles.infoText}>User: {user?.id ? user.id.substring(0, 8) + '...' : 'Nenhum'}</Text>
        <Text style={styles.infoText}>Email: {user?.email || 'Nenhum'}</Text>
        <Text style={styles.infoText}>Profile: {profile ? `${profile.role} (${profile.active ? 'Ativo' : 'Inativo'})` : 'Nenhum'}</Text>
        <Text style={styles.infoText}>Profile Name: {profile?.name || 'Nenhum'}</Text>
        <Text style={styles.infoText}>Session: {session?.access_token ? '***' + session.access_token.slice(-6) : 'Nenhuma'}</Text>

        <Text style={styles.sectionTitle}>Models Cache ({modelsCache.length})</Text>
        {modelsCache.length === 0 && <Text style={styles.infoText}>Vazio</Text>}
        {modelsCache.map((m, i) => (
          <Text key={i} style={styles.infoText}>
            #{i + 1} {m.name} — v{m.version} [{m.syncStatus}]
          </Text>
        ))}

        {debugInfo && (
          <>
            <Text style={styles.sectionTitle}>PWA Info</Text>
            <Text style={styles.infoText}>{debugInfo}</Text>
          </>
        )}

        {logs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Logs</Text>
            {logs.map((log, i) => (
              <Text
                key={i}
                style={[
                  styles.logItem,
                  log.type === 'error' && styles.logError,
                  log.type === 'warn' && styles.logWarn,
                ]}
              >
                {log.timestamp} [{log.type.toUpperCase()}] {log.message}
              </Text>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    position: 'absolute' as const,
    bottom: 100,
    left: 10,
    right: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    zIndex: 10001,
    maxHeight: 300,
    overflow: 'hidden' as const,
    pointerEvents: 'auto' as const,
  },
  hidden: {
    display: 'none' as const,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.error + '20',
    zIndex: 1,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    fontFamily: 'monospace',
  },
  headerActions: {
    flexDirection: 'row' as const,
  },
  headerButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    minWidth: 60,
    minHeight: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginLeft: 4,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 2,
  },
  headerButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  infoContainer: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    marginTop: theme.spacing.sm,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  infoText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  logItem: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    fontFamily: 'monospace',
    lineHeight: 12,
    paddingVertical: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border + '50',
  },
  logError: {
    color: theme.colors.error,
  },
  logWarn: {
    color: theme.colors.warning,
  },
};
