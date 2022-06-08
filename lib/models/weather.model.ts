export interface WeatherResponse {
  location: string;
  condition: string;
  wind: string;
  windDirection: string;
  temp: string;
  feelsLike: string;
  icon: string;
  uv: string;
  forecast: any;
}

export interface Forecast {
  nextFewHours: any;
  high: string;
  low: string;
}
