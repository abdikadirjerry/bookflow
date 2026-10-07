const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");

dotenv.config();

const createOwner = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = "owner@bookflow.com";
    const password = "ownerpassword123";

    const existingOwner = await User.findOne({
      email,
    });

    if (existingOwner) {
      console.log("Owner account already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const owner = await User.create({
      name: "BookFlow Owner",
      email,
      password: hashedPassword,
      role: "business_owner",
    });

    console.log("Business owner created successfully.");
    console.log(`Email: ${owner.email}`);
    console.log("Password: ownerpassword123");

    process.exit(0);
  } catch (error) {
    console.error("Error creating owner:", error.message);
    process.exit(1);
  }
};

createOwner();
