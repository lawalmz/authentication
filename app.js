//jshint esversion:6
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
const ejs = require('ejs');
//const encrypt = require('mongoose-encryption');
//const md5 = require('md5')
const bcrypt = require('bcrypt');
const saltRounds = 10;



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


//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})

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




app.post('/register', (req,res) =>{
    const email = req.body.username;
    const password = req.body.password;
    const passwordagain = req.body.passwordagain;

    if (password === passwordagain){

        bcrypt.hash(password,saltRounds,function(err,hash){
      

            User.findOne({email:email}).then((foundUser) => {

                if (foundUser){
                    console.log('already have an accounct (:')
                }else{ 
                    
                        const newUser = new User({
                            email:email,
                            password:hash
                          });
                      
                        newUser.save();
                        res.redirect("/login");
                   
                   
                }
    
            });

        

       
    })

    }else{
        console.log("passwords does not match :(")
        res.redirect("/register")

    }

 


   /* User.findOne({email:email}).then((foundUser) => {
        
        if (foundUser){
            console.log('already have an accounct (:')
        }else{

            if(password === passwordagain){
                const newUser = new User({
                    email:email,
                    password:password
                  });
              
                newUser.save();
                res.redirect("/login");
            }else{
                console.log("passwords does not match :(")
            }
           
        }
        
      
      
    });*/




})

app.post('/login',async(req, res)=>{

    const email = req.body.username;
    const password = req.body.password;

    

        User.findOne({email:email}).then((foundUser) => {
        
            if (foundUser){

                bcrypt.compare(password,foundUser.password,function(err,result){
                    if( result=== true){
                        res.render("secrets")
                    }else{
                        res.render("/login");
                        console.log("wrong password :(")
    
                    }
                })
    
               
            }else{
                console.log("Dont have an account :(")
            }
            
          
          
        });
    
   
})


app.listen(3000, () => {
    console.log('Server started on port 3000');
  });