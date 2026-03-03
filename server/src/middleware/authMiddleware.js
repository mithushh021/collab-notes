import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  // ❌ REMOVED: console.log("AUTH HEADER:") — security risk in production, leaks tokens to logs

  let token;

  if (req.headers.authorization?.startsWith("Bearer")) { // ✅ optional chaining cleaner
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      // ✅ Guard: token valid but user deleted from DB
      if (!req.user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};