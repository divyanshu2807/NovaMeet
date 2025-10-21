import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    token: { type: String },
  },
  { timestamps: true }
);

// ✅ Remove any old 'username' index to prevent duplicate error
userSchema.index({ username: 1 }, { unique: false });

const User = mongoose.model("User", userSchema);

export { User };
