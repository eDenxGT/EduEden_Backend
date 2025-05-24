const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const serviceSid = process.env.TWILIO_SERVICE_SID || null;


const sendPhoneVerification = async (phoneNumber) => {
   try {
       const response = await client.verify.v2
           .services(serviceSid)
           .verifications.create({
               to: `+91${phoneNumber}`,
               channel: 'sms',
           });
       console.log('Phone Verification sent:', response.status);
       return response.status;
   } catch (error) {
       console.error('Error sending PhoneVerification:', error.message);
       throw error;
   }
};

const verifyPhoneCode = async (phoneNumber, code) => {
   try {
       const response = await client.verify.v2
           .services(serviceSid)
           .verificationChecks.create({
               to: phoneNumber,
               code: code,
           });
       console.log('Phone Verification result:', response.status);
       return response.valid;
   } catch (error) {
       console.error('Error verifying Phone code:', error.message);
       throw error;
   }
};


module.exports = {
   sendPhoneVerification,
   verifyPhoneCode 
}