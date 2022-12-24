import express from 'express'
import morgan from 'morgan'
import { AppDataSource } from "./data-source"

const app = express();

//configure express
app.use(express.json()); //for json response
app.use(morgan('dev')); //morgan - dev module

//////////api//////////
app.get('/', (_,res)=>{
    res.send("running");
})

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
