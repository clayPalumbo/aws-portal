import fetch from "node-fetch";

export class CryptoNewsService {
  newsItems: number;
  constructor(event: any) {
    this.newsItems = event.queryStringParameters.newsItems;
  }

  public getNews = async () => {
    const url = "https://crypto-news-live3.p.rapidapi.com/news";
    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Host": "crypto-news-live3.p.rapidapi.com",
        "X-RapidAPI-Key": process.env.RAPID_API_KEY as string,
      },
    };
    const response = await fetch(url, options).then((res) => res.json());

    return response.slice(0, this.newsItems);
  };
}
