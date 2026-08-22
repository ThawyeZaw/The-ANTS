// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Universal API Bridge Client (replaces legacy Supabase client)
// ──────────────────────────────────────────────────────────────────────────────

export type SupabaseQueryBuilder = any;
export type AppSupabaseClient = any;

function createQueryProxy(): any {
  const target: any = () => {};
  let proxyInstance: any;
  proxyInstance = new Proxy(target, {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: any) =>
          Promise.resolve({ data: [], count: 0, error: null }).then(resolve);
      }
      if (prop === 'single' || prop === 'maybeSingle') {
        return async () => ({ data: null, count: 0, error: null });
      }
      return (..._args: any[]) => proxyInstance;
    },
    apply() {
      return proxyInstance;
    },
  });
  return proxyInstance;
}

function createAuthProxy(): any {
  const authTarget: any = {};
  let authProxyInstance: any;
  authProxyInstance = new Proxy(authTarget, {
    get(_target, prop) {
      if (prop === 'onAuthStateChange') {
        return (cb?: any) => {
          if (cb) cb('INITIAL_SESSION', null);
          return { data: { subscription: { unsubscribe: () => {} } } };
        };
      }
      if (prop === 'admin') {
        return authProxyInstance;
      }
      return async (..._args: any[]) => ({
        data: { user: null, session: null, users: [] },
        error: null,
      });
    },
  });
  return authProxyInstance;
}

export function createClient(): any {
  return {
    from: (_table: string) => createQueryProxy(),
    channel: (_name: string) => {
      const ch: any = {
        on: () => ch,
        subscribe: (cb?: any) => {
          if (cb) cb('SUBSCRIBED');
          return { unsubscribe: () => {} };
        },
        track: async () => {},
        untrack: async () => {},
        send: async () => {},
        presenceState: () => ({}),
      };
      return ch;
    },
    removeChannel: (_channel: any) => {},
    storage: {
      from: (bucket: string) => ({
        upload: async (fileName: string) => ({
          data: { path: `${bucket}/${fileName}` },
          error: null,
        }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://assets.the-ants.org/${bucket}/${path}` },
        }),
      }),
    },
    auth: createAuthProxy(),
  };
}
