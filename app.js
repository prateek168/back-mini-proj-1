const express = require('express')
const app = express()
const port = 3000;
const ejs = require('ejs')
const jwt = require('jsonwebtoken')
const userModel = require('./models/user')
const postModel = require('./models/post')
app.set('view engine', 'ejs')
 
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser');
const user = require('./models/user');
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
   
app.get('/', (req, res) => {
  res.render("index")
})
app.get('/login', (req, res) => {
  res.render('login')
})
app.post('/register', async (req, res) => {
  let { email, password, username, name, _id, age } = req.body;

  let user = await userModel.findOne({ email })
  if (user) return res.status(500).send("User already Exists")
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        name,
        email,
        password: hash,
        age,
        username,
      })
      let token = jwt.sign({ email:  email, userid: _id }, 'shhhh')
      res.cookie("token", token)
      res.redirect('/login')
    })
  })

})
app.get('/like/:id',isLoggedIn, async(req,res)=>{
  
  let post = await postModel.findOne({ _id :req.params.id}).populate('user')
 if(post.likes.indexOf(req.user.userid)===-1){
   post.likes.push(req.user.userid)
 }
 else{
  post.likes.splice(post.likes.indexOf(req.user.userid),1);
 }
  await post.save();
  console.log((post));
  res.redirect('/profile')
})



app.get('/edit/:id', isLoggedIn, async(req,res)=>{
  let post = await postModel.findOne({_id :req.params.id})
console.log(  post.content);
  let user = await userModel.findOne({_id:req.user.userid})
  if( user.posts.indexOf(req.params.id)  ){
    res.render('edit' , {post } );
   
    }

else res.redirect('/profile')
})

app.post('/edit/update/:id' , async(req,res)=>{
const content = req.body.content
let post = await postModel.findOneAndUpdate({_id:req.params.id} , {
  content
} , {new:true})
res.redirect('/profile')
})

app.get('/profile' , isLoggedIn, async (req,res)=>{
  let user = await userModel.findOne({email : req.user.email}).populate('posts')
  
  const post = await postModel.findOne({user: user._id})

  
res.render('profile',( {user}))
}) 

app.post('/post' ,isLoggedIn, async (req,res)=>{
let user = await userModel.findOne({email : req.user.email})
let {content} = req.body;

const post = await postModel.create({
  user:user._id,
  content,
})
  user.posts.push(post._id)
await user.save();
res.redirect('/profile')
})
app.post('/login', async (req, res) => {
  let { email, password, _id} = req.body;

  let user = await userModel.findOne({ email })
  if (!user) return res.status(500).send("Something went Wrong")

  bcrypt.compare(password, user.password, (err, result) => {
    if (result){
      let token = jwt.sign({ email: user.email, userid: user._id }, 'shhhh')
      res.cookie("token", token)
      return res.status(200).redirect("/profile")}
    else res.redirect('/login')
  })
})
app.get('/logout' , (req,res)=>{
  res.cookie('token','')
  res.redirect('/login')
})
function isLoggedIn (req,res,next){
  if(req.cookies.token === '') res.redirect('/login');
  else{
   let data =  jwt.verify(req.cookies.token , 'shhhh')
   req.user = data;
  }
  next();
}
app.listen(port, () => {
  console.log("listening");
})
