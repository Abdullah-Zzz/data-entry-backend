// models/Data.js
const mongoose = require("mongoose");

const DataSchema = new mongoose.Schema({
  image: String,
  applicationNo: String,
  applicationType: String,
  Name: String,
  passportNo: String,
  TRidentityNumber: String,
  MothersName: String,
  fathersName: String,
  documentValidityStartDate: String,
  documentValidityEndDate: String,
  approvalStatus: Boolean,
  approvalDate: String,
});

module.exports = mongoose.model("Data", DataSchema);
