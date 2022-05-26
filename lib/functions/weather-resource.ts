import { WeatherResponse } from "../models/weather.model";
import { WeatherService } from "./services/weather.service";

export const handler = async (event: any): Promise<any> => {
  console.log("Weather lambda", event);
  const weatherService = new WeatherService(event);
  try {
    const body = await weatherService.getWeather();
    return {
      isBase64Encoded: false,
      statusCode: 200,
      body: JSON.stringify(body),
    };
  } catch (err) {
    throw Error("weatherService failed" + err);
  }
};
