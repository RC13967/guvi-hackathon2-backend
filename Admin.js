import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { createConnection } from "./index.js";
const router1 = express.Router();
router1.post("/getAdmin", async (request, response) => {
  const { email, password } = request.body;
  const client = await createConnection();
  const admin = await client.db("hack2").collection("admins").find({ email: email }).toArray();
  if (admin.length > 0) {
    const passwordstoredindb = admin[0].password;
    const loginFormPassword = password;
    const ispasswordmatch = await bcrypt.compare(loginFormPassword, passwordstoredindb);
    if (ispasswordmatch) {
      response.send({ message: "success" });
    } else {
      response.send({ message: "invalid login" });
    }
  } else {
    response.send({ message: "invalid login" });
  }
});
router1.post("/checkAdminEmail", async (request, response) => {
  const { email } = request.body;
  const client = await createConnection();
  const admin = await client.db("hack2").collection("admins").find({ email: email }).toArray();
  if (admin.length > 0) {
    response.send({ message: "This email is not available. Try another" });
  } else {
    response.send({ message: "This email is available" });
  }
});
router1.post("/AdminSignUp", async (request, response) => {
  const { email, password, firstName, lastName } = request.body;
  const token = jwt.sign({ email: email }, process.env.MY_SECRET_KEY);
  const url = `https://guvi-hackathon2-ranjith.netlify.app/activateAdmin/${email}/${token}`;
  const client = await createConnection();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const result = await client.db("hack2").collection("inactiveAdmins").insertOne({
    email: email, password: hashedPassword, firstName: firstName, lastName: lastName, token: token
  });
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      // type: 'OAuth2',
    user: process.env.MAIL_USERNAME,
    // pass: process.env.MAIL_PASSWORD,
    pass: process.env.APP_PASSWORD,
    // clientId: process.env.OAUTH_CLIENTID,
    // clientSecret: process.env.OAUTH_CLIENT_SECRET,
    // refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
  });
  let mailOptions = {
    from: 'ranjithch137@gmail.com',
    to: email,
    subject: 'Account activation link',
    html: `<a href =  "${url}">Click this link to activate the account </a>`
  };
  transporter.sendMail(mailOptions, async function (err, data) {
    if (err) {
      response.send("Error " + err);
    } else {
      response.send({ message: 'Activation link is sent to the mail. Please click the link to complete the registration' });
    }
  });

});
router1.put("/activateAdmin/:email/:token", async (request, response) => {
  const { email, token } = request.params;
  const client = await createConnection();
  const user = await client.db("hack2").collection("inactiveAdmins").find({ email: email, token: token }).toArray();
  if (user.length > 0) {
    await client.db("hack2").collection("admins").insertOne({
      email: user[0].email, password: user[0].password, firstName: user[0].firstName, lastName: user[0].lastName
    });
    await client.db("hack2").collection("inactiveAdmins").deleteMany({ email: email, token: token });
    response.send({ message: 'activate account' });
  } else {
    response.send({ message: 'invalid url' });
  }

});
router1.post("/forgotAdmin", async (request, response) => {
  const { email } = request.body;
  const currentTime = new Date();
  const expireTime = new Date(currentTime.getTime() + 5 * 60000);
  const client = await createConnection();
  const user = await client.db("hack2").collection("admins").find({ email: email }).toArray();
  if (user.length > 0) {
    const token = jwt.sign({ email: email }, process.env.MY_SECRET_KEY);
    await client.db("hack2").collection("admins").updateOne({ email: email },
      {
        $set: { token: token, expireTime: expireTime }
      });
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        // type: 'OAuth2',
      user: process.env.MAIL_USERNAME,
      // pass: process.env.MAIL_PASSWORD,
      pass: process.env.APP_PASSWORD,
      // clientId: process.env.OAUTH_CLIENTID,
      // clientSecret: process.env.OAUTH_CLIENT_SECRET,
      // refreshToken: process.env.OAUTH_REFRESH_TOKEN
      }
    });
    let mailOptions = {
      from: 'ranjithch137@gmail.com',
      to: email,
      subject: 'Reset Password link',
      html: '<a href = "https://guvi-hackathon2-ranjith.netlify.app//retrieveAdmin/' + email + '/' + token + '"> Reset Password Link</a>'
    };
    transporter.sendMail(mailOptions, async function (err, data) {
      if (err) {
        response.send("Error " + err);
      } else {
        response.send({ message: "Email sent successfully" });
      }
    });
  }
  else {
    response.send({ message: "This email is not registered" });
  }
});
router1.get("/retrieveAccountAdmin/:email/:token", async (request, response) => {
  const currentTime = new Date();
  const { email, token } = request.params;
  const client = await createConnection();
  const user = await client.db("hack2").collection("admins").find({ email: email }).toArray();
  if (user.length > 0) {
    const tokenInDB = user[0].token;
    if (token == tokenInDB) {
      if (currentTime > user[0].expireTime) {
        response.send({ message: "link expired" });
      } else {
        response.send({ message: "retrieve account" });
      }

    } else {
      response.send({ message: "invalid authentication" });
    }
  }
  else {
    response.send({ message: "Invalid account" });
  }
});
router1.put("/resetPasswordAdmin/:email/:token", async (request, response) => {
  const currentTime = new Date();
  const { email, token } = request.params;
  const { newPassword } = request.body;
  const client = await createConnection();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  const user = await client.db("hack2").collection("admins").find({ email: email, token: token }).toArray();
  if (!user[0]) {
    response.send({ message: "invalid url" });
  } else {
    const expireTime = user[0].expireTime;
    if (currentTime > expireTime) {
      response.send({ message: "link expired" });
    } else {
      const result = await client.db("hack2").collection("admins").updateOne({
        email: email,
        token: token
      },
        {
          $set: {
            password: hashedPassword
          },
          $unset: {
            token: "",
            expireTime: ""
          }
        });
      response.send({ message: "password updated" });
    }
  }
});
export { router1};