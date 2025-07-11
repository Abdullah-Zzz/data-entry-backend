const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken")
const cookie_parser = require("cookie-parser")

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(cookie_parser())
app.use(express.json({ limit: '10mb' }));


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const Data = require("./models/Data");

const auth = (req, res, next) => {
  const token = req.cookies.adminToken
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("adminToken")
    return res.status(401).json({ message: "Invalid or expired token" });
  }

}

app.post("/api/data", async (req, res) => {
  try {
    const newData = new Data(req.body);
    await newData.save();
    return res.json(newData);
  } catch (err) {
    console.error(err); // more details
    return res.status(500).json({ error: "Error saving data" });
  }
});



app.get("/api/data", async (req, res) => {
  try {
    const allData = await Data.find();
    allData.TRidentityNumber = ""
    return res.json(allData);
  } catch (error) {
    return res.status(500).json({ error: "Error retrieving data" });
  }
});

app.get("/api/data/application", async (req, res) => {
  try {
    const { ap } = req.query
    const data = await Data.find({ applicationNo: ap }).select("-_id").select("-__v");
    data[0].TRidentityNumber = ""
    return res.status(200).json({ data })
  }
  catch (err) {
    return res.status(500).json({ error: "Error retrieving data" });

  }
})
app.post("/api/admin/login", (req, res) => {

  try {
    const { password } = req.body
    if (password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ user: "admin", createdAt: Date.now() }, process.env.JWT_SECRET_KEY, {
        expiresIn: "7d"
      })
      
      res.cookie("adminToken", token, {
        secure: process.env.NODE_ENV === "production", 
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      return res.status(200).json({ message: "Logged in" })
    }
    return res.status(401).json({ message: "forbidden" })
  }
  catch (err) {
    return res.status(500).json({ error: "Error retrieving data" });

  }
})

app.get("/api/admin/data", auth, async (req, res) => {
  try {
    const data = await Data.find()
    return res.status(200).json(data)
  } 
  catch (err) {
    res.status(500).json({ error: "Error retrieving data" });
  }
})

app.put("/api/admin/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      applicationNo,
      applicationType,
      Name,
      passportNo,
      TRidentityNumber,
      MothersName,
      fathersName,
      documentValidityStartDate,
      documentValidityEndDate,
      approvalStatus,
      approvalDate
    } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    const data = await Data.findById(id);
    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }

    if (applicationNo !== undefined) data.applicationNo = applicationNo;
    if (applicationType !== undefined) data.applicationType = applicationType;
    if (Name !== undefined) data.Name = Name;
    if (passportNo !== undefined) data.passportNo = passportNo;
    if (TRidentityNumber !== undefined) data.TRidentityNumber = TRidentityNumber;
    if (MothersName !== undefined) data.MothersName = MothersName;
    if (fathersName !== undefined) data.fathersName = fathersName;
    if (documentValidityStartDate !== undefined) data.documentValidityStartDate = documentValidityStartDate;
    if (documentValidityEndDate !== undefined) data.documentValidityEndDate = documentValidityEndDate;
    if (approvalStatus !== undefined) data.approvalStatus = approvalStatus;
    if (approvalDate !== undefined) data.approvalDate = approvalDate;

    try {
      await data.validate();
    } catch (validationError) {
      return res.status(400).json({ 
        message: "Validation failed",
        errors: validationError.errors 
      });
    }

    const updatedData = await data.save();

    res.status(200).json({
      message: "Data updated successfully",
      data: updatedData
    });

  } catch (err) {
    console.error("Error updating data:", err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    res.status(500).json({ 
      message: "Error updating data",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.delete("/api/admin/delete/:id",async(req,res)=>{
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const data = await Data.findById(id);
    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }
    await Data.findByIdAndDelete(id)
    return res.status(200).json({
      message: "Data deleted successfully",
    });
  
})
app.get("/api/admin/logout",async(req,res)=>{
  try{
    res.clearCookie("adminToken")
    return res.status(200).json({
      message: "Data deleted successfully",
    });
  }
  catch(err){
    res.status(500).json({ 
      message: "Error updating data",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});