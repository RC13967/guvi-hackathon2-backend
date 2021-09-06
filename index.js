import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;
async function createconnection() {
  const client = new MongoClient(MONGO_URL)
  await client.connect();
  return client;
}
app.get("/", (request, response) => {
  response.send("This is home page, append appropriate end points");
})
app.get("/movies", async (request, response) => {
  const client = await createconnection();
  const result = await client.db("hack2").collection("movies").find({}).toArray();
  response.send(result);
});
app.get("/users/:username", async (request, response) => {
  const { username } = request.params;
  const client = await createconnection();
  const result = await client.db("hack2").collection("users").find({ username: username }).toArray();
  response.send(result);
})
app.post("/addUser", async (request, response) => {
  const { username, password, halls } = request.body;
  const client = await createconnection();
  const result = await client.db("hack2").collection("users")
    .insertOne({
      "username": username,
      password:password,
      halls:halls
    });
  response.send(result);
});
app.put("/hall/:id", async (request, response) => {
  const { id } = request.params;
  const { username } = request.body;
  const client = await createconnection();
  const result = await client.db("hack2").collection("users")
    .updateOne({
      "username": username
    },
      {
        $pull: {
          "halls": {
            id: id
          }
        }
      });
  response.send(result);
});
app.put("/edithall/:id", async (request, response) => {
  const { id } = request.params;
  const { hallname, title, adress, username } = request.body;
  const client = await createconnection();
  const result1 = await client.db("hack2").collection("users")
    .updateOne({
      username:username,
      "halls.id": id
    },
      {
        $pull: {
          "halls": {
            id: id
          }
        }
      });
  const result = await client.db("hack2").collection("users")
    .updateOne({
      username :username
    },
    {
      $push: {
        "halls": {
          hallname: hallname,
          title: title,
          adress: adress,
          id: id
        }
      }
    })
  response.send(result);
});
app.put("/createhall/:id", async (request, response) => {
  const { id } = request.params;
  const { hallname, title, adress, username } = request.body;
  const client = await createconnection();
  const result = await client.db("hack2").collection("users")
    .updateOne({
      "username": username
    },
      {
        $push: {
          "halls": {
            hallname: hallname,
            title: title,
            adress: adress,
            id: id
          }
        }
      });
  response.send(result);
});
app.listen(PORT, () => console.log("The server is started"));

