import { CryptoNewsService } from "./services/crypto-news.service";

export const handler = async (event: any) => {
  console.log("Crytpo news: ", event);
  try {
    const cryptoNewsService = new CryptoNewsService(event);
    const body = await cryptoNewsService.getNews();
    return {
      isBase64Encoded: false,
      statusCode: 200,
      body: JSON.stringify(body),
    };
  } catch (error) {
    throw new Error("Crypto news failed: " + error);
  }
};
