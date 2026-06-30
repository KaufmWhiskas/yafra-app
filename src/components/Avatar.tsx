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

  return (
    <Image
      source={{ uri: url || defaultAvatar }}
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
      contentFit="cover"
      transition={200}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#e1e4e8',
  },
});
