import { StyleSheet, TextInput, Switch, Text, FlatList, Modal, Button, KeyboardAvoidingView, View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './supabase.js';

import RestaurantCard from "./RestaurantCard.jsx"

const placeholderImg = "https://placehold.co/600x400.png"
const Stack = createNativeStackNavigator();

function HomeScreen({navigation}) {
  const [name, setName] = useState("");
  const [isNewOpen, setIsNewOpen] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [restaurantData, setRestaurantData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiKey = process.env.EXPO_PUBLIC_API_KEY;
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    async function fetchRestaurants() {
      const {data, error} = await supabase.from('restaurants_test').select('*');
      if (error) {
        console.error("Error feetching!", error);
      } else {
        setRestaurantData(data);
      }
      setIsLoading(false);
    }

    async function getUserLocation() {
    let {status} = await Location.requestForegroundPermissionsAsync()
      if(status !== 'granted') {
        setLocationError("Permission to access location was denied")
        return;
      } else {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    }

    fetchRestaurants();
    getUserLocation();
  }, []);


  if(isLoading){
    return (
    <View style={styles.activityIndicatorStyle}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
    );
  }
  return (
    <View style={{ flex: 1, paddingTop: 50 }}>
      <FlatList
        style={styles.scrollView}
        data={restaurantData}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({item}) => <RestaurantCard {...item} onPressDetail={() => navigation.navigate('Details', { name: item.name, cuisine: item.cuisine, rating: item.rating})} />}
        ListHeaderComponent={
      <View style={{ paddingTop: 50}}>
        <Button title="Open Form" onPress={() => setModalVisible(true)} />
          {locationError ? (
            <Text>{locationError}</Text>
          ) : location ? (
            <Text>Lat: {location.coords.latitude}, Lon: {location.coords.longitude}</Text>
          ) : (
            <Text>Fetching location...</Text>
          )}
      </View>}
    />
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalVisible}>
      <View style={styles.viewModal}>
        <KeyboardAvoidingView style={styles.flexKeyboard} behavior="padding">
        <TextInput           
          style={styles.textInput}
          placeholder="Enter restaurant name"
          value={name}
          onChangeText={setName}
        />
        <Switch value={isNewOpen} onValueChange={setIsNewOpen} />
        <Text>{name}</Text>
        <Text>{isNewOpen ? "Open" : "Closed"}</Text>
        <Button title="Close Form" onPress={() => setModalVisible(false)} />
      </KeyboardAvoidingView>
      </View>
      </Modal>
      <Text>{apiKey}</Text>
    </View>
  );
}

function DetailsScreen({route}) {
  return (
    <View>
      <Text>{route.params.name}</Text>
      <Text>{route.params.cuisine}</Text>
      <Text>{route.params.rating}</Text>
    </View>
  )
}

export default function Navigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: "#fff",
  },
  textInput: {
    backgroundColor: "#fff",
    padding: 8,
    margin: 8,
    borderWidth: 1,
    borderColor: "#555",
    borderStyle: "solid",
  },
  viewModal: {
    backgroundColor: "white",
    padding: 20,
    flex: 1,
  },
  flexKeyboard: {
    flex: 1
  },
  activityIndicatorStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }
})