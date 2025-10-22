const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'voltasbms@gmail.com',
    pass: process.env.EMAIL_PASS || 'voltas123456'
  }
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'voltasbms@gmail.com',
    to: email,
    subject: 'Voltas BMS - Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">🏭 Voltas BMS Verification</h2>
        <p>Your OTP for email verification is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1e40af; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTP };