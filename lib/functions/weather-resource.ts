import fetch from "node-fetch";

export const handler = async (event: any) => {
  console.log("Weather lambda", event);
  const data = await fetch(
    "http://api.weatherapi.com/v1/forecast.json?key=4372bc2acb21401d89e203657222405&q=28031&days=1&aqi=no&alerts=no"
  );
  return weatherMapper(data);
};

export const weatherMapper = (data: any) => {
  const icon = data.current.condition.icon.slice(2);
  return {
    location: data.location.name,
    condition: data.current.condition.text,
    wind: data.current.wind_mph,
    icon: icon,
    forecast: data.forecast,
  };
};
