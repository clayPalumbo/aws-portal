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
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      },
    };
  } catch (err) {
    throw Error("weatherService failed" + err);
  }
};
