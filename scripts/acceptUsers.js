require('dotenv').load();
const mongoose = require('mongoose');
const database = process.env.DATABASE || 'mongodb://localhost:27017';
const jwt = require('jsonwebtoken');
mongoose.connect(database);

const UserController = require('../app/server/controllers/UserController');

const user = { email: process.env.ADMIN_EMAIL };

const userArray = require('fs').readFileSync('accepted.txt').toString().split('\n');
let count = 0;
userArray.forEach(function(id) {
  UserController.admitUser(id, user, function() {
    count += 1;
    if (count === userArray.length) {
      console.log('Done');
    }
  });
});
