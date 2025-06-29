import bcrypt from 'bcryptjs';

const testPassword = async () => {
  const password = 'password123';
  const hash = '$2b$10$t7CwQ1Zau6t3DA5ydo4dqe7szSWFMac8UZxQBQbOwEgBpLeys2Uxy';
  
  console.log('Testing password verification...');
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  try {
    const isValid = await bcrypt.compare(password, hash);
    console.log('Password valid:', isValid);
    
    // Also test creating a new hash to see if it works
    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash:', newHash);
    
    const isNewValid = await bcrypt.compare(password, newHash);
    console.log('New hash valid:', isNewValid);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testPassword();