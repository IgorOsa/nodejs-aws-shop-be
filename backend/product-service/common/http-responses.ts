const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
};

export const httpResponse = (statusCode: number, body: unknown) => {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
};
