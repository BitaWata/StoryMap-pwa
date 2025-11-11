const express = require("express");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

const vapidKeys = webpush.generateVAPIDKeys();
console.log("Public VAPID Key:", vapidKeys.publicKey);
console.log("Private VAPID Key:", vapidKeys.privateKey);

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

let subscriptions = [];

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../dist"))); // Serve frontend hasil build

app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({});
});

app.post("/push", async (req, res) => {
  const { title, body } = req.body;
  const payload = JSON.stringify({ title, body });

  const sendPromises = subscriptions.map((sub) =>
    webpush.sendNotification(sub, payload).catch((err) => console.error(err))
  );

  await Promise.all(sendPromises);
  res.json({ success: true });
});

app.get("/vapidPublicKey", (req, res) => {
  res.send(vapidKeys.publicKey);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});