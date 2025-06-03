const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';
const pointPerBaht = 0.1;

let adminUserId = '';
let foundUser = null;

let currentCameraIndex = 0;
let html5QrCode;
let cameraList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await liff.init({ liffId });
  if (!liff.isLoggedIn()) return liff.login();

  const profile = await liff.getProfile();
  adminUserId = profile.userId;

  const res = await fetch(`${GAS_ENDPOINT}?action=check_admin&userId=${adminUserId}`);
  const result = await res.json();

  document.getElementById('adminName').textContent = result.name || '-';
  document.getElementById('adminRole').textContent = `ระดับ ${result.level || '-'}`;

  logAction('enter_scan', 'เข้าสู่หน้า Scan');
  loadServices();
  startCamera();
});

function logAction(title, detail) {
  fetch(GAS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      action: 'log_admin',
      contents: JSON.stringify({
        name: document.getElementById('adminName').textContent,
        userId: adminUserId,
        actionTitle: title,
        detail,
        device: navigator.userAgent,
        token: '',
      }),
    }),
  });
}

function startCamera() {
  html5QrCode = new Html5Qrcode("reader");

  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length) {
      cameraList = cameras;

      // ✅ เริ่มที่กล้องหลังถ้ามี
      const backCam = cameras.find(cam => /back|environment/i.test(cam.label));
      const camId = backCam ? backCam.id : cameras[0].id;
      currentCameraIndex = cameras.findIndex(cam => cam.id === camId);

      html5QrCode.start(
        camId,
        { fps: 10, qrbox: 250 },
        (decodedText, decodedResult) => {
          onScanSuccess(decodedText);
          html5QrCode.stop();
        },
        (errorMessage) => { /* ไม่ต้องแสดง error */ }
      );
    } else {
      Swal.fire("ไม่พบกล้อง", "อุปกรณ์ของคุณไม่มีกล้องหรือไม่อนุญาต", "error");
    }
  }).catch(err => {
    Swal.fire("ไม่สามารถเข้าถึงกล้องได้", err.message, "error");
  });
}

function toggleCamera() {
  if (!cameraList.length || !html5QrCode) return;

  html5QrCode.stop().then(() => {
    currentCameraIndex = (currentCameraIndex + 1) % cameraList.length;
    const camId = cameraList[currentCameraIndex].id;

    html5QrCode.start(
      camId,
      { fps: 10, qrbox: 250 },
      (decodedText, decodedResult) => {
        onScanSuccess(decodedText);
        html5QrCode.stop();
      },
      (errorMessage) => { /* ไม่ต้องแสดง error */ }
    );
  });
}

async function manualSearch() {
  const phone = document.getElementById('manualPhone').value;
  if (!phone) return;

  const res = await fetch(`${GAS_ENDPOINT}?action=search_phone&phone=${phone}`);
  const result = await res.json();

  if (!result.success) {
    logAction('scan_failed', `ไม่พบเบอร์: ${phone}`);
    return Swal.fire('ไม่พบข้อมูลลูกค้า', '', 'error');
  }

  foundUser = result.data;
  showCustomerData(foundUser);
}

async function onScanSuccess(token) {
  console.log("✅ อ่าน QR ได้: ", token);

  const res = await fetch(`${GAS_ENDPOINT}?action=verify_token&token=${token}`);
  const result = await res.json();

  if (!result.success) {
    await logAction('scan_failed', `QR Token ไม่ถูกต้อง: ${token}`);
    Swal.fire("ไม่พบข้อมูลหรือ Token หมดอายุ", "", "error");
    return;
  }

  foundUser = result.data;
  showCustomerData(foundUser);
}

function showCustomerData(user) {
  document.getElementById('custName').textContent = user.Name;
  document.getElementById('custPhone').textContent = user.Phone;
  document.getElementById('custCar').textContent = `${user.Brand} ${user.Model} ${user.Year}`;
  document.getElementById('priceInput').value = user.defaultPrice || 0;
  document.getElementById('pointPreview').textContent = '0';

  document.getElementById('resultSection').classList.remove('hidden');
}

function updatePoint() {
  const price = parseFloat(document.getElementById('priceInput').value) || 0;
  const point = Math.floor(price * pointPerBaht);
  document.getElementById('pointPreview').textContent = point;
}

function loadServices() {
  fetch(`${GAS_ENDPOINT}?action=service_list`)
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('serviceSelect');
      data.forEach(item => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify(item);
        opt.textContent = `${item.name} (${item.price}฿)`;
        select.appendChild(opt);
      });
    });
}

document.getElementById('serviceSelect').addEventListener('change', () => {
  const selected = JSON.parse(document.getElementById('serviceSelect').value);
  document.getElementById('priceInput').value = selected.price;
  updatePoint();
});



async function submitService() {
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = "⏳ กำลังบันทึก...";

  const service = JSON.parse(document.getElementById('serviceSelect').value);
  const note = document.getElementById('noteInput').value;

  const body = {
    action: 'service',
    contents: JSON.stringify({
      userId: foundUser.UserID,
      nameLine: foundUser.nameLine || '',
      brand: foundUser.Brand,
      model: foundUser.Model,
      serviceName: service.name,
      price: service.price,
      point: Math.floor(service.price * pointPerBaht),
      note: note,
      timestamp: new Date().toISOString(),
      admin: document.getElementById('adminName').textContent
    }),
  };

  await fetch(GAS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  .then(() => {
    Swal.fire('✅ บันทึกสำเร็จ', '', 'success').then(() => {
      liff.closeWindow();
    });
  })
  .catch((err) => {
    console.error("เกิดข้อผิดพลาด:", err);
    Swal.fire("❌ เกิดข้อผิดพลาด", err.message || "", "error");
  });
}

// Make functions globally available for HTML onclick
window.startCamera = startCamera;
window.toggleCamera = toggleCamera;
window.manualSearch = manualSearch;
window.submitService = submitService;
