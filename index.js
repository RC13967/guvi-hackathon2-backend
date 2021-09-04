import  express  from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT;
  const MONGO_URL = "mongodb://localhost";
  // const MONGO_URL = process.env.MONGO_URL;
async function genPassword(password){
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(hashedPassword);
  return hashedPassword;
}
function createconnection(){
  const client = new MongoClient(MONGO_URL).connect();
  return client;
}
    app.get("/movies", async (request, response)=>{
      const client = await createconnection();
      const result = await client.db("hack2").collection("movies").find({}).limit(20).toArray();
       response.send(result);
});
app.get("/users/:username", async (request, response)=>{
  const {username} = request.params;
  const client = await createconnection();
      const result = await client.db("hack2").collection("users").find({username:username}).toArray();
     response.send(result);
 })

  app.post("/users/signup", async (request, response)=>{
    const {name, password, avatar} = request.body;
    const hashedPassword = await genPassword(password);
    const client = await createconnection();
    const result = await client.db("flipkart").collection("users").insertOne({name:name,avatar:avatar,password:hashedPassword});

    response.send(result);
})
app.post("/users/login", async (request, response)=>{
  const {name, password} = request.body;
  const user = await searchuserbyname(name);
  const passwordstoredindb = user.password;
  const ispasswordmatch = await bcrypt.compare(password,passwordstoredindb);
 console.log(ispasswordmatch);
 response.send(ispasswordmatch);

  response.send(result);
})
async function searchuserbyname(name){
const client = await createconnection();
const user = await client.db("flipkart").collection("users").find({name:name}).toArray();
return user;
}

    app.get("/users/:id", (request, response)=>{
        const {id} =  request.params;
        console.log("Requesting for the userid:", id);
        let user = users.filter((user)=>user.id == id)
        user = user.length <= 0 ? "no user found" : user;
           response.send(user);
       })
    
    
app.listen(PORT, ()=> console.log("The server is started"));





