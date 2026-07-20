import { supabase } from './supabase';
import { CURRENT_VERSION } from '../constants/theme';

/**
 * Compares two semantic version strings (e.g., "1.0.0").
 * @returns `true` if versionA is greater than or equal to versionB.
 */
function isVersionGreaterOrEqual(versionA: string, versionB: string): boolean {
  const partsA = versionA.split('.').map(Number);
  const partsB = versionB.split('.').map(Number);
  const len = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < len; i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

export async function getAppVersionConfig(): Promise<{
  isSupported: boolean;
  downloadUrl: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('min_required_version, download_url')
      .order('created_at', { ascending: false })
      .single();

    if (error || !data?.min_required_version) {
      return { isSupported: true, downloadUrl: null };
    }

    const isSupported = isVersionGreaterOrEqual(
      CURRENT_VERSION,
      data.min_required_version,
    );
    return { isSupported, downloadUrl: data.download_url || null };
  } catch {
    return { isSupported: true, downloadUrl: null };
  }
}
