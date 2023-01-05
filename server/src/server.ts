import express from 'express'
import morgan from 'morgan'
import { AppDataSource } from "./data-source"
import authRoutes from "./routes/auth"
import subRoutes from "./routes/subs"
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';

const app = express();
const origin = "http://localhost:3000"

//configure express
app.use(express.json()); //for json response
app.use(morgan('dev')); //morgan - dev module
app.use(cors({
    origin,
    credentials: true
}))
app.use(cookieParser())
app.use(express.static("public"))

dotenv.config()

//////////api//////////
app.get('/', (_,res)=>{
    res.send("running");
})
app.use("/api/auth",authRoutes)
app.use("/api/subs",subRoutes)

///////////////////////

//port
let port = 4000;

//start app
app.listen(port,async () => {
    console.log(`Server running at http://localhost:${port}`);

    //DB connection
    AppDataSource.initialize().then( () => {
        console.log("database initialized");
        
    }).catch(error => console.log(error))
    
})
