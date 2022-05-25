import fetch from "node-fetch";
import { WeatherResponse } from "../../models/weather.model";

export class WeatherService {
  data: any;
  constructor() {}

  public getWeather = async (): Promise<WeatherResponse> => {
    this.data = await fetch(
      "http://api.weatherapi.com/v1/forecast.json?key=4372bc2acb21401d89e203657222405&q=28031&days=1&aqi=no&alerts=no"
    );
    return this.weatherMapper(this.data);
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
