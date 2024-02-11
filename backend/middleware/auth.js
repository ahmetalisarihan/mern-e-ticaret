const User = require('../models/user');
const jwt = require('jsonwebtoken');



const authenticationMid = async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(500).json({ message: "Unauthorized" });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedData) {
        return res.status(500).json({ message: "Unauthorized" });
    }

    req.user = await User.findById(decodedData.id);
    next();
}

const roleChecked = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(500).json({ message: "Unauthorized!!!" });
        }
        next();
    }
}

module.exports = {authenticationMid, roleChecked};