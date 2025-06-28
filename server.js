const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL

app.use(cors({
  origin:CLIENT_URL,
  credentials:true,
}));
app.use(express.json({ limit: '10mb' })); 


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const Data = require("./models/Data");

app.post("/api/data", async (req, res) => {
  try {
    const newData = new Data(req.body);
    await newData.save();
    res.json(newData);
  } catch (err) {
    console.error(err); // more details
    res.status(500).json({ error: "Error saving data" });
  }
});



app.get("/api/data", async (req, res) => {
  try {
    const allData = await Data.find();
    res.json(allData);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving data" });
  }
});

app.get("/api/data/:application",async (req,res)=>{
  try{
    const {application} = req.params
    const data = await Data.find({applicationNo:application}).select("-_id").select("-__v");
    res.status(200).json({data})
  }
  catch(err){
    res.status(500).json({ error: "Error retrieving data" });
    
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});