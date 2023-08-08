//jshint esversion:6
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
const ejs = require('ejs');
const flash = require('express-flash');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
//const encrypt = require('mongoose-encryption');
//const md5 = require('md5')
//const bcrypt = require('bcrypt');
//const saltRounds = 10;

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');



const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET ,
    resave:false,
    saveUninitialized:false

}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); 




mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true});

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    secret:[String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate); 


//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

/*passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());*/
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID:  process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get('/', (req, res) => {
 
    res.render("home")
});
app.get('/auth/google',
    passport.authenticate("google",{scope:["profile"]})
);

app.get('/login', (req, res) => {

    res.render('login', { error: req.flash('error') });
});

app.get('/Register', (req, res) => {

    res.render("register",{error: req.flash('error')})
});

app.get("/logout", (req, res) => {
    req.logout(req.user, err => {
      if(err) return next(err);
      res.redirect("/");
    });
  });

app.get("/secrets",async(req, res) => {
    if(req.isAuthenticated()){
       // res.render("secrets");

        try {
            const user = await User.findById(req.user.id);
    
            if (user) {
                const userSecrets = user.secret; // Assuming your schema has a "secret" field
               
               res.render("secrets", { userSecrets });
            } else {
                console.log('User not found');
                res.redirect('/login'); // Redirect to login page or handle as appropriate
            }
        } catch (error) {
            console.error('Error fetching user secrets:', error);
            res.status(500).send('Internal Server Error');
        }

    }else{
        res.redirect("/login")
    }

    
})

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login")
    }

})

app.post("/submit", async (req, res) => {
    const submittedSecret = req.body.secret;
    
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            // User with the specified ID found
            user.secret.push(submittedSecret);
            await user.save();
            res.redirect("/secrets");

            console.log('User found and secret updated:', user);
        } else {
            // No user with the specified ID found
            console.log('User not found');
        }
    } catch (error) {
        console.error('Error updating secret:', error);
        // Handle the error
    }
});
// ... (previous code)

app.post("/delete-secret", async (req, res) => {
    const secretToDelete = req.body.secretToDelete;
    console.log("Received secret to delete:", secretToDelete);
    console.log("Type of secretToDelete:", typeof secretToDelete);
    
    try {
        const user = await User.findById(req.user.id);
        console.log("User secrets before deletion:", user.secret);

        if (user) {
            if (user.secret) {
                const secretIndex = user.secret.indexOf(secretToDelete);

                if (secretIndex !== -1) {
                    // Remove the secret at the specified index from the user's array
                    user.secret.splice(secretIndex, 1);

                    // Save the updated user object
                    await user.save();
                    console.log('Secret deleted:', secretToDelete);
                } else {
                    console.log('Secret not found in the array');
                }
            } else {
                console.log('User secrets array not found');
            }
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('Error deleting secret:', error);
        // Handle the error
    }

    res.redirect("/secrets");
});

// ... (rest of the code)








   


app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });




app.post('/register', (req,res) =>{

    if (req.body.password === req.body.passwordagain){
        User.register({username:req.body.username},req.body.password, function(err,user){
            if(err){
                req.flash('error', 'This email address is already used  :(');
                res.redirect('/Register');
            }else{
                passport.authenticate('local')(req,res ,function(){
                    res.redirect("/login")
                })
            }
         })
    }else{
        req.flash('error', 'Passwords does not match try again :(');
        res.redirect('/Register');
    }

 





   /* const email = req.body.username;
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

    }*/

 


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

/*app.post('/login',async(req, res)=>{

    const user = new User({
        username:req.body.username,
        password:req.body.password
    })

    req.login(user, function(err){
        if(err){
            console.log(err);
            req.flash('error', 'Invalid username or password');
            res.redirect('/login');
        }else{
            passport.authenticate('local')(req,res ,function(){
                res.redirect('/secrets')
            })
        }
    })





   /* const email = req.body.username;
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
*/

app.post('/login', passport.authenticate('local', {
    successRedirect: '/secrets',
    failureRedirect: '/login',
    failureFlash: "wrong username or password :("
}));





app.listen(3000, () => {
    console.log('Server started on port 3000');
  });