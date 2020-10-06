require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs= require("ejs");
const _=require("lodash");
const passport=require("passport");
const session=require("express-session");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app=express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine','ejs');

app.use(session({
    secret:"xyz",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb://localhost:27017/shop', {useNewUrlParser: true, useUnifiedTopology: true});
const shop=
{
    upi:String,
    shop_name:String,
    mobile:String,
    address:String,
    googleId:String,
    product:
     [{
         wt:String,
         brand:String,
         name:String,
         barcode:String,
         price:String
     }]
};
const Shop=new mongoose.model("Shop",shop);

const userSchema = new mongoose.Schema({
    email:String,
    passport:String,
    googleId:String
});
userSchema.plugin(findOrCreate);
const User = new mongoose.model('User', userSchema);
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/localcart",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    //   console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
      });
  }
));
    


app.get("/",function(req,res){
    res.render("register");
});
app.get("/logged-in",function(req,res){
    
    if(req.isAuthenticated())
    {
        // console.log(req.user.id);
        res.redirect("/"+req.user.id);
    }else res.redirect("/");
});







app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

 app.get('/auth/google/localcart', 
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/logged-in");
  });

app.get("/add-product",function(req,res){
    res.render("add-order");
});

app.get("/update-data",function(req,res){
   res.render("update");
});
app.post("/update-data",function(req,res){
    Shop.findOneAndUpdate({googleId:req.user.id},
        {
            $set:
            { 
                shop_name:req.body.name, 
                mobile:req.body.mobile,  
                address:req.body.address, 
                upi: req.body.upi
            }
             
        }).then(function (post) {
            console.log(post);
            res.json({success: true});
           });
        res.render("index");
});


/////////////////////////////////////////////

app.get("/my-order",function(req,res){
    res.render("my-order");
});
app.get("/my-product",function(req,res){
    res.render("my-product");
});
app.get("/:custum_name",function(req,res)
{
    Shop.findOne({googleId:req.user.id},function(err,foundlist){
        if(!err)
        {
            if(!foundlist){
                const list=new Shop({
                    googleId:req.user.id
                });
                list.save();
            }
        }
      })
    console.log(req.user.id);
    res.render("index");
})
   
app.post("/add-product",function(req,res){

   Shop.findOne({googleId:req.user.id},function(err,foundlist){
      if(!err)
      {
          if(!foundlist){
              const list=new Shop({
                  googleId:req.user.id
              });
              list.save();
          }
      }
    })
   Shop.findOneAndUpdate({googleId:req.user.id},
   {
    $push:
    {
        product:{
            name:req.body.name, brand:req.body.brand,  wt:req.body.wt, barcode: req.body.barcode , price:req.body.price
        }
    }
     
}).then(function (post) {
        console.log(post);
        res.json({success: true});
       });
  
   res.redirect("/add-product");
});
app.post("/my-order",function(req,res){
    req.body;
});
app.post("/my-product",function(req,res){
    req.body;
});


app.listen(3000,function(){
    console.log("Connected");
});