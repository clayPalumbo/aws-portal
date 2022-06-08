import fetch from "node-fetch";
import { Forecast, WeatherResponse } from "../../../models/weather.model";

export class WeatherService {
  event: any;

  constructor(event: any) {
    this.event = event;
  }

  public getWeather = async (): Promise<WeatherResponse> => {
    try {
      const response = await fetch(
        `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_KEY}&q=${this.event.queryStringParameters.location}&days=1&aqi=no&alerts=no`
      );
      const data = await response.json();
      return this.weatherMapper(data);
    } catch (error) {
      throw new Error("Failed to get weather: " + error);
    }
  };

  private weatherMapper = (weather: any): WeatherResponse => {
    const current = weather.current;
    const icon = current?.condition.code;
    const localTime = new Date(weather.location.localtime).getHours();
    const refinedForecast = this.getRefinedForecast(
      weather.forecast.forecastday[0],
      localTime
    );
    return {
      condition: current.condition.text,
      location: weather.location.name,
      feelsLike: current.feelslike_f,
      wind: current.wind_mph,
      windDirection: current.wind_dir,
      temp: current.temp_f,
      icon: icon,
      uv: current.uv,
      forecast: refinedForecast,
    };
  };

  private getRefinedForecast = (forecast: any, localTime: number): Forecast => {
    const closeHours = forecast.hour.slice(localTime, localTime + 6);
    const day = forecast.day;

    const refinedForecast = closeHours.map((hour: any) => {
      return {
        condition: hour.condition.code,
        chanceOfRain: hour.chance_of_rain,
        temp: hour.temp_f,
        wind: hour.wind,
        time: hour.time_epoch,
      };
    });

    return {
      nextFewHours: refinedForecast,
      high: day.maxtemp_f,
      low: day.mintemp_f,
    };
  };
}
