import prisma from "./db.js";
// Function to generate timestamp
const generateTimestamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, "0"); // Days are one-indexed
  const hours = String(date.getHours()).padStart(2, "0"); // Hours are zero-indexed
  const minutes = String(date.getMinutes()).padStart(2, "0"); // Minutes are zero-indexed
  const seconds = String(date.getSeconds()).padStart(2, "0"); // Seconds are zero-indexed

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

export async function stkPush(accessToken, phoneNumber, amount, productName) {
  try {
    const shortCode = process.env.MPESA_SHORTCODE;
    const passKey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;
    const timestamp = generateTimestamp();

    // Generate the password by concatenating the short code, pass key, and timestamp
    const password = Buffer.from(shortCode + passKey + timestamp).toString(
      "base64"
    );

    // Create the request body
    const requestBody = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline", // or "CustomerBuyGoodsOnline" based on your use case
      Amount: amount,
      PartyA: Number(phoneNumber), // The phone number of the customer
      PartyB: shortCode, // The short code of the business
      PhoneNumber: Number(phoneNumber), // The phone number of the customer
      CallBackURL: callbackUrl, // The URL to which the callback will be sent
      AccountReference: "OnlineShop", // A reference for the transaction
      // AccountReference: productName, // A reference for the transaction
      TransactionDesc: `Payment of ${productName}`, // Description of the transaction
    };

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`, // Use the access token for authorization
          "Content-Type": "application/json", // Adjust the content type as necessary
        },
        // Body of the request
        body: JSON.stringify(requestBody),
      }
    );
    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    // Parse the response as JSON
    const data = await response.json();

    // Store the transaction in the database
    await prisma.transaction.create({
      data: {
        CheckoutRequestID: data.CheckoutRequestID, // Assuming this is the ID returned by the API
        amount,
        status: "Pending", // Initial status // Assuming this is the transaction ID returned by the API
      },
    });
    // Return the data received from the API
    return data;
  } catch (error) {
    // Let the error propagate to the route handler
    console.error("Error in stkPush:", error);
    // You can throw the error or handle it as needed
    throw error;
  }
}
