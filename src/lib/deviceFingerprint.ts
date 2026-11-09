/**
 * SmartAttend Persistent Device Identification Engine
 * Generates and stores a unique cryptographic device token to enforce 1-Student = 1-Device binding.
 */

const STORAGE_KEY = 'smartattend_device_uuid';

export interface DeviceFingerprint {
  deviceId: string;
  deviceName: string;
  platform: string;
  userAgent: string;
}

/**
 * Parses userAgent to return a friendly, human-readable device & browser label.
 */
function getFriendlyDeviceName(): { name: string; platform: string } {
  if (typeof window === 'undefined') {
    return { name: 'Unknown Web Device', platform: 'Unknown' };
  }

  const ua = navigator.userAgent;
  let browser = 'Web Browser';
  let os = 'Unknown OS';

  // Detect OS
  if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS';
  } else if (/Windows NT/i.test(ua)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Detect Browser
  if (/SamsungBrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/Edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome|CriOS/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/OPR|Opera/i.test(ua)) {
    browser = 'Opera';
  }

  const screenDim = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '';
  const fullName = screenDim ? `${browser} on ${os} (${screenDim})` : `${browser} on ${os}`;

  return { name: fullName, platform: os };
}

/**
 * Returns or creates the persistent unique device ID for this client.
 */
export function getDeviceFingerprint(): DeviceFingerprint {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'server_env',
      deviceName: 'Server',
      platform: 'Server',
      userAgent: ''
    };
  }

  let deviceId = localStorage.getItem(STORAGE_KEY);

  if (!deviceId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    }
    localStorage.setItem(STORAGE_KEY, deviceId);
  }

  const { name, platform } = getFriendlyDeviceName();

  return {
    deviceId,
    deviceName: name,
    platform,
    userAgent: navigator.userAgent
  };
}

/**
 * Manually forces a device ID override (useful when linking a new device upon approved transfer)
 */
export function setStoredDeviceId(newId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, newId);
  }
}
