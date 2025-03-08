const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
  "Access-Control-Allow-Credentials": true,
};

export const httpResponse = (statusCode: number, body: unknown) => {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
};
