const express = require('express')
const app = express()
const cors = require('cors')
const moment = require('moment')
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
  username: {type: String, required: true},
  exercise: [{
    _id: false,
    description: {
      type: String,
      default:"",
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    date: {
      type: String,
      default:Date.now
    }
  }]
})
const userModel = mongoose.model('user',userSchema)

userModel.deleteMany({}).then(res=>console.log(res,"this"))
// show new user

app.get('/api/users/',(req,res)=>{
  userModel.find({}).select('username _id').exec((err, data) => {
    if(err) console.log(err);
    res.json(data);
  })
})

// create new user

app.post('/api/users',(req,res)=>{
  const username = req.body.username
  const user = new userModel({
    username:username
  })
  user.save()
  res.json({username:user.username,_id:user.id})
})

// create an exercise

app.post('/api/users/:_id/exercises',(req,res)=>{
  let userId = req.params._id
  let date = req.body.date
  let {description, duration} = req.body
  console.log(date,"this is the date we are recieving")
  
  userModel.findOneAndUpdate({_id: userId}, {
    $push: {
      exercise: {
        description: description,
        duration: Number(duration),
        date: date !== undefined?new Date(date).toDateString():new Date().toDateString()
      }
    }
  }, {new: true}, (err, data) => {
    if(data == null) {
      res.json("Please make sure all camps were introduced correctly") 
    } else {
      res.send({
        username: data.username,
        description: description,
        duration: Number(duration),
        date: new Date(date).toDateString(),
        _id: data._id
      });
    }
  })
})

app.get('/api/users/:_id/logs',(req,res)=>{
  let userId = req.params._id
  let from = req.query.from !== undefined ? new Date(req.query.from) : null
  let to = req.query.to !== undefined ? new Date(req.query.to) : null
  let limit = parseInt(req.query.limit)
  
  userModel.findOne({_id: userId}, (err, data) => {
    let count = data.exercise.length;
    if(data == null) {
      res.send("User not found")
    } else {
      console.log(from,to,"this")
      if(from && to) {
        
        res.send({
          _id: userId,
          username: data.username,
          count: limit || count,
          log: data.exercise.filter((e)=>{
            let elementDate = new Date(e.date)

            console.log(elementDate,"this is element date")
        
            return(elementDate.getTime() >= from.getTime() && elementDate.getTime() <= to.getTime())}
            ).slice(0, limit || count)
        })
      } else {
        console.log("this is serving")
        res.send({
          username: data.username,
          count: limit || count,
          _id: userId,
          log: data.exercise?.slice(0, limit || count)
        })
      }
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
