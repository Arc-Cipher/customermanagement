let _creds: string | null = null;

export const setCredentials = (b64: string | null): void => {
  _creds = b64;
};

export const getCredentials = (): string | null => _creds;
