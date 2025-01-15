import { model } from 'mongoose';  
import nodemailer from 'nodemailer';  

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS  // Your email password
  }
});

const transporter1 = nodemailer.createTransport(transporter);
export default transporter1;
