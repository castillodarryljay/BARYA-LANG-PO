import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isOnline: boolean;
  offlineReady: boolean;
  needRefresh: boolean;
  updateSWFn: ((reload?: boolean) => Promise<void>) | null;
}

const listeners = new Set<() => void>();
let initialized = false;

let pwaState: PWAState = {
  deferredPrompt: null,
  isInstalled: false,
  isIOS: false,
  isAndroid: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  offlineReady: false,
  needRefresh: false,
  updateSWFn: null,
};

function notify() {
  listeners.forEach((fn) => fn());
}

function updateState(partial: Partial<PWAState>) {
  pwaState = { ...pwaState, ...partial };
  notify();
}

function initPWASingleton() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  updateState({
    isInstalled: isStandalone,
    isIOS,
    isAndroid,
    isOnline: navigator.onLine,
  });

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    updateState({ deferredPrompt: e as BeforeInstallPromptEvent });
  });

  window.addEventListener('appinstalled', () => {
    updateState({ isInstalled: true, deferredPrompt: null });
  });

  window.addEventListener('online', () => updateState({ isOnline: true }));
  window.addEventListener('offline', () => updateState({ isOnline: false }));

  // Register Service Worker once for full offline precaching & Chrome WebAPK support
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    try {
      const updateSW = registerSW({
        immediate: true,
        onOfflineReady() {
          updateState({ offlineReady: true });
        },
        onNeedRefresh() {
          updateState({ needRefresh: true });
        },
      });
      updateState({
        updateSWFn: updateSW,
        offlineReady: Boolean(navigator.serviceWorker.controller),
      });
    } catch {
      // Unsupported browser or restricted context
    }
  } else if (window.location.protocol === 'file:') {
    updateState({ offlineReady: true });
  }
}

export function usePWA() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initPWASingleton();
    const onChange = () => setTick((t) => t + 1);
    listeners.add(onChange);
    // Sync once immediately in case initPWASingleton updated state
    onChange();
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const installApp = async () => {
    const promptEvt = pwaState.deferredPrompt;
    if (!promptEvt) return false;
    await promptEvt.prompt();
    const { outcome } = await promptEvt.userChoice;
    if (outcome === 'accepted') {
      updateState({ isInstalled: true, deferredPrompt: null });
      return true;
    }
    return false;
  };

  const applyUpdate = () => {
    if (pwaState.updateSWFn) {
      pwaState.updateSWFn(true);
    } else {
      window.location.reload();
    }
  };

  return {
    isInstallable: !!pwaState.deferredPrompt,
    isInstalled: pwaState.isInstalled,
    isIOS: pwaState.isIOS,
    isAndroid: pwaState.isAndroid,
    isOnline: pwaState.isOnline,
    offlineReady: pwaState.offlineReady,
    needRefresh: pwaState.needRefresh,
    installApp,
    applyUpdate,
  };
}
