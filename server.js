const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// create database connectivity

const mongoose = require('mongoose')
mongoose.connect("mongodb+srv://exercisetracker:tracker@cluster0.7y2oj.mongodb.net/exercisetracker?retryWrites=true&w=majority")
.then(()=>console.log('connection successfull'))
.catch((e)=>console.log(e,'this is the error'))

const userSchema = new mongoose.Schema({
  username:{type:String,required:true}
})
const userModel = mongoose.model('user',userSchema)

const exerciseSchema = new mongoose.Schema({
  userId:{type:String,ref:'user',required:true},
  description:{type:String,required:true},
  duration:{type:String,required:true},
  date:{type:Date,required:true},
  username:{type:String,required:true}
})

const exerciseModel = mongoose.model('exercise',exerciseSchema)

// show new user

app.get('/api/users',async(req,res)=>{
  await userModel.find({},(err,user)=>{ 
    if(err) throw err
    let usermap = []
      user.forEach((user)=>{
        usermap.push({
          'username':user.username,
          '_id':user.id
        })
      })
      res.send(usermap)
  })
})

// create new user

app.post('/api/users',async(req,res)=>{
  const username = req.body.username
  const user = new userModel({
    username:username
  })
  await user.save()
  .then(user.username?res.json({username:user.username,_id:user.id}):res.json({message:'user not found'}))
  .catch((error)=>res.send(error))
})

// create an exercise

app.post('/api/users/:_id/exercises',async(req,res)=>{
  const _id = req.params._id
  const {description,duration,date} = req.body
  const user = await userModel.findOne({_id})
  if(!date)
    date = new Date(date)  
  if(!_id)
    throw new Error('unknown user with _id')
  const exercise = new exerciseModel({
    userId:user.id,
    description:description,
    duration:duration,
    date:date,
    username:user.username
  })
  await exercise.save()
  .then(ex=>res.json({  
    username:user.username,
    description:ex.description,
    duration:ex.duration,
    date:new Date(ex.date).toDateString(),
    _id:user.id
  }))  
  .catch((error)=>res.send(error))
})

app.get('/api/users/:_id/logs',async(req,res)=>{
  const to = req.query.to ? new Date(req.query.to) : new Date(2999,12,30);
  const from = req.query.from ? new Date(req.query.from) : 0;
  const limit = req.query.limit;
  await exerciseModel.find({userId:req.params._id, date: {$lt: to, $gt: from}}, function(err, exers){
    if (err) return console.log(err);
    let log = exers.map(function(obj){
      return {
        description: obj.description,
        duration: obj.duration,
        date: new Date(obj.date).toDateString()
      }
    });
    
    if (limit) { 
      res.json({username: exers[0].username, _id: exers[0].userId, count:limit, log: log.slice(0,limit)});
    } else {
    res.json({username: exers[0].username, _id: exers[0].userId, count:log.length, log: log});
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
