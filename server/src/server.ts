import express from 'express'
import morgan from 'morgan'
import { AppDataSource } from "./data-source"
import authRoutes from "./routes/auth"
import cors from 'cors'
import dotenv from 'dotenv'

const app = express();
const origin = "http://localhost:3000"

//configure express
app.use(express.json()); //for json response
app.use(morgan('dev')); //morgan - dev module
app.use(cors({
    origin,
    credentials: true
}))

dotenv.config()

//////////api//////////
app.get('/', (_,res)=>{
    res.send("running");
})
app.use("/api/auth",authRoutes)
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
