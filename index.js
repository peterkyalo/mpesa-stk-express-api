import express from "express";
import dotenv from "dotenv";
import { getAccessToken } from "./utilities/auth.js"; // Adjust the path as necessary
import { stkPush } from "./utilities/stkPush.js";
import prisma from "./utilities/db.js";

dotenv.config(); // Load environment variables

// Create express app
const app = express();

// Add middleware to parse JSON request bodies
app.use(express.json());

// Welcome route
app.get("/", (req, res) => {
  res.send("<h1>Welcome to Safaricom M-Pesa Express API</h1>");
}); // This is a simple route that responds with a welcome message
// This route is accessible at the root URL ("/") and returns a simple HTML message

// initialte stk push
app.post("/initiate-stk-push", async (req, res) => {
  try {
    const { phoneNumber, amount, productName } = req.body;

    // Database logic to save the transaction can be added here
    // Status - "Pending"

    // Get access token
    const accessToken = await getAccessToken();
    // console.log("Access Token:", accessToken);
    if (!accessToken) {
      return res.status(500).send("Failed to retrieve access token");
    }

    // Initiate STK push
    const initiateStkResponse = await stkPush(
      accessToken,
      phoneNumber,
      amount,
      productName
    );
    // Store the transaction in the database

    // Here you would typically use the access token to make a request to the MPESA API
    res.status(200).json({
      success: true,
      initiateStkResponse,
    });

    // Logic to initiate STK push
  } catch (error) {
    console.error("Error initiating STK push:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate STK push",
    });
  }
});

// callback endpoint
app.post("/callback", async (req, res) => {
  try {
    // Log the full request body for debugging
    console.log("Received callback POST /callback");
    console.log("Full request body:", JSON.stringify(req.body, null, 2));
    // Correctly extract the callback data
  const {stkCallback} = req.body.Body;
    console.log("STK Callback Data:", stkCallback);
    let status = null;
    if (stkCallback.ResultCode === 0) {
      status = "Success";
    } else {
      status = "Failed";
    }
    // Database logic to save the callback data can be added here
    if (stkCallback.CheckoutRequestID) {
      await prisma.transaction.update({
        where: {
          CheckoutRequestID: stkCallback.CheckoutRequestID,
        },
        data: {
          status: status, // Update the status based on the callback data
        },
      });
    }
    res.json({
      status,
      stkCallback,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to handle callback",
    });
  }
});

// Create server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
