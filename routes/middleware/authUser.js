import { debug } from 'console';
import jwt from 'jsonwebtoken';

const authenticateUser = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token

  if (!token) {
    return res.status(401).json({ error: 'Please authenticate.' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user information to req.user
    req.user = { userId: decoded.id };
    req.id=decoded.id;
    console.log(decoded.id)
    

    // Call the next middleware or route handler
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export default authenticateUser;
