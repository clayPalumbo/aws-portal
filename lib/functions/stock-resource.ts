import { StockService } from "./services/stock.service";

export const handler = async (event: any): Promise<any> => {
  console.log("Stock lambda", event);
  const stockService = new StockService(event);
  try {
    const body = await stockService.getStocks();
    return {
      isBase64Encoded: false,
      statusCode: 200,
      body: JSON.stringify(body),
    };
  } catch (err) {
    throw Error("stockService failed" + err);
  }
};
