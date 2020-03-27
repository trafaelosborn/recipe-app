const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');

// DB
const User = require('../models/User');

// @route   POST api/users
// @desc    Register new user
// @access  Public
router.post('/', (req, res) => {
    const { name, email, password } =  req.body;

    // Simple validation
    if ( !name || !email || !password ) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Check for existing user with the entered email
    // Note: since the variable and field are both called 'email' we can
    // use { email } in place of { email: email } for the query
    User.findOne({ email })
        .then(user => {
            
            // if the query was successful, there is already a user with that email
            if (user) return res.status(400).json({ msg: 'User already exists' });
            // if the email is not in use, create a new user
            const newUser = new User({
                name, 
                email, 
                password
            });
        
            // Create salt & hash
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser.save()
                        .then(user => {
                            // create jsonwebtoken 
                            jwt.sign(
                                { id: user.id },
                                config.get('jwtSecret'),
                                // expires in one hour
                                { expiresIn: 3600 },
                                (err, token) => {
                                    if(err) throw err;
                                    // send token and user object to database.
                                    res.json({
                                        token,
                                        user: {
                                            id: user.id,
                                            name: user.name,
                                            email: user.email
                                        }
                                    });
                                }
                            )                            
                        })
                })
            })
        })
});

module.exports = router;