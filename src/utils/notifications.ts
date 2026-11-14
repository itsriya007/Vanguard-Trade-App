/**
 * Browser Notification Helper with safe fallbacks for sandboxed iframes & desktop/mobile browsers
 */

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return Notification.permission;
  }
}

export function sendBrowserNotification(
  title: string,
  options?: {
    body?: string;
    tag?: string;
    icon?: string;
    requireInteraction?: boolean;
    silent?: boolean;
  }
): boolean {
  if (!isBrowserNotificationSupported()) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: options?.icon || 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bell.svg',
        body: options?.body,
        tag: options?.tag,
        requireInteraction: options?.requireInteraction ?? false,
        silent: options?.silent ?? false,
      });

      // Auto close after 7 seconds if not interacted
      setTimeout(() => {
        try {
          notif.close();
        } catch {
          // ignore
        }
      }, 7000);

      return true;
    } catch (e) {
      console.warn('Browser Notification delivery failed:', e);
      return false;
    }
  }

  return false;
}
