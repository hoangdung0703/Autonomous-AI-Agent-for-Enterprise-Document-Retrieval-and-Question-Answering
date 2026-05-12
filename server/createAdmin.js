const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const authService = require('./src/services/AuthService');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'admin@archon.local';
    const password = 'AdminPassword123!';
    
    const User = require('./src/models/User');
    await User.deleteOne({ email }); 
    
    const result = await authService.register('Super Admin', email, password, 'admin');
    
    console.log('\n--- Admin Account Created ---');
    console.log('Email: ' + email);
    console.log('Password: ' + password);
    console.log('Token:\n' + result.token);
    console.log('-----------------------------\n');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
