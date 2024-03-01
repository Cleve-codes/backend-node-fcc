require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')

const mongoose = require('mongoose')
const { Schema } = mongoose

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.error(err))


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const userSchema = new Schema({
  username: { type: String, required: true }
})

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)


app.get("/api/users", async (req, res) => {
  const users = await User.find({}).select('_id username')

  if(!users) {
    res.send("No Users")
  } else {
    res.json(users)
  }
})

app.get("/api/users/:_id/logs", async (req, res) => {
  const id = req.params._id
  const { from, to, limit } = req.query
  const user = await User.findById(id)

  if(!user) {
    res.send("Could not find user")
    return;
  }

  let dateObj = {};

  if(from) {
    dateObj["$gte"] = new Date(from)
  }
  if (to) {
    dateObj["$lte"] = new Date(to)
  }

  let filter = {
    userId: id,
  }

  if(from || to) {
    filter.date = dateObj
  }

  let exercises = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercises.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  }))

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log,
  })
})


app.post("/api/users", async (req, res) => {
  const userObj = new User({ username: req.body.username })
  try {
    const user = await userObj.save()
    res.json(user)
  } catch (err) {
    console.log(err)
  }
})

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id
  const { description, duration, date } = req.body


  try {
    const user = await User.findById(id)

    if(!user) {
      console.log('User not found')
    } else {
      const exerciseObj = new Exercise({
        userId: id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
       })

       const exercise = await exerciseObj.save()
       res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
       })
    }

  } catch (err) {
    console.log(err)
    res.send('Error')
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
