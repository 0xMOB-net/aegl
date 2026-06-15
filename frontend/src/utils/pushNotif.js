const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function registerPushNotifications(apiClient) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!VAPID_PUBLIC_KEY) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await apiClient.post('/push/subscribe', existing.toJSON());
      return true;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await apiClient.post('/push/subscribe', subscription.toJSON());
    return true;
  } catch (err) {
    console.error('[Push register]', err);
    return false;
  }
}

export async function unregisterPushNotifications(apiClient) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await apiClient.delete('/push/unsubscribe', { data: { endpoint: sub.endpoint } });
    }
  } catch (err) {
    console.error('[Push unregister]', err);
  }
}
