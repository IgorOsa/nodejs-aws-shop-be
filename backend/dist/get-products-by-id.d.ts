export declare const handler: (event: any) => Promise<{
    statusCode: number;
    headers: {
        "Content-Type": string;
        "Access-Control-Allow-Headers": string;
        "Access-Control-Allow-Origin": string;
        "Access-Control-Allow-Methods": string;
    };
    body: string;
}>;
