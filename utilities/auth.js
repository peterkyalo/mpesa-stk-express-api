export async function getAccessToken(params) {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    // Convert the consumer key and secret to base64
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      "base64"
    );

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Parse the JSON response to get the access token
    const data = await response.json();
    // Check if the access token is present in the response 
    if (!data.access_token) {
      throw new Error("Access token not found in the response");
    }
    // Return the access token
    console.log("Access token retrieved successfully");
    return data.access_token;

  } catch (error) {
    // Log the error to the console
    console.error("Error getting access token:", error);
  }
}
