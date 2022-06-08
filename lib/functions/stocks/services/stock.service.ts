import fetch from "node-fetch";

export class StockService {
  event: any;
  queryStringParameters: any;
  fromCurrency: string;
  stockData: string;
  toCurrency: string;

  constructor(event: any) {
    this.setEventParams(event);
  }
  private setEventParams = (event: any) => {
    this.queryStringParameters = event?.queryStringParameters;
    this.fromCurrency = this.queryStringParameters?.from_currency;
    this.stockData = this.queryStringParameters?.function;
    this.toCurrency = this.queryStringParameters?.to_currency;
  };

  // TODO: implement 429 for exceeding api limit
  // TODO: add separate api for stocks to allow more calls a day
  // TODO: break out into two functions for cryto/stocks
  public getEquities = async () => {
    try {
      const response = await fetch(
        `https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/trending/latest`,
        {
          method: "GET",
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };
}
