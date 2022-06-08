import { ExampleService } from "./services/example.service";

export const handler = async (event: any) => {
  console.log("Example: ", event);
  try {
    const exampleService = new ExampleService(event);
    const body = await exampleService.getExample();
    return {
      isBase64Encoded: false,
      statusCode: 200,
      body: JSON.stringify(body),
    };
  } catch (error) {
    throw new Error("Example failed: " + error);
  }
};
