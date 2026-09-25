const crypto = require("crypto");

// Generates a random reset token + its hashed version (store the hash, email/return the raw token)
const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return { rawToken, hashedToken };
};

module.exports = generateResetToken;
