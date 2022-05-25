import fetch from "node-fetch";
import { WeatherResponse } from "../../models/weather.model";

export class WeatherService {
  constructor() {}

  public getWeather = async (): Promise<WeatherResponse> => {
    const response = await fetch(
      `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_KEY}&q=28031&days=1&aqi=no&alerts=no`
    );
    const data = await response.json();
    return this.weatherMapper(data);
  };

  private weatherMapper = (data: any): WeatherResponse => {
    // extract needed forecast data before returning it.
    const current = data.current;
    const icon = current.condition.icon.slice(2);
    return {
      location: data.location.name,
      condition: current.condition.text,
      wind: current.wind_mph,
      temp: current.temp_f,
      feelsLike: current.feelslike_f,
      icon: icon,
      forecast: data.forecast,
    };
  };
}
