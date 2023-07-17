//jshint esversion:6
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');


const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true});

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});


userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})

const User = new mongoose.model("User",userSchema);



app.get('/', (req, res) => {
    res.render("home")
});

app.get('/login', (req, res) => {

    res.render("login")
});

app.get('/Register', (req, res) => {

    res.render("register")
});




app.post('/register',async (req,res) =>{
    const email = req.body.username;
    const password = req.body.password;

    try {
        const existingItem = await User.findOne({ email });
    
        if (existingItem) {
          // Item already exists in the cart
          console.log("user already exist")
        }else{
            const newUser = new User({
                email:email,
                password:password
              });
          
              await newUser.save();
              res.redirect("/login");
        }
    
       
    
       
       
        
      } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(404).send('An error occurred');
      }
})

app.post('/login',async(req, res)=>{

    const email = req.body.username;
    const password = req.body.password;


    User.findOne({email:email}).then((foundUser) => {
        
        if (foundUser){

            if(foundUser.password === password){
                res.render("secrets")
                console.log(foundUser.password)
            }else{
                console.log("wrong password :(")
            }
        }else{
            console.log("Dont have an account :(")
        }
        
      
      
    });
})


app.listen(3000, () => {
    console.log('Server started on port 3000');
  });