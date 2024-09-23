import express from 'express'; 
import cors from 'cors'; 
import bodyParser from 'body-parser'; 
import dotenv from 'dotenv'; 
import fs from 'fs/promises'; 
import messagesRouter from './routes/messages.js'; 
import Twilio from 'twilio'; 

dotenv.config();
const app = express(); 

// Middleware setup
app.use(cors()); 
app.use(bodyParser.json()); 

// Set up the messages router for handling message-related requests
app.use('/api/messages', messagesRouter);

// Route for sending SMS messages
app.post('/api/send-message', async (req, res) => {
  const { phone, message, name } = req.body; 

  try {
    const accountSid = process.env.ACC_SID; 
    const authToken = process.env.AUTH_TOKEN; 
    const client = new Twilio(accountSid, authToken); 

    // Sending SMS message via Twilio
    await client.messages.create({
      body: message, 
      from: process.env.TWILO_NUMBER, 
      to: phone, 
    });

    // Reading existing messages from messages.json file
    const messagesData = await fs.readFile('./messages.json', 'utf-8');
    const messages = JSON.parse(messagesData); 

    // Creating a new message object with the current timestamp
    const newMessage = { phone, name, message, timestamp: new Date().toISOString() };
    messages.push(newMessage); 

    // Writing the updated messages array back to the messages.json file
    await fs.writeFile('./messages.json', JSON.stringify(messages, null, 2));

    // Sending a success response
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: 'Failed to send message' }); 
  }
});

// Route for starting phone number verification
app.post('/api/start-verification', async (req, res) => {
  const { phoneNumber } = req.body; 

  try {
    const accountSid = process.env.ACC_SID; 
    const authToken = process.env.AUTH_TOKEN; 
    const client = new Twilio(accountSid, authToken); 

    // Initiate phone number verification
    const verification = await client.verify.v2.services(process.env.VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });

    res.status(200).json({ success: true, verification });
  } catch (error) {
    console.error('Failed to initiate verification:', error);
    res.status(500).json({ error: 'Failed to initiate verification' });
  }
});

// Route for verifying the OTP code
app.post('/api/check-verification', async (req, res) => {
  const { phoneNumber, code } = req.body; 

  try {
    const accountSid = process.env.ACC_SID; 
    const authToken = process.env.AUTH_TOKEN; 
    const client = new Twilio(accountSid, authToken); 

    // Verify the OTP code
    const verificationCheck = await client.verify.v2.services(process.env.VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: phoneNumber, code });

    if (verificationCheck.status === 'approved') {
      res.status(200).json({ success: true, message: 'Phone number verified successfully!' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Verification failed:', error);
    res.status(500).json({ error: 'Failed to verify the code' });
  }
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
