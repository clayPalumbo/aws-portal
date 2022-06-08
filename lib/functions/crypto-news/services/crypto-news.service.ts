import fetch from "node-fetch";

export class CryptoNewsService {
  newsItems: number;
  currencies: string;
  constructor(event: any) {
    this.newsItems = event.queryStringParameters.newsItems;
    this.currencies = event.queryStringParameters.currencies
  }

  public getNews = async () => {
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${process.env.CRYPTO_PANIC_TOKEN}&currencies=${this.currencies}`;
    const options = {
      method: "GET",
    };
    const response = await fetch(url, options).then((res) => res.json());

    return response.slice(0, this.newsItems);
  };
}
