// script.js (ES6 Class)
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

class QRScanner {
  constructor() {
    this.pointPerBaht = 0.1;
    this.adminUserId = '';
    this.adminName = '-';
    this.token = '';
    this.foundUser = null;
    this.serviceList = [];
    this.currentCameraIndex = 0;
    this.html5QrCode = null;
    this.cameraList = [];
    this.init();
  }

  async init() {
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) return liff.login();

    const profile = await liff.getProfile().catch(err => {
      Swal.fire("❌ ไม่สามารถโหลดโปรไฟล์ LINE", err.message || '', 'error');
    });
    if (!profile) return;

    this.adminUserId = profile.userId;
    this.token = liff.getIDToken ? await liff.getIDToken() : '';

    const res = await fetch(`${GAS_ENDPOINT}?action=check_admin&userId=${this.adminUserId}`);
    const result = await res.json();

    this.adminName = result.name || '-';
    document.getElementById('adminName').textContent = this.adminName;
    document.getElementById('adminRole').textContent = `ระดับ ${result.level || '-'}`;

    this.logAction('เข้าสู่ระบบ Scan', 'มีการเข้าใช้งานหน้า scan');
    this.loadServices();
    this.startCamera();

    document.getElementById('manualPhone')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.manualSearch();
    });
  }

  logAction(title, detail) {
    fetch(GAS_ENDPOINT + '?action=log_admin', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'log_admin',
        name: this.adminName,
        userId: this.adminUserId,
        actionTitle: title,
        detail,
        device: navigator.userAgent,
        token: this.token,
      })
    });
  }

  async onServiceSave() {
    const name = document.getElementById('serviceName').value.trim();
    const price = parseFloat(document.getElementById('priceInput').value) || 0;
    const note = document.getElementById('noteInput').value.trim();
    const point = Math.floor(price * this.pointPerBaht);
  
    if (!name || price <= 0) {
      Swal.showValidationMessage('กรุณากรอกชื่อบริการและราคาถูกต้อง');
      return;
    }
  
    if (!this.serviceList.length) {
      Swal.fire('⚠️ ยังโหลดรายการบริการไม่เสร็จ', 'กรุณารอ 1-2 วินาทีแล้วลองใหม่', 'warning');
      return;
    }
  
    Swal.fire({ title: '⏳ กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
    const payload = {
      action: 'record_service',
      userId: this.foundUser.UserID,
      nameLine: this.foundUser.nameLine || '',
      statusMessage: this.foundUser.statusMessage || '',
      pictureUrl: this.foundUser.pictureUrl || '',
      brand: this.foundUser.Brand,
      model: this.foundUser.Model,
      year: this.foundUser.Year,
      category: this.foundUser.Category || '',
      serviceName: name,
      price,
      point,
      note,
      timestamp: new Date().toISOString(),
      admin: this.adminName
    };

  
    // ✅ DEBUG log
    console.log("📤 กำลังส่ง payload ไปยัง Apps Script:", payload);
  
    const res = await fetch(GAS_ENDPOINT + '?action=record_service', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
      
    const result = await res.json();
    Swal.close();
  
    // ✅ DEBUG result
    console.log("📥 ตอบกลับจาก GAS:", result);
  
    if (result.success) {
      this.logAction('บันทึกบริการ', `✅ ${name} (${price} บาท)`);
      Swal.fire('✅ บันทึกสำเร็จ', `บริการ: ${name}<br>แต้ม: ${point}`, 'success').then(() => liff.closeWindow());
    } else {
      this.logAction('บันทึกบริการ', `❌ ล้มเหลว: ${name}, เหตุ: ${result.message}`);
      Swal.fire('❌ บันทึกไม่สำเร็จ', result.message || '', 'error');
    }
  }

  startCamera() {
    this.html5QrCode = new Html5Qrcode('reader');
    Html5Qrcode.getCameras().then(cameras => {
      if (cameras.length) {
        this.cameraList = cameras;
        const backCam = cameras.find(cam => /back|environment/i.test(cam.label));
        const camId = backCam ? backCam.id : cameras[0].id;
        this.currentCameraIndex = cameras.findIndex(cam => cam.id === camId);
        this.html5QrCode.start(camId, { fps: 10, qrbox: 250 }, (text) => this.onScanSuccess(text));
      } else Swal.fire('ไม่พบกล้อง', '', 'error');
    });
  }

  toggleCamera() {
    if (!this.cameraList.length || !this.html5QrCode) return;
    this.html5QrCode.stop().then(() => {
      this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameraList.length;
      this.html5QrCode.start(
        this.cameraList[this.currentCameraIndex].id,
        { fps: 10, qrbox: 250 },
        (decodedText) => this.onScanSuccess(decodedText)
      );
    });
  }

  async manualSearch() {
    const phone = document.getElementById('manualPhone').value;
    if (!phone) return;

    Swal.fire({ title: '🔍 กำลังค้นหา...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
    const res = await fetch(`${GAS_ENDPOINT}?action=search_phone&phone=${phone}`);
    const result = await res.json();
    Swal.close();

    if (!result.success) return Swal.fire('ไม่พบข้อมูลลูกค้า', '', 'error');
    document.getElementById('manualPhone').value = '';
    this.foundUser = result.data;
    this.showCustomerPopup();
  }

  async onScanSuccess(token) {
    // ปิดการอ่านซ้ำทันที เพื่อป้องกันสแกนซ้ำระหว่างโหลด
    if (this.html5QrCode) {
      await this.html5QrCode.stop();
    }
  
    Swal.fire({
      title: '🔍 กำลังค้นหา QR...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });
  
    const res = await fetch(`${GAS_ENDPOINT}?action=verify_token&token=${token}`);
    const result = await res.json();
    Swal.close();
  
    if (!result.success) {
      Swal.fire('QR ไม่ถูกต้อง', '', 'error');
      this.startCamera(); // กลับมาเปิดกล้องใหม่ถ้าไม่เจอ
      return;
    }
  
    this.foundUser = result.data;
    this.showCustomerPopup(); // ไม่เปิดกล้องอีกเพราะเจอแล้ว
  }


  loadServices() {
    fetch(`${GAS_ENDPOINT}?action=service_list`)
      .then(res => res.json())
      .then(data => {
        this.serviceList = data;
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

  showCustomerPopup() {
    Swal.fire({
      title: 'ข้อมูลลูกค้า',
      html: `
        <p>ชื่อ: ${this.foundUser.Name}</p>
        <p>เบอร์: ${this.foundUser.Phone}</p>
        <p>รถ: ${this.foundUser.Brand} ${this.foundUser.Model} ${this.foundUser.Year}</p>
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
          pointPreview.textContent = Math.floor(p * this.pointPerBaht);
        });
      },
      preConfirm: () => this.onServiceSave()
    });
  }
}

const scanner = new QRScanner();
window.scanner = scanner;
