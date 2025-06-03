// ✅ ปรับปรุง script.js ตามคำขอล่าสุดของผู้ใช้
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';
const pointPerBaht = 0.1;

let adminUserId = '';
let foundUser = null;
let serviceList = [];

let currentCameraIndex = 0;
let html5QrCode;
let cameraList = [];

// ✅ โหลด LIFF และดึงโปรไฟล์
window.addEventListener('DOMContentLoaded', async () => {
  await liff.init({ liffId });
  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }

  const profile = await liff.getProfile().catch(err => {
    Swal.fire("❌ ไม่สามารถโหลดโปรไฟล์ LINE", err.message || '', 'error');
    return;
  });
  if (!profile) return;

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
  html5QrCode = new Html5Qrcode('reader');
  Html5Qrcode.getCameras().then(cameras => {
    if (cameras.length) {
      cameraList = cameras;
      const backCam = cameras.find(cam => /back|environment/i.test(cam.label));
      const camId = backCam ? backCam.id : cameras[0].id;
      currentCameraIndex = cameras.findIndex(cam => cam.id === camId);

      html5QrCode.start(
        camId,
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          onScanSuccess(decodedText);
          html5QrCode.stop();
        },
        () => {}
      );
    } else {
      Swal.fire('ไม่พบกล้อง', '', 'error');
    }
  });
}

function toggleCamera() {
  if (!cameraList.length || !html5QrCode) return;
  html5QrCode.stop().then(() => {
    currentCameraIndex = (currentCameraIndex + 1) % cameraList.length;
    html5QrCode.start(
      cameraList[currentCameraIndex].id,
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        onScanSuccess(decodedText);
        html5QrCode.stop();
      },
      () => {}
    );
  });
}

async function manualSearch() {
  const phone = document.getElementById('manualPhone').value;
  if (!phone) return;

  const res = await fetch(`${GAS_ENDPOINT}?action=search_phone&phone=${phone}`);
  const result = await res.json();
  if (!result.success) return Swal.fire('ไม่พบข้อมูลลูกค้า', '', 'error');
  foundUser = result.data;
  showCustomerPopup();
}

async function onScanSuccess(token) {
  const res = await fetch(`${GAS_ENDPOINT}?action=verify_token&token=${token}`);
  const result = await res.json();
  if (!result.success) return Swal.fire('QR ไม่ถูกต้อง', '', 'error');
  foundUser = result.data;
  showCustomerPopup();
}

function loadServices() {
  fetch(`${GAS_ENDPOINT}?action=service_list`)
    .then(res => res.json())
    .then(data => {
      serviceList = data;
      const datalist = document.createElement('datalist');
      datalist.id = 'serviceOptions';
      data.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.name;
        datalist.appendChild(opt);
      });
      document.body.appendChild(datalist);
    });
}

function showCustomerPopup() {
  Swal.fire({
    title: 'ข้อมูลลูกค้า',
    html: `
      <p>ชื่อ: ${foundUser.Name}</p>
      <p>เบอร์: ${foundUser.Phone}</p>
      <p>รถ: ${foundUser.Brand} ${foundUser.Model} ${foundUser.Year}</p>
      <input list="serviceOptions" id="serviceName" placeholder="ชื่อบริการ" class="swal2-input">
      <input type="number" id="priceInput" placeholder="ราคา" class="swal2-input">
      <p>แต้มที่จะได้: <span id="pointPreview">0</span></p>
      <input type="text" id="noteInput" placeholder="หมายเหตุ" class="swal2-input">
    `,
    confirmButtonText: 'บันทึก',
    didOpen: () => {
      const priceInput = document.getElementById('priceInput');
      const pointPreview = document.getElementById('pointPreview');
      priceInput.addEventListener('input', () => {
        const p = parseFloat(priceInput.value) || 0;
        pointPreview.textContent = Math.floor(p * pointPerBaht);
      });
    },
    preConfirm: async () => {
      const name = document.getElementById('serviceName').value.trim();
      const price = parseFloat(document.getElementById('priceInput').value) || 0;
      const note = document.getElementById('noteInput').value.trim();
      if (!name || price <= 0) return Swal.showValidationMessage('กรุณากรอกชื่อบริการและราคาถูกต้อง');

      const existing = serviceList.find(s => s.name === name);
      if (!existing || existing.price != price) {
        await fetch(GAS_ENDPOINT, {
          method: 'POST',
          body: JSON.stringify({
            action: 'service',
            contents: JSON.stringify({
              action: 'add_service',
              name,
              price,
              point: Math.floor(price * pointPerBaht),
              detail: '-',
              createdBy: adminUserId
            })
          })
        });
      }

      const record = {
        action: 'record_service',
        contents: JSON.stringify({
          userId: foundUser.UserID,
          nameLine: foundUser.nameLine || '',
          brand: foundUser.Brand,
          model: foundUser.Model,
          serviceName: name,
          price: price,
          point: Math.floor(price * pointPerBaht),
          note: note,
          timestamp: new Date().toISOString(),
          admin: document.getElementById('adminName').textContent
        })
      };

      Swal.fire({
        title: '⏳ กำลังบันทึก...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await fetch(GAS_ENDPOINT, { method: 'POST', body: JSON.stringify(record) });
      Swal.close();
      Swal.fire('✅ บันทึกสำเร็จ', '', 'success').then(() => liff.closeWindow());
    }
  });
}

// ให้ฟังก์ชันเปิดกล้อง/ค้นหาเบอร์ใช้ใน HTML ได้
window.startCamera = startCamera;
window.toggleCamera = toggleCamera;
window.manualSearch = manualSearch;
