import React, { useLayoutEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import GroupFeedList from '../../components/groups/GroupFeedList';
import { COLORS, SIZES } from '../../constants/theme';

type GroupFeedScreenRouteProp = RouteProp<
  RootStackParamList,
  'GroupFeedScreen'
>;

export default function GroupFeedScreen() {
  const route = useRoute<GroupFeedScreenRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { groupId, groupName } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: groupName || 'Group Feed',
    });
  }, [navigation, groupName]);

  return (
    <View style={styles.container}>
      <GroupFeedList groupId={groupId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.padding,
  },
});
