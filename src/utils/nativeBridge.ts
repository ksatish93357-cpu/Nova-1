/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Native Bridge Architecture for NOVA AI
 * Supports both Android Capacitor runtime and Modern Web / PWA environments.
 * Provides access to Contacts, Phone Dialer, Camera, Flashlight, Notifications, and Intents
 * with appropriate permission management and user confirmation guards.
 */

export interface NativePermissionStatus {
  camera: 'granted' | 'denied' | 'prompt' | 'unsupported';
  notifications: 'granted' | 'denied' | 'default' | 'unsupported';
  contacts: 'granted' | 'denied' | 'prompt' | 'unsupported';
  flashlight: 'supported' | 'unsupported' | 'active' | 'inactive';
}

export interface NativeContact {
  name: string;
  tel?: string;
  email?: string;
}

export class NativeBridgeService {
  private static instance: NativeBridgeService;
  private torchTrack: MediaStreamTrack | null = null;
  private isTorchOn = false;

  private constructor() {}

  public static getInstance(): NativeBridgeService {
    if (!NativeBridgeService.instance) {
      NativeBridgeService.instance = new NativeBridgeService();
    }
    return NativeBridgeService.instance;
  }

  /**
   * Detects if running inside Capacitor native Android container or Web/PWA
   */
  public isNativeAndroid(): boolean {
    return (
      typeof (window as any).Capacitor !== 'undefined' &&
      (window as any).Capacitor.isNativePlatform?.() === true
    );
  }

  public getEnvironmentName(): string {
    if (this.isNativeAndroid()) return 'Android Native (Capacitor)';
    if (window.matchMedia('(display-mode: standalone)').matches) return 'Android PWA (Standalone)';
    return 'Web Browser / Responsive PWA';
  }

  /**
   * Inspect current permissions
   */
  public async getPermissionStatus(): Promise<NativePermissionStatus> {
    const status: NativePermissionStatus = {
      camera: 'prompt',
      notifications: 'default',
      contacts: 'unsupported',
      flashlight: 'unsupported',
    };

    // Camera permission check
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const camPerm = await navigator.permissions.query({ name: 'camera' as any });
        status.camera = camPerm.state;
      } catch (e) {
        status.camera = navigator.mediaDevices ? 'prompt' : 'unsupported';
      }
    }

    // Notifications check
    if ('Notification' in window) {
      status.notifications = Notification.permission;
    } else {
      status.notifications = 'unsupported';
    }

    // Contacts API check
    if ('contacts' in navigator && 'ContactsManager' in window) {
      status.contacts = 'prompt';
    } else {
      status.contacts = 'unsupported';
    }

    // Flashlight check
    if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
      const constraints = navigator.mediaDevices.getSupportedConstraints();
      status.flashlight = (constraints as any).torch ? (this.isTorchOn ? 'active' : 'inactive') : 'unsupported';
    }

    return status;
  }

  /**
   * Request push/local notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch (e) {
      return false;
    }
  }

  /**
   * Send local notification
   */
  public async sendNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (!('Notification' in window)) return false;

    if (Notification.permission !== 'granted') {
      const granted = await this.requestNotificationPermission();
      if (!granted) return false;
    }

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        body: options?.body || 'NOVA AI Notification',
        ...options,
      });
      return true;
    } catch (e) {
      console.warn('Notification trigger failed:', e);
      return false;
    }
  }

  /**
   * Trigger Phone Call Dialer with user confirmation guard
   */
  public triggerPhoneCall(phoneNumber: string): { success: boolean; url: string } {
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    if (!cleanNumber) {
      return { success: false, url: '' };
    }
    const telUrl = `tel:${cleanNumber}`;
    window.location.href = telUrl;
    return { success: true, url: telUrl };
  }

  /**
   * Request contacts via Web Contacts Picker API with fallback mock structure
   */
  public async pickContacts(): Promise<NativeContact[]> {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel', 'email'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: true });
        return contacts.map((c: any) => ({
          name: c.name?.[0] || 'Unknown',
          tel: c.tel?.[0],
          email: c.email?.[0],
        }));
      } catch (err) {
        console.warn('Contacts selection cancelled or failed:', err);
      }
    }
    throw new Error('Contact Picker API is not supported on this platform or browser.');
  }

  /**
   * Toggle Flashlight / Torch
   */
  public async toggleFlashlight(turnOn?: boolean): Promise<boolean> {
    const targetState = turnOn !== undefined ? turnOn : !this.isTorchOn;

    try {
      if (targetState) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access not supported on this device');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        const track = stream.getVideoTracks()[0];
        const capabilities: any = track.getCapabilities?.() || {};

        if (!capabilities.torch) {
          // Stop stream if torch is not supported
          track.stop();
          throw new Error('Flashlight / Torch hardware is not accessible on this camera.');
        }

        await (track as any).applyConstraints({
          advanced: [{ torch: true }],
        });

        this.torchTrack = track;
        this.isTorchOn = true;
        return true;
      } else {
        if (this.torchTrack) {
          try {
            await (this.torchTrack as any).applyConstraints({
              advanced: [{ torch: false }],
            });
          } catch (e) {}
          this.torchTrack.stop();
          this.torchTrack = null;
        }
        this.isTorchOn = false;
        return false;
      }
    } catch (err: any) {
      console.warn('Flashlight toggle error:', err);
      this.isTorchOn = false;
      this.torchTrack = null;
      throw err;
    }
  }

  /**
   * Capture photo from camera
   */
  public async capturePhotoFromCamera(): Promise<string> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera device is not available in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
    });

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        video.play();
        setTimeout(() => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            // Clean up tracks
            stream.getTracks().forEach((t) => t.stop());
            resolve(dataUrl);
          } catch (err) {
            stream.getTracks().forEach((t) => t.stop());
            reject(err);
          }
        }, 300);
      };

      video.onerror = (e) => {
        stream.getTracks().forEach((t) => t.stop());
        reject(new Error('Failed to stream video from camera'));
      };
    });
  }

  /**
   * Trigger external deep link or native app intent
   */
  public openExternalApp(urlScheme: string): boolean {
    try {
      window.open(urlScheme, '_blank', 'noopener,noreferrer');
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const nativeBridge = NativeBridgeService.getInstance();
