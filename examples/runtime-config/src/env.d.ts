declare global {
  interface Window {
    _env_: {
      BROWSER_GREETING: string;
    };
  }
}

export {};
