import express from 'express'; 
import fs from 'fs'; 
import path from 'path'; 

const router = express.Router();
const messagesPath = path.join(process.cwd(), 'messages.json'); 

// Function to load messages from the messages.json file
const loadMessages = () => {
  const data = fs.readFileSync(messagesPath); 
  return JSON.parse(data); 
};

// Route to get all messages
router.get('/', (req, res) => {
  const messages = loadMessages(); 
  // Sending the messages as a JSON response, sorted by timestamp in descending order
  res.json(messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});


export default router;
