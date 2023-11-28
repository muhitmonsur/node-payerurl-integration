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
  //       name: "Order item name",
  //       qty: "1",
  //       price: "123"
  //     }
  //   ],
  //   currency: "usd",
  //   billing_fname: "Mohi Uddin",
  //   billing_lname: "Mahim",
  //   billing_email: "Mahim@gmail.com",
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
  const secretKey = "0a634fc47368f55f1f54e472283b3acd";
  const publicKey = "de1e85e8a087fed83e4a3ba9dfe36f08";

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
  // const url = "https://test.payerurl.com/api/payment";
  const url = "https://dashboard.payerurl.com/api/payment";
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

app.post("/response", (req, res) => {
  const payerurl_secret_key = "0a634fc47368f55f1f54e472283b3acd";
  const payerurl_public_key = "de1e85e8a087fed83e4a3ba9dfe36f08";
  // const data = req.body;
  console.log("data", req.body);
  // const filename = "payerurl.log";
  // if (data) {
  //   fs.appendFile(filename, JSON.stringify(req.body), (err) => {
  //     if (err) {
  //       console.error("Error writing to log file", err);
  //     } else {
  //       console.log("printed to file");
  //     }
  //   });
  // }
  const authStr = req.get("Authorization");

  let auth;
  if (!authStr || !authStr.startsWith("Bearer ")) {
    const authStrPost = Buffer.from(req.body.authStr, "base64").toString(
      "utf8"
    );
    auth = authStrPost.split(":");
  } else {
    const authStrDecoded = Buffer.from(
      authStr.replace("Bearer ", ""),
      "base64"
    ).toString("utf8");
    auth = authStrDecoded.split(":");
  }

  console.log("auth", auth);

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
      /*Add advanced security checks if needed

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
      */

      const data = { status: 2040, message: GETDATA };
      console.log("in positive ", data);

      // Your custom code here

      // const filename = "payerurl.log";

      fs.appendFile(filename, JSON.stringify(data), (err) => {
        if (err) {
          console.error("Error writing to log file", err);
        }
      });

      res.status(200).json(data);
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
