const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Look at the incoming request headers for the VIP pass
    const authHeader = req.headers.authorization;

    // 2. If there is no header, or it doesn't start with "Bearer ", kick them out.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // 3. Extract the actual token string (Strip away the word "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // 4. Verify the token is real and hasn't expired using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 5. THE MOST IMPORTANT STEP: 
        // We take the decoded user ID from the token and staple it directly to the request object.
        req.user = decoded; 
        
        // 6. Tell Express: "This guy is clear, let him through to appRoutes.js"
        next();
    } catch (error) {
        // If the token is fake, expired, or corrupted, kick them out.
        res.status(403).json({ error: "Invalid or expired token." });
    }
};

module.exports = verifyToken;