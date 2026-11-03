import { usePWAInstall } from './usePWAInstall';
import { Download, Check, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  showAlways?: boolean;
}

export function PWAInstallButton({ className = '', showAlways = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono ${className}`}>
        <Check className="w-3.5 h-3.5" />
        <span>Installed App</span>
      </div>
    );
  }

  if (!isInstallable && !showAlways) {
    return null;
  }

  return (
    <button
      onClick={installApp}
      disabled={!isInstallable && !showAlways}
      title="Install NOVA AI as Android / Desktop Web App"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 ${className}`}
    >
      <Smartphone className="w-3.5 h-3.5" />
      <span>Install App</span>
      <Download className="w-3 h-3 opacity-80" />
    </button>
  );
}
