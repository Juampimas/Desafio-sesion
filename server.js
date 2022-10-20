import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import sfs from "session-file-store";

const app = express();
const FileStore = sfs(session);
const store = new FileStore({ path: "./sesiones", ttl: 300, retries:0 })


app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(express.static("./views"));
app.use(express.static("./styles"));


app.get("/", (req,res) => {
    res.render("index")
})

app.get("/login", (req,res) => {
    res.render("login")
})


// SESSION
app.use(session({
    store,
    secret: "123456", 
    resave:false,
    saveUninitialized: false,
    ttl:300,
    maxAge:300
}))
app.post("/login", (req,res) => {
  const nombre = req.body.nombre;
  req.session.user = nombre;
  req.session.admin = true;
  console.log(req.session);
  res.render("index", {nombre :nombre})
})


app.get("/logout", (req,res) => {
  req.session.destroy(err => {
    if (err) {
        res.json({ status: 'Logout ERROR', body: err })
    } else {
          res.render("index")
      }
  })
})


// PUERTO
const PORT = process.env.port || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando por el puerto ${PORT}`);
});