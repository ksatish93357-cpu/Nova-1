import { useState, useEffect } from 'react';
import { nativeBridge, NativePermissionStatus, NativeContact } from '../../utils/nativeBridge';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import {
  Smartphone,
  Camera,
  Flashlight,
  Bell,
  Phone,
  Users,
  ShieldCheck,
  Check,
  X,
  Send,
  Loader2,
  Download,
  Terminal,
  Play,
  Copy,
  ExternalLink,
  Layers,
  Wrench,
} from 'lucide-react';

interface NativeToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendPhotoToChat?: (photoDataUrl: string) => void;
}

export function NativeToolsModal({ isOpen, onClose, onSendPhotoToChat }: NativeToolsModalProps) {
  const [activeTab, setActiveTab] = useState<'apk' | 'bridge'>('apk');
  const [permissions, setPermissions] = useState<NativePermissionStatus | null>(null);
  const [envName, setEnvName] = useState<string>('');
  const [isTorchActive, setIsTorchActive] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [contactsList, setContactsList] = useState<NativeContact[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>('+91 ');
  const [notificationMsg, setNotificationMsg] = useState<string>('NOVA AI: Training checkpoint reached! 🚀');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEnvName(nativeBridge.getEnvironmentName());
      checkPermissions();
    }
  }, [isOpen]);

  const checkPermissions = async () => {
    const status = await nativeBridge.getPermissionStatus();
    setPermissions(status);
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleToggleTorch = async () => {
    setStatusMessage(null);
    try {
      const active = await nativeBridge.toggleFlashlight();
      setIsTorchActive(active);
      setStatusMessage(active ? 'Torch enabled' : 'Torch disabled');
    } catch (err: any) {
      setStatusMessage(`Flashlight notice: ${err.message}`);
    }
  };

  const handleCapturePhoto = async () => {
    setIsCapturing(true);
    setStatusMessage(null);
    try {
      const photo = await nativeBridge.capturePhotoFromCamera();
      setCapturedPhoto(photo);
      setStatusMessage('Photo captured successfully via Device Camera');
    } catch (err: any) {
      setStatusMessage(`Camera notice: ${err.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSendToVision = () => {
    if (capturedPhoto && onSendPhotoToChat) {
      onSendPhotoToChat(capturedPhoto);
      onClose();
    }
  };

  const handlePickContacts = async () => {
    setStatusMessage(null);
    try {
      const picked = await nativeBridge.pickContacts();
      setContactsList(picked);
      setStatusMessage(`Loaded ${picked.length} contacts from device`);
    } catch (err: any) {
      setStatusMessage(`Contacts notice: ${err.message}`);
    }
  };

  const handleTriggerCall = () => {
    if (!phoneNumberInput.trim()) return;
    const res = nativeBridge.triggerPhoneCall(phoneNumberInput);
    if (res.success) {
      setStatusMessage(`Opened phone dialer with: ${phoneNumberInput}`);
    } else {
      setStatusMessage('Invalid phone number format');
    }
  };

  const handleSendNotification = async () => {
    setStatusMessage('Requesting notification permission...');
    const ok = await nativeBridge.sendNotification('NOVA AI Alert', {
      body: notificationMsg,
    });
    if (ok) {
      setStatusMessage('Notification dispatched to system tray!');
    } else {
      setStatusMessage('Notification permission denied or unsupported in this browser context.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Android APK & Hardware Bridge Hub
              </h2>
              <p className="text-xs text-slate-400">
                Package: <code className="text-cyan-400 font-mono">com.nova.ai.assistant</code> • Environment: <span className="text-slate-300 font-medium">{envName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Device Bridge Modal"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('apk')}
            className={`pb-1 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'apk'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Build APK & Run</span>
          </button>
          <button
            onClick={() => setActiveTab('bridge')}
            className={`pb-1 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'bridge'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Hardware Bridge (Camera, Torch, Dialer)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {statusMessage && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {activeTab === 'apk' ? (
            <div className="space-y-4">
              {/* Method 1: Instant WebAPK Run on Android Device */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Method 1: Run Instantly on Android (WebAPK)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Recommended • No PC Required
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Open this application in <strong>Chrome</strong>, <strong>Edge</strong>, or <strong>Samsung Internet</strong> on your Android phone or tablet. Android's WebAPK service packages and signs a native APK directly to your app drawer with offline access and full-screen view.
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <PWAInstallButton showAlways={true} />
                  <span className="text-[11px] text-slate-400">or tap browser menu <strong>(⋮) → "Add to Home Screen" / "Install"</strong></span>
                </div>
              </div>

              {/* Method 2: Gradle Android Studio APK Build */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    Method 2: Compile Native APK via Gradle & Capacitor
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Capacitor Native
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The Android project has been initialized in <code className="text-cyan-300 font-mono">/android</code> with web assets synced. To build the standalone debug APK:
                </p>

                {/* Step 1 Command */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>1. Build and sync assets:</span>
                    <button
                      onClick={() => handleCopy('npm run build:android', 'c1')}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      {copiedCmd === 'c1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'c1' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-[11px] overflow-x-auto">
npm run build:android
                  </pre>
                </div>

                {/* Step 2 Command */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>2. Compile debug APK using Gradle wrapper:</span>
                    <button
                      onClick={() => handleCopy('cd android && ./gradlew assembleDebug', 'c2')}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      {copiedCmd === 'c2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'c2' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 text-[11px] overflow-x-auto">
cd android && ./gradlew assembleDebug
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    The resulting APK will be generated at: <br />
                    <code className="text-amber-300 font-mono">android/app/build/outputs/apk/debug/app-debug.apk</code>
                  </p>
                </div>

                {/* Step 3 Command */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>3. Install and run on connected Android phone via ADB:</span>
                    <button
                      onClick={() => handleCopy('adb install -r android/app/build/outputs/apk/debug/app-debug.apk', 'c3')}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      {copiedCmd === 'c3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'c3' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-indigo-300 text-[11px] overflow-x-auto">
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
                  </pre>
                </div>
              </div>

              {/* Method 3: Cloud GitHub Actions Automated APK Builder */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Method 3: Automated Cloud CI/CD APK Builder
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                    GitHub Actions
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  We have configured <code className="text-cyan-300 font-mono">.github/workflows/build-apk.yml</code>. Whenever you push this repo to GitHub, GitHub automatically compiles the Android APK on cloud runners with Java 17 + Android SDK, and provides a direct APK artifact download link.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. Camera & Flashlight Tools */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    Live Camera & Hardware Flashlight
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Cam: {permissions?.camera || 'checking...'}
                  </span>
                </div>
                <p className="text-slate-400">
                  Capture high-resolution real-world images directly from your device camera and forward them to NOVA's Vision AI model for deep technical analysis.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleCapturePhoto}
                    disabled={isCapturing}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium"
                  >
                    {isCapturing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    <span>Take Photo via Camera</span>
                  </button>

                  <button
                    onClick={handleToggleTorch}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium border transition-colors ${
                      isTorchActive
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                    <span>{isTorchActive ? 'Torch Active (ON)' : 'Toggle Flashlight'}</span>
                  </button>
                </div>

                {capturedPhoto && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={capturedPhoto}
                        alt="Captured preview"
                        className="w-14 h-14 object-cover rounded-lg border border-cyan-500/50"
                      />
                      <div>
                        <span className="text-white font-semibold block">Photo Ready</span>
                        <span className="text-slate-400 text-[11px]">Forward this photo to NOVA AI chat</span>
                      </div>
                    </div>
                    <button
                      onClick={handleSendToVision}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Chat</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. System Push Notifications */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    System Push & Local Notifications
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Status: {permissions?.notifications || 'default'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={notificationMsg}
                    onChange={(e) => setNotificationMsg(e.target.value)}
                    placeholder="Notification message..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSendNotification}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium whitespace-nowrap"
                  >
                    Send Test Notification
                  </button>
                </div>
              </div>

              {/* 3. Phone Dialer & Intent */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Android Phone Dialer Bridge
                </span>
                <p className="text-slate-400">
                  Triggers the native phone app / dialer intent with an authorized phone number.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={phoneNumberInput}
                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                    placeholder="+1 555-0199"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleTriggerCall}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Open Dialer</span>
                  </button>
                </div>
              </div>

              {/* 4. Contacts Integration */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Device Contacts Picker
                  </span>
                  <button
                    onClick={handlePickContacts}
                    className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px]"
                  >
                    Pick Device Contact
                  </button>
                </div>
                {contactsList.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                    {contactsList.map((contact, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                      >
                        <span className="font-semibold text-white">{contact.name}</span>
                        <span className="text-slate-400 font-mono">{contact.tel || contact.email || 'No phone'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    No contacts selected yet. Click 'Pick Device Contact' to invoke the system selector.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
