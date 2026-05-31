import bcrypt from 'bcryptjs';
console.log(bcrypt.hashSync('password123', 10));
