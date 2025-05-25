import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mqtt from "mqtt";

const app = express();

app.use(
  cors({
    origin: "*", // In production you'd want to be more specific
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(bodyParser.json());

// HiveMQ Credentials
const MQTT_BROKER = "ac089b2d6bdc4958b15ab2dc983646a3.s1.eu.hivemq.cloud";
const MQTT_USERNAME = "medibuddy_123";
const MQTT_PASSWORD = "Ess_lab_2025";

// Connect to HiveMQ Broker
const mqttClient = mqtt.connect(`mqtts://${MQTT_BROKER}`, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  port: 8883, // Standard secure MQTT port
});

// Store the last medication event
let lastMedicationEvent = {
  medicationTaken: false,
  timestamp: null,
};

mqttClient.on("connect", () => {
  console.log("Connected to HiveMQ Broker");

  // Subscribe to the status topic from Raspberry Pi
  mqttClient.subscribe("alarm/status", (err) => {
    if (!err) {
      console.log("Subscribed to alarm status events");
    } else {
      console.error("Failed to subscribe to alarm status events:", err);
    }
  });
});

mqttClient.on("message", (topic, message) => {
  console.log(`Received message on topic ${topic}: ${message.toString()}`);

  if (topic === "alarm/status") {
    // Parse message to check if medication was taken
    const msgStr = message.toString();
    if (msgStr.includes("taken") || msgStr.includes("Medication")) {
      // Update the medication status
      lastMedicationEvent = {
        medicationTaken: true,
        timestamp: new Date().toISOString(),
      };
      console.log("Updated medication status:", lastMedicationEvent);
    }
  }
});

mqttClient.on("error", (error) => {
  console.error("MQTT connection error:", error);
});

// API endpoint to get medication status
app.get("/medication-status", (req, res) => {
  res.json(lastMedicationEvent);
});

// API endpoint to set alarm - FIXED to match RPi expected field names
app.post("/set-alarm", (req, res) => {
  console.log("Received set-alarm request:", req.body);
  const { time, medicine, dosage } = req.body;

  if (!time) {
    return res.status(400).json({ error: "Alarm time is required" });
  }

  // Map field names to match what RPi expects
  const alarmData = JSON.stringify({
    time: time,
    medication: medicine || "None",  // Changed from 'medicine' to 'medication'
    dose: dosage || "None"           // Changed from 'dosage' to 'dose'
  });

  // Publish alarm data to MQTT topic with QoS 1 for more reliable delivery
  mqttClient.publish("alarm/set", alarmData, { qos: 1 }, (err) => {
    if (err) {
      console.error("Failed to publish message:", err);
      return res.status(500).json({ error: "Failed to set alarm" });
    }
    console.log(`Publishing to MQTT: alarm/set = ${alarmData}`);
    res.json({ status: `Medication reminder set for: ${time}` });
  });
});

// Add debug endpoint to check MQTT connection status
app.get("/mqtt-status", (req, res) => {
  res.json({
    connected: mqttClient.connected,
    lastEvent: lastMedicationEvent
  });
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "Server is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));