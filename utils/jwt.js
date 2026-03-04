import jwt from "jsonwebtoken";

// Temp token after phone submit
export const generateTempToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      phoneNumber: user.phoneNumber
    },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
};

// Final login token
export const generateFinalToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      phoneNumber: user.phoneNumber,
      category: user.category
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};