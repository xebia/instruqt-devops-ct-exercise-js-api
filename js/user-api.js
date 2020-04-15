// Welcome to the user database

const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const User = require("./models/user-model"); 

const app = express();
const port = process.env.port || 3000;
const bcryptRounds = 12;
const db = process.env.db || 'mongodb://mongo:27017';

mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Adds a new user
app.post('/user', async(req, res) => {
    let newUser = req.body;
    if(typeof newUser.password !== 'undefined')
        newUser.password = bcrypt.hashSync(newUser.password, bcryptRounds);
    new User(newUser).save((err, user) =>
        {
            if (err)
            {
                if(err.code == 11000)
                    res.status(400).send("A user with that username or email already exists.");
                else
                    res.status(400).send("Unable to add user to the database.");
                return;
            }
            
            user["password"] = undefined;
            res.send(user);
        });

});

// Return a list of all users
app.get('/user', async(req, res) => {
    User.find({}, (err, users) => {
        res.send(users);
    });
});

// Return user data for the user for whom the field :search has value :val
app.get('/user/:search/:val', async(req, res) => {
    const search = req.params.search;
    const val = req.params.val;

    // Searching users for the right key value pair
    User.find({[search] : val}, (err, users) => {
        if (users.length === 0)
            return res.status(404).send("User not found");
        return res.send(users);
    });
});

// Removes a user
app.delete('/user/:id', async(req, res) => {
    const id = req.params.id;

    // Remove user
    User.findOneAndDelete({_id:id}, (err, user) => {
        if(err)
            return res.status(404).send("Unable to remove user");
        res.send("User deleted successfully");
    });
    
});

// Replace user data for user :id
app.post('/user/:id', async(req, res) => {
    const id = req.params.id;
    const user = req.body;
    if(typeof user.password !== 'undefined')
        user.password = bcrypt.hashSync(newUser.password, bcryptRounds);
    User.updateOne({_id: id}, user, (err, result) => {
        if(err)
            return res.status(404).send(`Unable to find user ${id}`);
        user["password"] = undefined;
        if(result.n === 0)
            res.status(400).send(`Unable to update user`)
        else
            res.send("User updated successfully");
    });
});

// Checks the username/password combination
// Does NOT return any form of authentication
app.get('/login', async(req, res) => {
    const credentials = req.body;

    User.find({username: credentials.username}, (err, user) =>{
        if (user.length === 0)
            return res.status(404).send('User not found');
        if (bcrypt.compareSync(user.password, credentials.password))
            res.send("Logged in successfully");
        else
            res.status(400).send("Incorrect password");
        return;
    });
});

module.exports = app.listen(port, () => console.log(`Listening on port ${port}!`));
