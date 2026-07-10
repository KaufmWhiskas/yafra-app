import React from 'react';
import Lucide from '@react-native-vector-icons/lucide';
import {
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome5,
  FontAwesome6,
} from '@expo/vector-icons';
import { getCategoryIconConfig } from '../../constants/categories';

interface CategoryIconProps {
  cuisine: string;
  size: number;
  color: string;
}

export default function CategoryIcon({
  cuisine,
  size,
  color,
}: CategoryIconProps) {
  const config = getCategoryIconConfig(cuisine);

  switch (config.provider) {
    case 'Lucide':
      return <Lucide name={config.name} size={size} color={color} />;
    case 'MaterialCommunityIcons':
      return (
        <MaterialCommunityIcons name={config.name} size={size} color={color} />
      );
    case 'MaterialIcons':
      return <MaterialIcons name={config.name} size={size} color={color} />;
    case 'FontAwesome5':
      return <FontAwesome5 name={config.name} size={size} color={color} />;
    case 'FontAwesome6':
      return <FontAwesome6 name={config.name} size={size} color={color} />;
    default:
      return <MaterialIcons name="restaurant" size={size} color={color} />;
  }
}
