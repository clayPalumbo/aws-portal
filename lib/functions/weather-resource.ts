import { WeatherResponse } from "../models/weather.model";
import { WeatherService } from "./services/weather.service";

export const handler = async (event: any): Promise<WeatherResponse> => {
  console.log("Weather lambda", event);
  const weatherService = new WeatherService();

  try {
    return await weatherService.getWeather();
  } catch (err) {
    throw Error("weatherService failed" + err);
  }
};
