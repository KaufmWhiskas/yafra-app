import { supabase } from './supabase';

/**
 * Compares two semantic version strings (e.g., '1.2.3').
 * @returns `true` if versionA is greater than or equal to versionB.
 */
function isVersionGreaterOrEqual(versionA: string, versionB: string): boolean {
  const partsA = versionA.split('.').map(Number);
  const partsB = versionB.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;

    if (partA > partB) return true;
    if (partA < partB) return false;
  }

  return true; // Versions are equal
}

/**
 * Checks if the current app version is supported by querying a remote config.
 * It fails open (returns true) if the remote config cannot be fetched.
 * @param currentVersion The app's current version string (e.g., '1.0.0').
 * @returns A promise that resolves to `true` if the version is supported, `false` otherwise.
 */
export async function checkVersionIsSupported(
  currentVersion: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('min_required_version, download_url')
      .order('created_at', { ascending: false })
      .single();

    if (error || !data?.min_required_version) {
      console.warn(
        'Could not fetch minimum supported version. Failing open.',
        error,
      );
      return true;
    }

    const minVersion = data.min_required_version as string;
    return isVersionGreaterOrEqual(currentVersion, minVersion);
  } catch (e) {
    console.error('Unexpected error in version check:', e);
    // Fail open on any unexpected exception.
    return true;
  }
}
