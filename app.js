const express = require("express");
const crypto = require("crypto");
const fs = require("fs");

const port = 4000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send({ message: "Howdy!" });
});

//build the query string
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

app.post("/request", async (req, res) => {
  //get data from front end

  //////sample object//////////
  //********************* */
  // {
  //   order_id: 1922658446,
  //   amount: 123,
  //   items: [
  //     {
  //       name: 'Test_Order', // no whitespace allow here
  //       qty: "1",
  //       price: "123"
  //     }
  //   ],
  //   currency: "usd",
  //   billing_fname: "test_billing_fname",
  //   billing_lname: "test_billing_lname",
  //   billing_email: "billing_email@gmail.com",
  //   redirect_to: "http://localhost:3000/success",  // url of your front end application success page
  //   notify_url: "http://localhost:4000/response", // you will receive response from prayerURL in this link should handle POST request
  //   cancel_url: "http://localhost:3000/cancel",   // url of your front end application for cancel payment page
  //   type: "php"
  // }
  //************************** */
  // post this data in json format to this endpoint of your server
  /////////
  const data = req.body;
  //sort the data order by key
  const sortedArgsKeys = {};
  Object.keys(data)
    .sort()
    .forEach((key) => {
      sortedArgsKeys[key] = data[key];
    });
  console.log("sortedArgsKeys", sortedArgsKeys);

  const argsString = buildQueryString(sortedArgsKeys);
  //argsString will be the payload

  //get your own secret key and private key
  // you can use it from environment variables
  const secretKey = "your_secret_api_key";
  const publicKey = "your_public_api_key";

  // generate signature
  const signature = crypto
    .createHmac("sha256", secretyKey)
    .update(argsString)
    .digest("hex");
  console.log("signature", signature);

  // crete auth string with base64 format
  const authStr = btoa(`${publicKey}:${signature}`);
  console.log(authStr);

  // make request to payerURL
  const url = "https://api-v2.payerurl.com/api/payment";
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    Authorization: `Bearer ${authStr}`,
  };

  const requestOptions = {
    method: "POST",
    headers: headers,
    body: argsString,
  };

  try {
    const response = await fetch(url, requestOptions);
    const reData = await response.json();
    console.log(reData);

    //*************************************

    // your code headers

    // for example save the data you got from front end to db or log them

    //***********************************

    // add your data and redirect url and send it to response object
    const responseData = {
      redirect_url: reData.redirectTO,
    };

    res.send(responseData);
  } catch (error) {
    // Handle network or fetch API errors
    console.error("Request failed:", error);
  }
});

//*************************************************************   contact us telegram : @payerurl to get response function ************************************************//  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
