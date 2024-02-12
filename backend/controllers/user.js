const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const register = async (req, res) => {

    const avatar = await cloudinary.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 130,
        crop: 'scale'
    });


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
        password: passwordHash,
        avatar: {
            public_id: avatar.public_id,
            url: avatar.secure_url
        }

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
        const user = await User.findOne({email: req.body.email});
        if(!user){
            return res.status(500).json({message: "User does not exist"});
        }

        const resetToken = crypto.randomBytes(20).toString('hex');

        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
        await user.save({validateBeforeSave: false});

        const passwordUrl = `${req.protocol}://${req.get('host')}/password/reset/${resetToken}`;

        const message = `Your password reset token is as follows: \n\n${passwordUrl}\n\nIf you did not request this, please ignore this email.`;
        try {
            
            const transporter = nodemailer.createTransport({
                port: 465,
                service: 'gmail',
                host: "smtp.gmail.com",
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD
                    },
                secure: true,
            });

            const mailData = {
                from: process.env.EMAIL,
                to: req.body.email,
                subject: 'Password Reset',
                text: message
            }
            await transporter.sendMail(mailData);
            res.status(200).json({message: "Email sent"});

        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({validateBeforeSave: false});
            return res.status(500).json({message: error.message});
        }
}

const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()}
    });
    if(!user){
        return res.status(500).json({message: "Invalid token"});
    }

    user.password = req.bod.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

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

module.exports = {register, login, logout, forgotPassword, resetPassword};