const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const {name, email, password} = req.body;
    
    const user = await User.findOne({email
    });
    if(user){
        return res.status(500).json({message: "User already exists"});
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if(passwordHash.length < 6){
        return res.status(500).json({message: "Password must be at least 6 characters long"});
    }

    const newUser = await User.create({
        name,
        email,
        password: passwordHash
    });

    const token = jwt.sign({id: newUser._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

    const cookieOptions = {
        expires: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }

    res.status(201).cookie('token', token, cookieOptions).json({
        newUser,
        token
    });
}

const login = async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({email})
    if(!user){
        return res.status(500).json({message: "User does not exist"});
    }

    const comparedPassword = await bcrypt.compare(password, user.password);

    if(!comparedPassword){
        return res.status(500).json({message: "Password is incorrect"});
    }

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

    const cookieOptions = {
        expires: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }

    res.status(200).cookie('token', token, cookieOptions).json({
        user,
        token
    });
    
}
const logout = async (req, res) => {

    const cookieOptions = {
        expires: new Date(
            Date.now()
        ),
        httpOnly: true
    }

    res.status(200).cookie('token', null, cookieOptions).json({message: "Logged out"});
}

const forgotPassword = async (req, res) => {
        
}

const resetPassword = async (req, res) => {

}

module.exports = {register, login, logout, forgotPassword, resetPassword};