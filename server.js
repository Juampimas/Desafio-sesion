import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import sfs from "session-file-store";
import session from "express-session";
import PassportLocal from "passport-local";
import cluster from "cluster";
import os from "os";
import compression from "compression";
import log4js from "log4js";
import autocannon from "autocannon";
import { PassThrough } from "stream";
import bcrypt from "bcrypt"
import mongoose from "mongoose"
import {createTransport} from "nodemailer"




let LocalStrategy = PassportLocal.Strategy;
const app = express();
const FileStore = sfs(session);
const store = new FileStore({ path: "./sesiones", ttl: 300, retries:0 })



app.set("views", "./views");
app.set("view engine", "pug");

app.use(cookieParser("mi secreto"));
app.use(session({
      secret:"mi secreto",
      resave: true,
      saveUninitialized:true
  }));

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(express.static("./views"));
app.use(express.static("./styles"));

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function(username,password,done){
  if (username === "Juan Pablo" && password === "123456"){
    return done(null, {id:1, nombre:username})
  } else{
    done(null, false)
  }
}))

passport.serializeUser(function(user,done){
  done(null,user.id)
});

passport.deserializeUser(function(id,done){
  done(null,{id:1, nombre:"juan"})
});

// MONGO
const mongo_url = "mongodb://localhost:27017/personas";

mongoose.connect(mongo_url, function(err){
  if (err) {
    throw err
  } else {
    console.log(`Connexión a ${mongo_url} exitosa`);
  }
})

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique:true},
    password: {type: String, required: true}
});

const dbUser = mongoose.model(`users`, userSchema)


app.get("/",(req,res,next)=>{
  if (req.isAuthenticated()){
    return next()
  } else {
    res.redirect("/register")
  }
}, (req,res) => {
    res.render("index")
})

app.get("/register", (req,res) => {
  res.render("register")
})

// app.post("/register", (req,res) => {
//   const user = userSchema(req.body);
//   user  
//     .save()
//     .then((data) => res.json(data))
//     .catch((error) => res.json({message: error}))
//   res.render("login")
// })

app.post("/register", (req,res) => {
  res.redirect("login")
  const {email, password} = req.body;
  const newUser = dbUser.create({email:email, password:password})
  // const newUser = new dbUser({email:email, password:password});
  // newUser.save();
  console.log(newUser);
  
})

function findUserEmail(email){
  if (dbUser.find(email)) {
    return true
  } else {
    return false
  }
}
function findUserPassword(password){
  if (dbUser.find(password)) {
    return true
  } else {
    return false
  }
}

app.get("/login", (req,res) => {
  res.render("login")
})

// const saltRounds = 10;

// userSchema.pre("save", function(next){
//     if(this.isNew || this.isModified("password")){
//         document = this;

//         bcrypt.hash(document.password, saltRounds, (err, hashedPassword) => {
//             if (err) {
//                 next(err);
//             } else {
//                 document.password = hashedPassword;
//                 next();
//             }
//         });
//     } else {
//         next();
//     }
// })

// userSchema.methods.isCorrectPassword = function(candidatePassword, callback){
//     bcrypt.compare(candidatePassword, this.password, function(err, same){
//         if (err) {
//             callback(err)
//         } else {
//             callback(err, same)
//         }
//     })
// }

app.post("/login", (req,res) => {
  const {email, password} = req.body;
  dbUser.findOne({email,password}, (err, user) => {
        if (err) {
          res.status(500).send("ERROR AL AUTENTICAR EL USUARIO")
        } else if(!user){
          res.status(500).send("EL USUARIO NO EXISTE")
        } else {
          res.render("index")
        }
      }) 
})
 

app.get("/carrito", (req,res) => {
  res.render("carrito")
})

// SESSION
// app.post("/login", (req,res) => {
//   const nombre = req.body.nombre;
//   req.session.user = nombre;
//   req.session.admin = true;
//   console.log(req.session);
//   res.render("index", {nombre :nombre})
// })
app.post("/login", passport.authenticate("local",{
  successRedirect:"/",
  failureRedirect:"/login"
}));

app.get("/logout", (req,res) => {
  req.session.destroy(err => {
    if (err) {
        res.json({ status: 'Logout ERROR', body: err })
    } else {
          res.redirect("/")
      }
  })
});


// PUERTO
let port = process.env.PORT || 8080;
app.listen(port);


// NODEMAILER
const transport = createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
      user: 'pansy34@ethereal.email',
      pass: 'qsP2fGBMBr1jx3vS6g'
  }
});

const mailOptions = {
  from:"Servidor Node js",
  to: 'juampim98@gmail.com',
  subject:"Email de prueba",
  html: "<h1>Mail de prueba</h1>"
}

try {
  const info = await transport.sendMail(mailOptions)
  console.log(info);
} catch (error) {
  console.log(error);
}




// CLUSTERS
// const numCPUs = os.cpus().length;

// if (cluster.isPrimary) {
//   console.log(`PID PRIMARIO ${process.pid}`);
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }
//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died`);
//     cluster.fork()
//   })
// } else {
//   const PORT = process.env.port || 3001;
//   app.listen(PORT, () => {
//   console.log(`Servidor escuchando por el puerto ${PORT}`);
// });
// }


// COMPRESSION GZIP
// app.get("/info", (req,res) => {
//   const mensaje = "Sin gzip, "
//   res.send(mensaje.repeat(1000))
// })

// app.get("/infozip",compression(), (req,res) => {
//   const mensajeGzip = "Con gzip, "
//   res.send(mensajeGzip.repeat(1000))
// })

// LOG4JS
// log4js.configure({
//   appenders: {
//     miLoggerConsole: {type: "console"},
//     miLoggerFile: {type: "file", filename: "info.log"},
//     miLoggerFile2: {type: "file", filename: "info2.log"}
//   },
//   categories:{
//     default: {appenders: ["miLoggerConsole"], level: "trace"},
//     consola: {appenders: ["miLoggerConsole"], level: "debug"},
//     archivo: {appenders: ["miLoggerFile"], level: "warn"},
//     archivo2: {appenders: ["miLoggerFile2"], level: "info"},
//     todos: {appenders: ["miLoggerConsole","miLoggerFile"], level: "error"},
//   }
// })

// const logger = log4js.getLogger();

// logger.trace()
// logger.debug()
// logger.info()
// logger.warn()
// logger.error()
// logger.fatal()


// AUTOCANNON
// function run(url){
//   const buf = [];
//   const outputStream = new PassThrough();

//   const inst = autocannon({
//     url,
//     connections: 100,
//     duration: 20
//   })

//   autocannon.track(inst, { outputStream })

//   outputStream.on("data", data => buf.push(data))

//   inst.on("done", () => {
//     process.stdout.write(Buffer.concat(buf))
//   })
// }

// console.log("Running all benchmarks in parallel ...");

// run("http://localhost:3001/")






