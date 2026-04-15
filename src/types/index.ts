export interface Restaurant {
  id: string | number;
  name: string;
  cuisine: string;
  rating?: number;
  latitude: number;
  longitude: number;
}
