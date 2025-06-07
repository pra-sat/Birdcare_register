// script.js (main_admin)
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
window.liffId = '2007421084-2OgzWbpV';

document.addEventListener('DOMContentLoaded', () => {
  const adminManager = new AdminManager();
  adminManager.init();
});


//----------------------------------------------------------------- QRScanner --------------------------------------------------
class QRScanner {
    
  constructor() {
    this.isScanning = false;
    this.pointPerBaht = 0.1;
    this.adminUserId = '';
    this.adminName = '-';
    this.token = '';
    this.foundUser = null;
    this.serviceList = [];
    this.currentCameraIndex = 0;
    this.html5QrCode = null;
    this.cameraList = [];

      // ✅ เชื่อมปุ่มแบบไม่ต้องใช้ onclick ใน HTML
        document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('manualPhone')?.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') this.manualSearch();
        });
        document.querySelector('#scannerSearchBtn')?.addEventListener('click', () => this.manualSearch());
        document.querySelector('#scannerSwitchBtn')?.addEventListener('click', () => this.toggleCamera());
        document.querySelector('#scannerCloseBtn')?.addEventListener('click', () => this.closePopup());
      });
  }
    
    togglePopup(show = true) {
      const popup = document.getElementById('scanPopup');
      if (!popup) return;
      if (show) {
        popup.classList.add('show');
      } else {
        popup.classList.remove('show');
      }
    }
  
  async openScanPopup() {
    this.togglePopup(true); 
    if (!this.adminUserId) {
       await this.init(); // ✅ รอ init เสร็จก่อน
    }
      
    const { userId, name, token } = window.adminInfo || {};
    if (userId && name) {
      this.adminUserId = userId;
      this.adminName = name;
      this.token = token;
    }
    
    this.startCamera();
    this.loadServices();
  }

  closePopup() {
    const popup = document.getElementById('scanPopup');
    if (popup) this.togglePopup(false);
    if (this.html5QrCode) this.html5QrCode.stop();
  }

  async init() {
    await liff.init({ liffId: window.liffId });
    if (!liff.isLoggedIn()) return liff.login();

    const profile = await liff.getProfile().catch(err => {
      Swal.fire("❌ ไม่สามารถโหลดโปรไฟล์ LINE", err.message || '', 'error');
    });
    if (!profile) return;

    this.adminUserId = profile.userId;
    this.token = liff.getIDToken ? await liff.getIDToken() : '';

    const res = await fetch(`${GAS_ENDPOINTS}?action=check_admin&userId=${this.adminUserId}`);
    const result = await res.json();

    this.adminName = result.name || '-';
    document.getElementById('adminName').textContent = this.adminName;
    document.getElementById('adminRole').textContent = `ระดับ ${result.level || '-'}`;

    this.logAction('เข้าสู่ระบบ Scan', 'มีการเข้าใช้งานหน้า scan');
    this.loadServices();
    
    document.getElementById('manualPhone')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.manualSearch();
    });
  }

  logAction(title, detail) {
    fetch(GAS_ENDPOINTS + '?action=log_admin', {
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
      //timestamp: new Date().toISOString(),
      timestamp: this.getThaiDateTime(), // รูปแบบ dd/MM/yyyy, HH:mm:ss
      admin: this.adminName
    };

  
    // ✅ DEBUG log
    console.log("📤 กำลังส่ง payload ไปยัง Apps Script:", payload);
  
    const res = await fetch(GAS_ENDPOINTS + '?action=record_service', {
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
  try {
    if (!this.html5QrCode) {
      this.html5QrCode = new Html5Qrcode('reader');
    }

    Html5Qrcode.getCameras()
      .then(cameras => {
        if (!cameras.length) {
          Swal.fire('ไม่พบกล้อง', '', 'error');
          console.error("ไม่พบกล้องในอุปกรณ์นี้");
          return;
        }

        if (this.html5QrCode._isScanning) {
          console.log("📸 กล้องกำลังทำงานอยู่แล้ว");
          return;
        }

        this.cameraList = cameras;
        const backCam = cameras.find(cam => /back|environment/i.test(cam.label));
        const camId = backCam ? backCam.id : cameras[0].id;
        this.currentCameraIndex = cameras.findIndex(cam => cam.id === camId);

        this.html5QrCode.start(
          camId,
          { fps: 10, qrbox: 250 },
          text => this.onScanSuccess(text)
        );
      })
      .catch(err => {
        Swal.fire('เกิดข้อผิดพลาดกับกล้อง', err.message || '', 'error');
        console.error("❌ startCamera error:", err);
      });  
     } catch (e) {
      Swal.fire('กล้องไม่พร้อมใช้งาน', e.message || '', 'error');
       console.error("❌ html5QrCode init fail:", e);
    }
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

  getThaiDateTime(dateObj = new Date()) {
    const d = dateObj;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    const second = d.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hour}:${minute}:${second}`;
  }

  async manualSearch() {
    const phone = document.getElementById('manualPhone').value;
    if (!phone) return;

    Swal.fire({ title: '🔍 กำลังค้นหา...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
    const res = await fetch(`${GAS_ENDPOINTS}?action=search_phone&phone=${phone}`);
    const result = await res.json();
    Swal.close();

    if (!result.success) return Swal.fire('ไม่พบข้อมูลลูกค้า', '', 'error');
    document.getElementById('manualPhone').value = '';
    this.foundUser = result.data;
    this.showCustomerPopup();
        /** ✅ เพิ่มตรงนี้ก่อนเรียก Swal */
      this.closePopup(); // ปิดกล้อง + ปิด popup
      setTimeout(() => this.showCustomerPopup(), 300); // รอให้ DOM ปรับก่อนค่อยแสดง Swal
  }

  async onScanSuccess(token) {
    // ปิดการอ่านซ้ำทันที เพื่อป้องกันสแกนซ้ำระหว่างโหลด
    if (this.html5QrCode) {
      await this.html5QrCode.stop();
    }

    if (this.isScanning) return;
    this.isScanning = true;
    setTimeout(() => { this.isScanning = false; }, 2000); // 2 วินาที
  
    Swal.fire({
      title: '🔍 กำลังค้นหา QR...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });
  
    const res = await fetch(`${GAS_ENDPOINTS}?action=verify_token&token=${token}`);
    const result = await res.json();
    Swal.close();
  
    if (!result.success) {
      Swal.fire('QR ไม่ถูกต้อง', '', 'error');
      this.isScanning = false;
      this.startCamera(); // กลับมาเปิดกล้องใหม่ถ้าไม่เจอ
      return;
    }
    this.foundUser = result.data;
    this.showCustomerPopup(); // ไม่เปิดกล้องอีกเพราะเจอแล้ว

        /** ✅ เพิ่มตรงนี้ก่อนเรียก Swal */
      this.closePopup(); // ปิดกล้อง + ปิด popup
      setTimeout(() => this.showCustomerPopup(), 300); // รอให้ DOM ปรับก่อนค่อยแสดง Swal
  }


  loadServices() {
    const existingList = document.getElementById('serviceOptions');
    if (existingList) existingList.remove();

    fetch(`${GAS_ENDPOINTS}?action=service_list`)
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


//----------------------------------------------------------------- main admin --------------------------------------------------
class AdminManager {
  constructor() {
    this.userId = "N/A";
    this.name = "-";
    this.statusMessage = "";
    this.pictureUrl = "";
    this.token = "N/A";
  }

  async init() {
    try {
      Swal.fire({
        title: 'กำลังโหลดข้อมูล...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      await liff.init({ liffId: window.liffId });
      if (!liff.isLoggedIn()) return liff.login();

      const profile = await liff.getProfile();
      this.userId = profile.userId;
      this.name = profile.displayName;
      this.statusMessage = profile.statusMessage || "";
      this.pictureUrl = profile.pictureUrl || "";

      if (liff.getIDToken && typeof liff.getIDToken === 'function') {
        this.token = await liff.getIDToken();
      }

      await Promise.all([
        this.updateLineProfile(profile),
        this.checkAdmin()
      ]);

    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'โหลดข้อมูลผู้ดูแลไม่สำเร็จ',
        confirmButtonText: 'ปิดหน้าต่าง'
      }).then(() => liff.closeWindow());
      console.error(err);
    }
  }

  async updateLineProfile(profile) {
    try {
      const payload = {
        action: 'update_line_profile',
        userId: profile.userId,
        nameLine: profile.displayName,
        statusMessage: profile.statusMessage || "",
        pictureUrl: profile.pictureUrl || ""
      };

      const res = await fetch(GAS_ENDPOINT + '?action=update_line_profile', {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("✅ LINE Profile อัปเดตอัตโนมัติ:", data);
    } catch (err) {
      console.warn("⚠️ อัปเดตโปรไฟล์ LINE ล้มเหลว:", err);
    }
  }

  async checkAdmin() {
    const res = await fetch(`${GAS_ENDPOINT}?action=check_admin&userId=${this.userId}&name=${encodeURIComponent(this.name)}&statusMessage=${encodeURIComponent(this.statusMessage)}&pictureUrl=${encodeURIComponent(this.pictureUrl)}`);
    const result = await res.json();

    Swal.close();

    if (result.blacklisted) {
      return Swal.fire({
        icon: 'error',
        title: '🚫 ถูกจำกัดสิทธิ์',
        text: 'คุณไม่มีสิทธิ์เข้าใช้งานหน้านี้',
        confirmButtonText: 'ปิดหน้าต่าง'
      }).then(() => liff.closeWindow());
    }

    if (!result.isAdmin) {
      return Swal.fire({
        icon: 'error',
        title: '❌ ไม่ใช่ผู้ดูแลระบบ',
        text: 'ระบบจำกัดเฉพาะผู้ที่ได้รับอนุญาต',
        confirmButtonText: 'ปิดหน้าต่าง'
      }).then(() => liff.closeWindow());
    }

    await this.logAction(result.name, 'เข้าสู่ระบบ', 'มีการเข้าใช้งานหน้า admin');
    document.body.style.display = 'block';
    document.getElementById('adminName').textContent = result.name || 'ไม่ทราบชื่อ';
    document.getElementById('adminLevel').textContent = result.level || '1';
    document.getElementById('adminRole').textContent = result.role || '-';

    const level = parseInt(result.level || '1');
    if (level >= 1) document.querySelector('[data-menu="feedback"]')?.classList.remove("hidden");
    if (level >= 2) document.getElementById('scanBtn')?.classList.remove("hidden");{
      window.adminInfo = {
        userId: this.userId,
        name: this.name,
        token: this.token
      };
    }
    if (level >= 3) document.querySelector('[data-menu="stats"]')?.classList.remove("hidden");
    if (level >= 5) document.querySelector('[data-menu="settings"]')?.classList.remove("hidden");
  }

  async logAction(name, action, detail) {
    try {
      const res = await fetch(GAS_ENDPOINT + '?action=log_admin', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'log_admin',
          name,
          userId: this.userId,
          actionTitle: action,
          detail,
          device: navigator.userAgent,
          token: this.token
        })
      });

      const result = await res.json();
      console.log("📘 บันทึก Admin Log:", result);
    } catch (err) {
      console.warn("❌ บันทึก Log ไม่สำเร็จ:", err);
    }
  }

  logout() {
    liff.logout();
    liff.closeWindow();
  }
}

const scannerInstance = new QRScanner();
window.scanner = scannerInstance;

document.getElementById('scanBtn')?.addEventListener('click', async () => {
  if (window.scanner?.openScanPopup) {
    await window.scanner.openScanPopup();
  } else {
    Swal.fire("❌ ไม่สามารถเปิดกล้อง", "ระบบยังไม่พร้อมใช้งาน", "error");
  }
});
