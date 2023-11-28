# PayerURL Integration for Node.js Applications

This guide provides step-by-step instructions for integrating PayerURL into your Node.js application, using Express.js for demonstration purposes.

## Prerequisites

1. Obtain your API public key and secret key from the [PayerURL website](https://dashboard.payerurl.com/).

## Request Setup

### Step 1: Install Node.js and Set Up Express.js

Follow the instructions at [Express.js](https://expressjs.com/) to set up your Express.js application.

### Step 2: Define Payment Route

Define a route for payment requests (e.g., "request" route).

### Step 3: Define Response Route

Define a response route to handle successful payment responses.

### Step 4: Prepare Request Object

Prepare an object with payment details:

```javascript
const paymentRequest = {
  order_id: 1922658446,
  amount: 123,
  items: [
    {
      name: "Order item name",
      qty: "1",
      price: "123",
    },
  ],
  currency: "usd",
  billing_fname: "Mohi Uddin",
  billing_lname: "Mahim",
  billing_email: "mahim@gmail.com",
  redirect_to: "http://localhost:3000/success",
  notify_url: "http://localhost:4000/response",
  cancel_url: "http://localhost:3000/cancel",
  type: "php",
};
```
# "order_id" must be unique
Make sure the request object is containing all the parameters.
			 
You need to provide the success page and cancel page url of your frontend application as shown.
Make sure to send the response url (In which you will get the response from payerURL about the payment.) of your backend application as shown.

### Step 5: Write a View for the Request Route

In your Express.js application, create a view for the payment request route. Sort the object keys, build the query string, create an HMAC signature, and encode it in base64.

```javascript
// Sort the object keys in ascending order
const sortedArgsKeys = {};
Object.keys(paymentRequest)
  .sort()
  .forEach((key) => {
    sortedArgsKeys[key] = paymentRequest[key];
});

// Build the required query string
function buildQueryString(obj, prefix) {
  let queryString = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const propName = prefix ? `${prefix}[${key}]` : key;
      if (value !== null && typeof value === "object") {
        queryString.push(buildQueryString(value, propName));
      } else {
        queryString.push(`${propName}=${encodeURIComponent(value)}`);
      }
    }
  }
  queryString = queryString.join("&");
  const argsString = new URLSearchParams(queryString).toString();
  return argsString;
}

// Create HMAC signature with sha256 hash
const argsString = buildQueryString(sortedArgsKeys);
const signature = crypto
  .createHmac("sha256", securityKey)
  .update(argsString)
  .digest("hex");

// Create auth string in base64 format
const authStr = btoa(`${publicKey}:${signature}`);
```

### Step 6: Prepare Request Headers and Properties

In this step, you will set up the necessary request headers and make the POST request to PayerURL.

```javascript
// Set up the request headers
const url = "https://test.payerurl.com/api/payment";
const headers = {
  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  Authorization: `Bearer ${authStr}`,
};

// Prepare the request options
const requestOptions = {
  method: "POST",
  headers: headers,
  body: argsString,
};

// Make the request using fetch or axios
const response = await fetch(url, requestOptions);
const reData = await response.json();
```

### Step 7: Get Redirect URL

After making the payment request to PayerURL, you will need to extract the "redirectTO" from the response (`reData`) and send it to the frontend to redirect the user to this URL.


## Response Handling

### Step 1: Decode Authorization Header

In your response route, decode the Authorization header and split the public key and signature.

```javascript
const authStr = req.get("Authorization");
let auth;

if (!authStr || !authStr.startsWith("Bearer ")) {
  const authStrPost = Buffer.from(req.body.authStr, "base64").toString("utf8");
  auth = authStrPost.split(":");
} else {
  const authStrDecoded = Buffer.from(
    authStr.replace("Bearer ", ""),
    "base64"
  ).toString("utf8");
  auth = authStrDecoded.split(":");
}
```

### Step 2: Process Response
Process the PayerURL response and handle various scenarios.

```javascript
if (payerurl_public_key !== auth[0]) {
    const response = { status: 2030, message: "Public key doesn't match" };
    res.status(200).json(response);
  } else {
    const GETDATA = {
      order_id: req.body.order_id,
      ext_transaction_id: req.body.ext_transaction_id,
      transaction_id: req.body.transaction_id,
      status_code: req.body.status_code,
      note: req.body.note,
      confirm_rcv_amnt: req.body.confirm_rcv_amnt,
      confirm_rcv_amnt_curr: req.body.confirm_rcv_amnt_curr,
      coin_rcv_amnt: req.body.coin_rcv_amnt,
      coin_rcv_amnt_curr: req.body.coin_rcv_amnt_curr,
      txn_time: req.body.txn_time,
    };

    if (!GETDATA.transaction_id) {
      const response = { status: 2050, message: "Transaction ID not found" };
      res.status(200).json(response);
    } else if (!GETDATA.order_id) {
      const response = { status: 2050, message: "Order ID not found" };
      res.status(200).json(response);
    } else if (GETDATA.status_code === 20000) {
      const response = { status: 20000, message: "Order Cancelled" };
      res.status(200).json(response);
    } else if (GETDATA.status_code !== 200) {
      const response = { status: 2050, message: "Order not complete" };
      res.status(200).json(response);
    } else {
      /********************************************
	Add advanced security checks if needed

        const sortedArgsKeys = {};
        Object.keys(GETDATA)
          .sort()
          .forEach((key) => {
            sortedArgsKeys[key] = GETDATA[key];
          });
        
          const signature = crypto
          .createHmac("sha256", securityKey)
          .update(argsString)
          .digest("hex");

        console.log("signature", signature);

        if(signature !== auth[1]){
          const response = { status: 2030, message: "Signature not matched." };
          res.status(200).json(response);
        }
      *****************************************/

      const data = { status: 2040, message: GETDATA };

      /*********************
	*	 Your custom code here
	*
	*
	****************************/
      // const filename = "payerurl.log";

      fs.appendFile(filename, JSON.stringify(data), (err) => {
        if (err) {
          console.error("Error writing to log file", err);
        }
      });

      res.status(200).json(data);
    }
  }
```

