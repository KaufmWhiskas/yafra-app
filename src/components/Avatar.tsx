import { Image } from 'expo-image';
import { StyleSheet, StyleProp, ImageStyle } from 'react-native';

export function Avatar({
  url,
  name = 'User',
  size = 100,
  style,
}: {
  url?: string | null;
  name?: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  // Clean up the name string to get a meaningful initials seed
  const cleanSeed = encodeURIComponent(name.trim() || 'U');
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${cleanSeed}`;

  // If the incoming URL already contains a cache-buster query string (?t= or ?cacheBuster=),
  // use it directly. Otherwise, attach a stable fallback.
  const clearUri = url
    ? url.includes('?')
      ? url
      : `${url}?t=${encodeURIComponent(name.length)}`
    : defaultAvatar;

  return (
    <Image
      source={{ uri: clearUri }}
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
      contentFit="cover"
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#e1e4e8',
  },
});
