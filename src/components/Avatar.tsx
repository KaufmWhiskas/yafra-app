import { Image } from 'expo-image';
import { StyleSheet, StyleProp, ImageStyle } from 'react-native';

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/initials/svg?seed=User';

export function Avatar({
  url,
  size = 100,
  style,
}: {
  url?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={{ uri: url || DEFAULT_AVATAR }}
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
    backgroundColor: '#e1e4e8', // Displays this background color while loading
  },
});
