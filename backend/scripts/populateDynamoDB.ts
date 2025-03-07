import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { products } from "../product-service/mocks/products";
import { stocks } from "../product-service/mocks/stocks";

const client = new DynamoDBClient({ region: "eu-central-1" });

async function populateTables(): Promise<void> {
  for (const product of products) {
    const putProduct = new PutItemCommand({
      TableName: "products",
      Item: {
        id: { S: product.id },
        title: { S: product.title },
        description: { S: product.description },
        price: { N: product.price.toString() },
      },
    });

    try {
      await client.send(putProduct);
      console.log(`Product ${product.title} added successfully.`);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  }

  for (const stock of stocks) {
    const putStock = new PutItemCommand({
      TableName: "stocks",
      Item: {
        product_id: { S: stock.product_id },
        count: { N: stock.count.toString() },
      },
    });

    try {
      await client.send(putStock);
      console.log(`Stock for product ${stock.product_id} added successfully.`);
    } catch (error) {
      console.error("Error adding stock:", error);
    }
  }
}

async function main(): Promise<void> {
  await populateTables();
}

main();
