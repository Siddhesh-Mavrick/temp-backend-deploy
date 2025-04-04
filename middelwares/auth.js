import jwt from 'jsonwebtoken'

const authMiddelware = (req, res, next) => {
    const token = req.cookies.token;

    if(!token) {
        return res.status(400).json({
            message : "Not authenticated",
            success : false
        })
    }

    try{
        const decode = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decode;
        next()
    }
    catch(error) {
        return res.status(401).json({ message: 'Invalid token', success: false });
   }
}

export default authMiddelware