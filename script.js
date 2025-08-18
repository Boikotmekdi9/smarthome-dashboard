// 🔐 Konfigurasi Login
const CORRECT_PIN = "1234"; // Ganti sesuai keinginan

function login() {
  const pin = document.getElementById("password").value;
  const error = document.getElementById("login-error");
  if (pin === CORRECT_PIN) {
    document.getElementById("login-page").style.display = "none";
    document.getElementById("dashboard-page").classList.remove("hidden");
    connectMQTT();
  } else {
    error.textContent = "PIN salah!";
  }
}

function logout() {
  if (confirm("Yakin ingin keluar?")) {
    location.reload();
  }
}

// 📈 Grafik
let tempData = Array(10).fill(null);
let humidData = Array(10).fill(null);
let labels = Array(10).fill("");

const ctx = document.getElementById('sensorChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [
      {
        label: 'Suhu (°C)',
        data: tempData,
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Kelembaban (%)',
        data: humidData,
        borderColor: '#4ecdc4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { labels: { color: 'white' } }
    },
    scales: {
      x: { ticks: { color: 'white' }, grid: { color: '#333' } },
      y: {
        ticks: { color: 'white' },
        grid: { color: '#333' },
        min: 0,
        max: 100
      }
    }
  }
});

// 🔌 MQTT
function connectMQTT() {
  const options = {
    username: 'Smarthomee',
    password: 'Citraland11',
    clientId: 'web-dashboard-' + Math.random().toString(16).substr(2, 6),
    clean: true,
    connectTimeout: 30000,
  };

  const client = mqtt.connect('wss://36ea91e54dbd4100910aa776ac298685.s1.eu.hivemq.cloud:8884/mqtt', options);

  client.on('connect', () => {
    console.log('✅ Dashboard terhubung ke MQTT');
    client.subscribe('smarthome/door/status');
    client.subscribe('smarthome/sensor/data');
  });

  client.on('message', (topic, message) => {
    const payload = message.toString();
    const now = new Date().toLocaleTimeString();
    document.getElementById('last-update').textContent = now;

    if (topic === 'smarthome/door/status') {
      const status = payload === 'open' ? 'TERBUKA' : 'TERKUNCI';
      const doorEl = document.getElementById('door-status');
      doorEl.textContent = status;
      doorEl.className = payload === 'closed' ? 'terkunci' : '';
    }

    if (topic === 'smarthome/sensor/data') {
      try {
        const data = JSON.parse(payload);
        document.getElementById('temp-value').textContent = data.temperature + '°C';
        document.getElementById('humid-value').textContent = data.humidity + '%';
        document.getElementById('gas-value').textContent = data.gas;
        document.getElementById('gas-value').className = data.gas > 400 ? 'warn' : '';

        const motionText = data.motion == 1 ? 'TERDETEKSI' : 'AMAN';
        const motionEl = document.getElementById('motion-value');
        motionEl.textContent = motionText;
        motionEl.className = data.motion == 1 ? 'warn' : '';

        // Update grafik
        tempData.shift();
        tempData.push(data.temperature);
        humidData.shift();
        humidData.push(data.humidity);
        labels.shift();
        labels.push(now.split(':')[1] + ':' + now.split(':')[2]); // menit:detik

        chart.update();
      } catch (e) {
        console.error('❌ Parse error:', e, payload);
      }
    }
  });

  client.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
  });
}