import User from '../models/user.js'; 
import bcrypt from 'bcryptjs'; 

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    console.log(req.body)
    const { firstName, lastName, phoneNumber, email, age, location } = req.body;
    
    const geoLocation = location ? {
      type: 'Point',
      coordinates: [location.longitude, location.latitude]  // [longitude, latitude]
    } : undefined;

    const emailExists = await User.findOne({ 
      email, 
      _id: { $ne: req.user.id } 
    });
    
    if (emailExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        email,
        phoneNumber,
        age,
        location: geoLocation,
      },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log(req.body)
    const user = await User.findById(req.user.id);
    console.log(user.password)
    // const pwd= await bcrypt.compare()
    // console.log()
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log(isMatch)
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    const salt = await bcrypt.genSalt(10);
    const pwd = await bcrypt.hash(currentPassword, salt);
    console.log("pwd", pwd);
    
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default { getProfile, updateProfile, updatePassword };
