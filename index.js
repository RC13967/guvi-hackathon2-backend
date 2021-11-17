import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config();
import cors from "cors";
import { compare } from "bcrypt";
import { router1 } from "./Admin.js";
import { router2 } from "./Client.js";
export const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;
  // var dates = [];
  // var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // for (let i=0;i<6;i++){
  //  dates.push(days[new Date(new Date().setDate(new Date().getDate() + i)).getDay()]
  // + " " + new Date(new Date().setDate(new Date().getDate() + i)).getDate())
  // }
  var dates = ['Sun 14', 'Mon 15', 'Tue 16', 'Wed 17', 'Thu 18', 'Fri 19'];
export async function createConnection() {
  const client = new MongoClient(MONGO_URL)
  await client.connect();
  return client;
}
app.get("/", (request, response) => {
  response.send("This is home page, append appropriate end points");
})
app.post("/halls", async (request, response) => {
  const { email } = request.body;
  const client = await createConnection();
  const admin = await client.db("hack2").collection("admins").find({ "email": email }).toArray();
  if (admin.length > 0) {
    response.send(admin[0].halls);
  }
});
app.post("/checkHall", async (request, response) => {
  const { hallname, adress } = request.body;
  const client = await createConnection();
  const user = await client.db("hack2").collection("admins").find({
    "halls.hallname": hallname, "halls.adress": adress,
  }).toArray();
  if (user.length > 0) {
    response.send({ message: "This hall details is not available. Try another" });
  } else {
    response.send({ message: "This hall details is available" });
  }
});
app.put("/addHall", async (request, response) => {
  const { hallname, adress, admin } = request.body;
  const client = await createConnection();
  const result = await client.db("hack2").collection("admins")
    .updateOne({
      email: admin
    },
      {
        $push: {
          "halls": {
            hallname: hallname,
            adress: adress,
          }
        }
      })
  response.send(result)

});
app.put("/deleteHall", async (request, response) => {
  const { admin, hallname, adress } = request.body;
  const client = await createConnection();
  const result = await client.db("hack2").collection("admins")
    .updateOne({
      email: admin
    },
      {
        $pull: {
          "halls": {
            hallname: hallname,
            adress: adress
          }
        }
      });
  response.send(result);
});
app.put("/updateHall", async (request, response) => {
  const { newHallName, newAdress, oldHallName, oldAdress, admin } = request.body;
  const client = await createConnection();
  const result1 = await client.db("hack2").collection("admins")
    .updateOne({
      email: admin
    },
      {
        $pull: {
          "halls": {
            hallname: oldHallName,
            adress: oldAdress
          }
        }
      });
  const result2 = await client.db("hack2").collection("admins")
    .updateOne({
      email: admin
    },
      {
        $push: {
          "halls": {
            hallname: newHallName,
            adress: newAdress
          }
        }
      });
  response.send("updated");
});
app.put("/addMovie", async (request, response) => {
  const { details, admin, theatre, times } = request.body;
  const client = await createConnection();
  const result1 = await client.db("hack2").collection("movies")
    .insertOne({
      id: details.id,
      title: details.title,
      poster: details.poster,
      overview: details.overview,
      release_date: details.release_date,
      genres: [details.genres],
    })
  const result2 = await client.db("hack2").collection("admins")
    .updateOne({
      email: admin
    },
      {
        $pull: {
          "halls": {
            hallname: theatre.hallname,
            adress: theatre.adress,
          }
        }
      });
  const result3 = await client.db("hack2").collection("admins")
    .updateOne({
      email: admin
    },
      {
        $push: {
          "halls": {
            hallname: theatre.hallname,
            adress: theatre.adress,
            movie: {
              id: details.id,
              title: details.title,
              poster: details.poster,
              overview: details.overview,
              release_date: details.release_date,
              genres: [details.genres],
              showTimes:dates.map((date)=>({"date":date,
              "showTimes":times.map((time)=>({"time":time, "bookingDetails":[]}))
            }))
            }
            }
        }
      });
  response.send(result3);
});
app.put("/addExistingMovie", async (request, response) => {
  const { details, admin, theatre, times } = request.body;
  const client = await createConnection();
  const result2 = await client.db("hack2").collection("admins")
    .updateOne({
      email: admin
    },
      {
        $pull: {
          "halls": {
            hallname: theatre.hallname,
            adress: theatre.adress,
          }
        }
      });
  const result3 = await client.db("hack2").collection("admins")
    .updateOne({
      email: admin
    },
      {
        $push: {
          "halls": {
            hallname: theatre.hallname,
            adress: theatre.adress,
            movie: {
              id: details.id,
              title: details.title,
              poster: details.poster,
              overview: details.overview,
              release_date: details.release_date,
              genres: details.genres,
              showTimes:dates.map((date)=>({"date":date,
              "showTimes":times.map((time)=>({"time":time, "bookingDetails":[]}))
            }))
            }
            }
        }
      });
  response.send(result3);
});
app.put("/bookSeats", async (request, response) => {
  const { email, name, bookingDate, hall, newBookedSeats, movie, show} = request.body;
  hall.movie.showTimes.map((el)=>
  {el.date === bookingDate ?(
    el.showTimes.map((shows)=>
    {shows.time===show.time ?
    shows.bookingDetails.push({"email":email, name:name,"seats":newBookedSeats}):""}
    )
  ):""})
  const client = await createConnection();
  const result1 = await client.db("hack2").collection("clients")
    .updateOne({
      email:email
    },{
      $push:{
        "bookingDetails":{
          bookingDate:bookingDate,
          hall:hall.hallname,
          adress:hall.adress,
          seats:newBookedSeats,
          movie:movie,
          showTime:show.time
        }
      }
    })
  const result2 = await client.db("hack2").collection("admins").updateOne(
    {
        halls:{
          $elemMatch:{
            "hallname": hall.hallname,
          }
        }
      
    },
    {
      $set:{
      "halls.$.movie.showTimes": hall.movie.showTimes
    
    }
    }
  )
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
      clientId: process.env.OAUTH_CLIENTID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
  });
  let mailOptions = {
    from: 'ranjithch137@gmail.com',
    to: email,
    subject: 'Booked movie tickets details',
    html: `<div>Name: ${name}</div>
    <div>email: ${email}</div>
    <div>Movie Name: <b>${movie.title}</b></div>
    <div>booked show: <b>${bookingDate, show.time}</b> </div>
    <div>booked seats: <b>${newBookedSeats}</b></div>
    <div>Theatre hall name :<b>${hall.hallname}</b></div> 
    <div>theatre address: ${hall.adress}</div>`
  };
  transporter.sendMail(mailOptions, async function (err, data) {
    if (err) {
      response.send("Error " + err);
    } else {
      response.send({ message: 'booking successfull', results:result2 });
    }
  });
});
app.put("/blockSeats", async (request, response) => {
  const { bookingDate, hall, bookedSeats, newBookedSeats, movie, show, expire} = request.body;
  hall.movie.showTimes.map((el)=>
  {el.date === bookingDate ?(
    el.showTimes.map((shows)=>
    {shows.time===show.time ?
    shows.bookingDetails.push({"seats":newBookedSeats}):""}
    )
  ):""})
  const client = await createConnection();
  const result2 = await client.db("hack2").collection("tempadmin").insertOne(
    
    { 
        "expireAt":new Date(expire),
      hall: hall
    
    }
  )
  response.send({"res":result2})
});
app.get("/movies", async (request, response) => {
  const client = await createConnection();
  const result = await client.db("hack2").collection("movies").find({}).toArray();
  response.send(result);
});
app.post("/getHalls", async (request, response) => {
  let time = new Date();
  const {movie} = request.body;
  const client = await createConnection();
  client.db("hack2").collection("tempadmin").createIndex( { "expireAt": 1 }, { expireAfterSeconds: 0 } );
  const result = await client.db("hack2").collection("admins").aggregate([
    {
      "$unwind": "$halls"
    },
    {
      "$match": {
        "halls.movie.id": movie.id,
        "halls.movie.title": movie.title
      }
    },
    {
      "$project": {
        "_id": 0,
        "halls.hallname": 1,
        "halls.adress": 1,
        "halls.movie":1
        
      }
    },
    {
      "$project": {
        "_id": 0,
        "hallname": "$halls.hallname",
        "adress": "$halls.adress",
        "movie":"$halls.movie"
        
      }
    }
  ]).toArray()
  response.send(result);
});
app.post("/getBlockedSeats", async (request, response) => {
  const {hall} = request.body;
  const client = await createConnection();
  const result = await client.db("hack2").collection("tempadmin").find({
    "hall.hallname":hall.hallname
  }).toArray()
  response.send(result);
});
app.use("/", router2);
app.use("/", router1);
app.listen(PORT, () => console.log("The server is started"));