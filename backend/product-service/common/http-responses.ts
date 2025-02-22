const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "https://d2qorf0xmzna5y.cloudfront.net",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
};

export const httpResponse = (statusCode: number, body: unknown) => {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
};
