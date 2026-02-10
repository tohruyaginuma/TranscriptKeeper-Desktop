export {};

declare global {
  interface Window {
    recorderAPI: {
      ping: () => string;

      // add as you implement:
      // listDesktopSources: () => Promise<Array<{ id: string; name: string }>>;
      // saveWebm: (data: ArrayBuffer) => Promise<void>;
    };
  }
}
