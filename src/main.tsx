import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const IOSPrompt = () => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    if (isIos && !isStandalone) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[var(--primary-beige)] text-white p-4 z-[9999] shadow-[0_-10px_20px_rgba(0,0,0,0.5)] border-t border-[var(--primary)]/20 flex flex-col items-center justify-center animate-fade-in">
      <p className="text-sm font-bold mb-2">Install Amate 38 on your iPhone!</p>
      <p className="text-xs text-white/60 mb-4 text-center">Tap the Share button <span className="inline-block border border-white/40 rounded px-1">⎋</span> and select "Add to Home Screen" to use the app.</p>
      <button onClick={() => setShow(false)} className="text-[var(--primary)] text-xs font-black uppercase tracking-widest border border-[var(--primary)]/20 px-4 py-2 rounded-xl bg-[var(--primary-beige)] hover:brightness-110">Dismiss</button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <IOSPrompt />
  </StrictMode>,
);
