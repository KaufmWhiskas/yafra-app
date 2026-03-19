import { View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function RestaurantCard({name = "No name given", cuisine = "No cusine given", rating = null, isOpen = null, image, onPressDetail}) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image}} style={styles.image} />
      <Text>{name}</Text>
      <Text>{cuisine}</Text>
      {rating >= 4.5 && <Text><Ionicons name="star" size={16} color="gold" /> Top Rated!</Text>}
      {isOpen ? <Text>Open Now</Text> : <Text>Closed</Text>} 
      <TouchableOpacity style={styles.button} onPress={onPressDetail}><Text style={styles.buttonText}>View Details</Text></TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 150,
    borderRadius: 32
  },
  card: {
    padding: 20,
    backgroundColor: "#FFF"
  },
  button: {
    backgroundColor: "lime",
    padding: 8,
  },
  buttonText: {
    textAlign: "center"
  }
})