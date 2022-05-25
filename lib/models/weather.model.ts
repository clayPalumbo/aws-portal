export interface WeatherResponse {
  location: string;
  condition: string;
  wind: string;
  temp: string;
  feelsLike: string;
  icon: string;
  forecast: any;
}

export interface Forecast {
  nextFewHours: any;
  high: string;
  low: string;
}
