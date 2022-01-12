const mongoose = require("mongoose");
const validator = require("validator");
const Schema = mongoose.Schema;
const RequestError = require("../errorTypes/RequestError");

const ServiceTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },

  description: {
    type: String,
    required: true,
  },
},
{
  timestamps: true
});

const ServiceType = mongoose.model("ServiceType", ServiceTypeSchema);

module.exports = ServiceType;
