import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { setLicenseValid } from '@/lib/features';

interface LicenseStatus {
  valid: boolean;
  tier: string;
  message: string;
}

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function validateAndApplyLicense(key: string): Promise<LicenseStatus> {
  if (!isTauri()) {
    const valid = key.trim().toUpperCase().startsWith('ALPHA-') && key.trim().length >= 22;
    const status: LicenseStatus = {
      valid,
      tier: valid ? 'premium' : 'free',
      message: valid ? 'License activated (web dev)' : 'Invalid license',
    };
    setLicenseValid(status.valid);
    if (valid) {
      localStorage.setItem('alphadesk-license', key.trim());
    } else {
      localStorage.removeItem('alphadesk-license');
    }
    return status;
  }

  const status = await invoke<LicenseStatus>('validate_license', { key });
  setLicenseValid(status.valid);
  if (status.valid) {
    await invoke('store_secret', { key: 'license_key', value: key.trim() });
  } else {
    await invoke('delete_secret', { key: 'license_key' }).catch(() => {});
  }
  return status;
}

export async function loadStoredLicense(): Promise<boolean> {
  if (!isTauri()) {
    const stored = localStorage.getItem('alphadesk-license');
    if (!stored) return false;
    const status = await validateAndApplyLicense(stored);
    return status.valid;
  }

  const stored = await invoke<string | null>('get_secret', { key: 'license_key' }).catch(() => null);
  if (!stored) return false;
  const status = await validateAndApplyLicense(stored);
  return status.valid;
}

/** Restore license state on app boot. */
export function useLicenseBootstrap() {
  useEffect(() => {
    void loadStoredLicense();
  }, []);
}