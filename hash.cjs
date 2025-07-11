// hash.js
const bcrypt = require('bcrypt');

const password = process.argv[2]; // Get password from command line
const saltRounds = 10;

if (!password) {
  console.log("❌ Please provide a password: node hash.js mypassword123");
  process.exit(1);
}

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error("❌ Error hashing password:", err);
    return;
  }
  console.log("✅ Bcrypt Hash:\n", hash);
});
