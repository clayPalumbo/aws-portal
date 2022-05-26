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
  public getStocks = async () => {
    try {
      const response = await fetch(
        `https://alpha-vantage.p.rapidapi.com/query?from_currency=${this.fromCurrency}&function=${this.stockData}&to_currency=${this.toCurrency}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Host": "alpha-vantage.p.rapidapi.com",
            "X-RapidAPI-Key": process.env.STOCK_KEY as string,
          },
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };
}
