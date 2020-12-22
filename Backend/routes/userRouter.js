const router = require('express').Router();
const User = require('../models/userModel')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth')

router.post('/register', async (req, res) => {
    try {
    let {email, password, passwordCheck, displayName } = req.body;

    if(!email || !password || !passwordCheck){
        return res.status(400).json({ msg: 'All fields are not filled up'})
    }
    if(password.length < 5){
        return res.status(400).json({ msg: 'Password length must be at least 5'})
    }
    if(password !== passwordCheck){
        return res.status(400).json({ msg: 'Both password should be same'})
    }
    const existingUser = await User.findOne({ email: email})

    if(existingUser){
        return res.status(400).json({ msg: 'Email is already used'})
    }
    if(!displayName){
        displayName = email;
    }

    const salt = await bcrypt.genSalt();
    const passwordHashed = await bcrypt.hash(password, salt);

    const newUser = new User ({
        email,
        password: passwordHashed,
        displayName
    });

    const savedUser = await newUser.save();
    res.json({ savedUser })

} catch(err) {
    res.status(500).json({ error: err.message});
}
})

router.post('/login', async (req, res) => {
    try{
    const { email, password } = req.body;

    if(!email || !password){
        return res.status(400).json({ msg: 'All fields are not filled up'})
    }

    const user = await User.findOne({ email: email });
    if(!user){
        return res.status(400).json({ msg: 'No user with this email has been registered' })
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        return res.status(400).json({ msg: 'No credentials' })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
        token,
        id: user._id,
        displayName: user.displayName,
        email: user.email,
    })
}catch(err) {
    res.status(500).json({ error: err.message});
}
})

router.delete('/delete', auth, async (req, res) => {
    try{
    const deletedUser = await User.findByIdAndDelete(req.user);
    res.json(deletedUser);
    } catch(err) {
        res.status(500).json({ error: err.message});
    }
})

router.post("/tokenIsValid", async (req, res) => {
    try {
      const token = req.header("x-auth-token");
      if (!token) return res.json(false);
  
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      if (!verified) return res.json(false);
  
      const user = await User.findById(verified.id);
      if (!user) return res.json(false);
  
      return res.json(true);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router