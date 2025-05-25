'use client'
import { useState, useEffect, useRef } from "react";
import { Clock, Bell, CheckCircle, AlertCircle, Calendar, Activity, Pill, Trash2, Settings, BarChart, Loader } from "lucide-react";

export default function MediBuddyControl() {
  const [alarmTime, setAlarmTime] = useState("");
  const [medicationTaken, setMedicationTaken] = useState(false);
  const [lastMedicationTime, setLastMedicationTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [upcomingAlarms, setUpcomingAlarms] = useState([
    { id: "1", time: "08:00", medicine: "Vitamin C", dosage: "1 pill" },
    { id: "2", time: "13:00", medicine: "Calcium", dosage: "2 pills" }
  ]);
  const [medicationHistory, setMedicationHistory] = useState([
    { time: "2025-04-29T08:05:22", medicine: "Vitamin C", status: "taken" },
    { time: "2025-04-29T13:12:45", medicine: "Calcium", status: "taken" },
    { time: "2025-04-29T20:00:00", medicine: "Iron Supplement", status: "missed" }
  ]);
  const [activeTab, setActiveTab] = useState("control");
  const [medicineName, setMedicineName] = useState("");
  const [medicationDosage, setMedicationDosage] = useState("");
  const [serverStatus, setServerStatus] = useState({ status: "checking...", mqtt: "unknown" });
  const [showSettings, setShowSettings] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [chartData, setChartData] = useState([
    { name: "Monday", taken: 3, missed: 0 },
    { name: "Tuesday", taken: 2, missed: 1 },
    { name: "Wednesday", taken: 3, missed: 0 },
    { name: "Thursday", taken: 2, missed: 0 },
    { name: "Friday", taken: 1, missed: 1 },
    { name: "Saturday", taken: 2, missed: 0 },
    { name: "Sunday", taken: 3, missed: 0 }
  ]);
  const notificationSound = useRef(null);

  // API base URL - in production, this would come from environment variables
  const API_BASE_URL = "https://2954af97-4fd3-47b2-969e-af6faf2ca98a-00-dv0uqmfyphp.sisko.replit.dev";

  // Poll for medication status updates every 5 seconds
  useEffect(() => {
    const checkMedicationStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/medication-status`);
        const data = await response.json();

        if (data.medicationTaken && data.timestamp !== lastMedicationTime) {
          setMedicationTaken(true);
          setLastMedicationTime(data.timestamp);

          // Add to history
          setMedicationHistory(prev => [
            { time: data.timestamp, medicine: "Current Medication", status: "taken" },
            ...prev
          ]);

          // Play notification sound
          if (notificationSound.current) {
            notificationSound.current.play().catch(e => console.error("Failed to play sound:", e));
          }

          // Auto-hide notification after 10 seconds
          setTimeout(() => {
            setMedicationTaken(false);
          }, 10000);
        }
      } catch (error) {
        console.error("Error checking medication status:", error);
        setDeviceConnected(false);
      }
    };

    // Check server status
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await response.json();
        setServerStatus({
          ...data,
          mqtt: data.status === "Server is running" ? "connected" : "disconnected"
        });
        setDeviceConnected(true);
      } catch (error) {
        console.error("Error checking server status:", error);
        setDeviceConnected(false);
        setServerStatus({
          status: "Server is offline",
          mqtt: "disconnected"
        });
      }
    };

    // Check initially
    checkMedicationStatus();
    checkServerStatus();

    // Set up polling intervals
    const medicationIntervalId = setInterval(checkMedicationStatus, 5000);
    const serverIntervalId = setInterval(checkServerStatus, 30000);

    // Clean up on unmount
    return () => {
      clearInterval(medicationIntervalId);
      clearInterval(serverIntervalId);
    };
  }, [lastMedicationTime, API_BASE_URL]);

  const setAlarm = async () => {
    if (!alarmTime) {
      alert("Please select a time first");
      return;
    }

    if (!medicineName) {
      alert("Please enter a medication name");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/set-alarm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          time: alarmTime,
          medicine: medicineName,
          dosage: medicationDosage || "1 pill"
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add to upcoming alarms with the ID from the server if available
      const newAlarm = { 
        id: Date.now().toString(),
        time: alarmTime, 
        medicine: medicineName,
        dosage: medicationDosage || "1 pill"
      };

      setUpcomingAlarms(prev => [
        ...prev,
        newAlarm
      ].sort((a, b) => a.time.localeCompare(b.time)));

      // Reset inputs
      setAlarmTime("");
      setMedicineName("");
      setMedicationDosage("");

      // Show success toast
      setMedicationTaken(true);
      setLastMedicationTime(`Reminder set for ${alarmTime}`);

      // Play notification sound
      if (notificationSound.current) {
        notificationSound.current.play().catch(e => console.error("Failed to play sound:", e));
      }

      setTimeout(() => {
        setMedicationTaken(false);
      }, 3000);

    } catch (error) {
      console.error("Error setting alarm:", error);
      alert(`Failed to set medication reminder: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAlarm = async (id) => {
    try {
      // Note: Your backend doesn't currently support this,
      // so we'll only update the local state

      // Remove from local state
      setUpcomingAlarms(prev => prev.filter(alarm => alarm.id !== id));

    } catch (error) {
      console.error("Error deleting alarm:", error);
      alert("Failed to delete reminder");
    }
  };

  const simulateButtonPress = async () => {
    try {
      // Since your backend doesn't have this endpoint yet, 
      // We'll just show a notification

      // Show notification
      setMedicationTaken(true);
      setLastMedicationTime(new Date().toISOString());

      // Add to history
      setMedicationHistory(prev => [
        { time: new Date().toISOString(), medicine: "Simulated Medication", status: "taken" },
        ...prev
      ]);

      // Play notification sound
      if (notificationSound.current) {
        notificationSound.current.play().catch(e => console.error("Failed to play sound:", e));
      }

      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setMedicationTaken(false);
      }, 3000);

    } catch (error) {
      console.error("Error simulating button press:", error);
    }
  };

  // Format time to 12-hour format
  const format12HourTime = (timestamp) => {
    if (!timestamp) return "";
    if (timestamp.includes("Reminder set")) return timestamp;

    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return timestamp;
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    if (timestamp.includes("Reminder set")) return "";

    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Audio element for notifications */}
      <audio ref={notificationSound} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="mr-2" />
            <h1 className="text-xl font-bold">MediBuddy Control</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded flex items-center ${deviceConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}>
              {deviceConnected ? 'Connected' : 'Reconnecting...'}
            </span>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 rounded-full hover:bg-blue-500 transition-colors"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="bg-gray-100 p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Device Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Server Status:</span> 
                <span className={serverStatus.status === "Server is running" ? "text-green-600" : "text-red-600"}>
                  {serverStatus.status === "Server is running" ? "Online" : "Offline"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>MQTT Connection:</span> 
                <span className={serverStatus.mqtt === "connected" ? "text-green-600" : "text-red-600"}>
                  {serverStatus.mqtt}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Server Time:</span> 
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <button 
                  onClick={simulateButtonPress}
                  className="w-full mt-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm hover:bg-blue-200"
                >
                  Simulate Button Press
                </button>
              </div>
            </div>
          </div>
        )}

        {medicationTaken && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 flex items-center animate-pulse">
            <CheckCircle className="mr-2" size={20} />
            <div>
              <strong className="font-bold block">Success!</strong>
              <span className="text-sm">
                {lastMedicationTime.includes("Reminder set") 
                  ? lastMedicationTime 
                  : `Medicine taken at ${format12HourTime(lastMedicationTime)}`}
              </span>
            </div>
          </div>
        )}

        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              className={`px-4 py-3 text-sm font-medium flex items-center ${
                activeTab === "control"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("control")}
            >
              <Bell size={16} className="mr-1" />
              Control Panel
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium flex items-center ${
                activeTab === "schedule"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("schedule")}
            >
              <Calendar size={16} className="mr-1" />
              Schedule
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium flex items-center ${
                activeTab === "history"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("history")}
            >
              <Clock size={16} className="mr-1" />
              History
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium flex items-center ${
                activeTab === "stats"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("stats")}
            >
              <BarChart size={16} className="mr-1" />
              Stats
            </button>
          </nav>
        </div>

        {activeTab === "control" && (
          <div className="p-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
                <Bell className="mr-2" size={20} />
                Set Medication Reminder
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medication Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Pill className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="text"
                      value={medicineName}
                      onChange={(e) => setMedicineName(e.target.value)}
                      placeholder="Enter medication name"
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage (optional)
                  </label>
                  <input
                    type="text"
                    value={medicationDosage}
                    onChange={(e) => setMedicationDosage(e.target.value)}
                    placeholder="e.g. 1 pill, 5ml, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reminder Time
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Clock className="text-gray-400" size={16} />
                      </div>
                      <input
                        type="time"
                        value={alarmTime}
                        onChange={(e) => setAlarmTime(e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Medication time"
                      />
                    </div>
                    <button
                      onClick={setAlarm}
                      disabled={isLoading}
                      className={`px-4 py-2 text-white rounded-md flex items-center justify-center ${
                        isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader size={16} className="mr-2 animate-spin" />
                          Setting...
                        </>
                      ) : (
                        "Set Reminder"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="mr-2" size={18} />
                Next Medications
              </h3>

              {upcomingAlarms.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-200">
                  {upcomingAlarms.map((alarm, index) => (
                    <div key={index} className="p-3 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Pill size={14} className="mr-1 text-blue-500" />
                          <span className="font-medium">{alarm.medicine}</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock size={14} className="mr-1" />
                          {alarm.time}
                          {alarm.dosage && (
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                              {alarm.dosage}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Upcoming
                        </span>
                        <button 
                          onClick={() => deleteAlarm(alarm.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Delete reminder"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No upcoming medications</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Calendar className="mr-2" size={20} />
              Weekly Schedule
            </h2>
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                <div key={index} className={`p-3 ${index % 2 === 0 ? "bg-gray-50" : ""} flex`}>
                  <div className="w-1/4 font-medium">{day}</div>
                  <div className="w-3/4">
                    {index === 2 ? (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">08:00</span>
                          <span className="flex items-center">
                            <Pill size={12} className="mr-1 text-blue-500" />
                            Vitamin C
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">13:00</span>
                          <span className="flex items-center">
                            <Pill size={12} className="mr-1 text-blue-500" />
                            Calcium
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">20:00</span>
                          <span className="flex items-center">
                            <Pill size={12} className="mr-1 text-blue-500" />
                            Iron Supplement
                          </span>
                        </div>
                      </div>
                    ) : index === 1 || index === 3 ? (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">08:00</span>
                          <span className="flex items-center">
                            <Pill size={12} className="mr-1 text-blue-500" />
                            Vitamin C
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">20:00</span>
                          <span className="flex items-center">
                            <Pill size={12} className="mr-1 text-blue-500" />
                            Iron Supplement
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm italic">No medications</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Clock className="mr-2" size={20} />
              Medication History
            </h2>

            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              {medicationHistory.map((item, index) => (
                <div key={index} className="p-3 border-b border-gray-200 last:border-0 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.medicine}</span>
                    <div className="text-xs text-gray-500">
                      {formatDate(item.time)} at {format12HourTime(item.time)}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.status === "taken" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {item.status === "taken" ? (
                      <span className="flex items-center">
                        <CheckCircle size={12} className="mr-1" />
                        Taken
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <AlertCircle size={12} className="mr-1" />
                        Missed
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <BarChart className="mr-2" size={20} />
              Medication Statistics
            </h2>

            <div className="bg-white p-4 border border-gray-200 rounded-md mb-4">
              <h3 className="text-sm font-medium mb-2">Weekly Adherence</h3>
              <div className="flex items-center mb-2">
                <span className="font-bold text-3xl mr-2">94%</span>
                <span className="text-sm text-green-600">+2% from last week</span>
              </div>

              {/* Simple bar chart visualization */}
              <div className="mt-4">
                {chartData.map((day, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{day.name}</span>
                      <span>{Math.round((day.taken / (day.taken + day.missed)) * 100)}%</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(day.taken / (day.taken + day.missed)) * 100}%` }}
                      />
                      <div 
                        className="bg-red-400" 
                        style={{ width: `${(day.missed / (day.taken + day.missed)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 border border-gray-200 rounded-md">
                <h3 className="text-sm font-medium mb-1">Most Consistent</h3>
                <div className="text-center py-2">
                  <span className="block text-lg font-medium">Vitamin C</span>
                  <span className="text-xs text-gray-500">100% adherence</span>
                </div>
              </div>

              <div className="bg-white p-4 border border-gray-200 rounded-md">
                <h3 className="text-sm font-medium mb-1">Needs Attention</h3>
                <div className="text-center py-2">
                  <span className="block text-lg font-medium">Iron Supplement</span>
                  <span className="text-xs text-gray-500">83% adherence</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
          © 2025 MediBuddy - Stay healthy, stay on schedule
        </div>
      </div>
    </div>
  );
}