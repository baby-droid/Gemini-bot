const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Twilio client setup
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Uptime monitoring setup
let startTime = Date.now();
setInterval(() => {
  if (Date.now() - startTime > 890 * 60 * 60 * 1000) {
    process.exit(0); // Restart after 890 hours
  }
}, 60000);

// WhatsApp webhook handler
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.Body;
    const from = req.body.From;
    
    // Generate response using Gemini
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    // Send WhatsApp reply
    await client.messages.create({
      body: text,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: from
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error processing request');
  }
});

// Verification endpoint
app.get('/webhook', (req, res) => {
  res.status(200).send(req.query.challenge);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});{
  "name": "whatsapp-gemini-bot",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "twilio": "^4.23.0",
    "@google/generative-ai": "^1.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
