import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "travel-ai-jwt-secret";

export const requireAuth = (req, res, next) => {
    // 1. Check if authenticated via Session (Passport)
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    // 2. Check if authenticated via JWT (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded; // attach decoded user details (userId, username, email, role) to req.user
            req.user._id = decoded.userId;
            req.user.id = decoded.userId;
            return next();
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    }

    // If neither session nor JWT is valid, deny access
    return res.status(401).json({ message: "Unauthorized" });
};

export const ensureAdmin = (req, res, next) => {
    requireAuth(req, res, () => {
        if (req.user && req.user.role === "admin") {
            return next();
        }
        return res.status(403).json({ message: "Forbidden: Admin access required" });
    });
};
