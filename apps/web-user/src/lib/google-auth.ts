// Google Identity Services (GIS) loader and initializer.
// The backend receives the credential (ID token) via POST /api/v1/auth/google.

export interface GisCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: GisCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }): void;
          renderButton(element: HTMLElement, options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            type?: 'standard' | 'icon';
            text?: string;
            width?: number;
          }): void;
          prompt(): void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;
let initialized = false;

function loadGisScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function initGoogleSignIn(
  clientId: string,
  callback: (response: GisCredentialResponse) => void,
  buttonContainer: HTMLElement,
): Promise<void> {
  await loadGisScript();
  if (!initialized) {
    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    initialized = true;
  }
  window.google!.accounts.id.renderButton(buttonContainer, {
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    width: buttonContainer.offsetWidth || 320,
  });
}
