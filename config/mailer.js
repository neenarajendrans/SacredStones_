const nodemailer = require('nodemailer');

  const sendVerifyMail = async (req,email) => {
    try {
 
      const otp = generateOTP(4); 
      console.log(otp,"OTP")
   
      req.session.otp = otp;
   console.log( req.session.otp,"otp",email)
      const transporter = nodemailer.createTransport({
  
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: 'sacredstonesnrs@gmail.com',
          pass: 'zwhf ycds wbjp heys',
        },
      });
  
      const mailOptions = {
        from: 'sacredstonesnrs@gmail.com',
        to: email,
        subject: 'For verification purpose',
        html: `<p>Hello , please enter this OTP: <strong>${otp}</strong> to verify your email.</p>`,
      };

       const information = await  transporter.sendMail( mailOptions);
 
    } catch (error) {
      console.log(error);
    }
   
  };

  
  
  
  
  function generateOTP(length) {
      const characters = '0123456789'; // The characters to use for the OTP
      let otp = '';
    
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        otp += characters[randomIndex];
      }
    
      return otp;
    }
  
  
  
  
  

  
  module.exports= {
  
    sendVerifyMail,
 
  }