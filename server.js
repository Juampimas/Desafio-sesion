import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import sfs from "session-file-store";
import session from "express-session";
import PassportLocal from "passport-local";
import cluster from "cluster";
import os from "os";

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


app.get("/",(req,res,next)=>{
  if (req.isAuthenticated()){
    return next()
  } else {
    res.redirect("/login")
  }
}, (req,res) => {
    res.render("index")
})

app.get("/login", (req,res) => {
    res.render("login")
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
// const PORT = process.env.port || 3001;
// app.listen(PORT, () => {
//   console.log(`Servidor escuchando por el puerto ${PORT}`);
// });


// CLUSTERS
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`PID PRIMARIO ${process.pid}`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork()
  })
} else {
  const PORT = process.env.port || 3001;
  app.listen(PORT, () => {
  console.log(`Servidor escuchando por el puerto ${PORT}`);
});
}

