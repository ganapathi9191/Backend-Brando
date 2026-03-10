import jwt from "jsonwebtoken";

// Temp token — after phone number submitted (before OTP verified)
export const generateTempToken = (user) => {
  return jwt.sign(
    { userId: user._id, mobileNumber: user.mobileNumber, stage: "pre-otp" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
};

// Final token — after OTP verified
export const generateFinalToken = (user) => {
  return jwt.sign(
    { userId: user._id, mobileNumber: user.mobileNumber, stage: "verified" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};