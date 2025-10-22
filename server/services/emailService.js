const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'voltasbms@gmail.com',
    pass: process.env.EMAIL_PASS || 'voltas123456'
  }
});

const sendOTP = async (email, otp) => {
  // Demo mode - simulate email sending
  console.log(`\n📧 DEMO OTP EMAIL`);
  console.log(`To: ${email}`);
  console.log(`OTP: ${otp}`);
  console.log(`Use this OTP to login/signup\n`);
  
  // Simulate email delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true };
};

module.exports = { sendOTP };