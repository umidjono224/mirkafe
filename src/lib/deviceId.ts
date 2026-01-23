// Generate and persist a unique device ID
const DEVICE_ID_KEY = 'mircafe_device_id';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

export function clearDeviceId(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
}
