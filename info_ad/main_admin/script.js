// ✅ รีแฟกเตอร์เป็นแบบ Class
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

document.addEventListener('DOMContentLoaded', () => {
  const adminManager = new AdminManager();
  adminManager.init();
});

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

      await liff.init({ liffId });
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

    document.body.style.display = 'block';
    document.getElementById('adminName').textContent = result.name || 'ไม่ทราบชื่อ';
    document.getElementById('adminLevel').textContent = result.level || '1';
    document.getElementById('adminRole').textContent = result.role || '-';

    const level = parseInt(result.level || '1');
    if (level >= 1) document.querySelector('[data-menu="feedback"]')?.classList.remove("hidden");
    if (level >= 2) document.querySelector('[data-menu="scan"]')?.classList.remove("hidden");
    if (level >= 3) document.querySelector('[data-menu="stats"]')?.classList.remove("hidden");
    if (level >= 5) document.querySelector('[data-menu="settings"]')?.classList.remove("hidden");

    await this.logAction(result.name, 'เข้าสู่ระบบ', 'มีการเข้าใช้งานหน้า admin');
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



// script แบบ function ใช้ได้อยู่ แต่ละลองใช้แบบ class ดู ด้านบน
/*const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';
let userId = "N/A";

function logout() {
  liff.logout();
  liff.closeWindow();
}

async function sendAdminLog(name, action, detail) {
  try {
    const userAgent = navigator.userAgent;
    let token = "N/A";
    if (liff.getIDToken && typeof liff.getIDToken === 'function') {
      token = await liff.getIDToken();
    }

    const res = await fetch(GAS_ENDPOINT + '?action=log_admin', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'log_admin',
        name,
        userId, // ✅ global ที่อัปเดตแล้ว
        actionTitle: action,
        detail,
        device: userAgent,
        token: token
      })
    });
    const result = await res.json();
    console.log("📘 บันทึก Admin Log:", result);

  } catch (err) {
    console.warn("❌ บันทึก Log ไม่สำเร็จ:", err);
  }
}


document.addEventListener('DOMContentLoaded', async () => {
  try {
    Swal.fire({
      title: 'กำลังโหลดข้อมูล...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    await liff.init({ liffId });
    if (!liff.isLoggedIn()) return liff.login();

    const profile = await liff.getProfile();
    userId = profile.userId;
    const name = profile.displayName;
    const statusMessage = profile.statusMessage || "";
    const pictureUrl = profile.pictureUrl || "";

    async function silentlyUpdateLineProfile(profile) {
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

    const [updateRes, checkRes] = await Promise.all([
      silentlyUpdateLineProfile(profile),
      fetch(`${GAS_ENDPOINT}?action=check_admin&userId=${userId}&name=${encodeURIComponent(name)}&statusMessage=${encodeURIComponent(statusMessage)}&pictureUrl=${encodeURIComponent(pictureUrl)}`)
    ]);
    
    const result = await checkRes.json();
    
    Swal.close(); // ✅ ปิด popup เมื่อโหลดเสร็จ

    if (result.blacklisted) {
      Swal.fire({
        icon: 'error',
        title: '🚫 ถูกจำกัดสิทธิ์',
        text: 'คุณไม่มีสิทธิ์เข้าใช้งานหน้านี้',
        confirmButtonText: 'ปิดหน้าต่าง'
      }).then(() => {
        liff.closeWindow();
      });
      return;
    }

    if (!result.isAdmin) {
      Swal.fire({
        icon: 'error',
        title: '❌ ไม่ใช่ผู้ดูแลระบบ',
        text: 'ระบบจำกัดเฉพาะผู้ที่ได้รับอนุญาต',
        confirmButtonText: 'ปิดหน้าต่าง'
      }).then(() => {
        liff.closeWindow();
      });
      return;
    }

    if (result.isAdmin) {
      document.body.style.display = 'block'; // ✅ แสดงเฉพาะเมื่อยืนยันแล้ว
    }

    document.getElementById('adminName').textContent = result.name || 'ไม่ทราบชื่อ';
    //document.getElementById('adminPic').src = pictureUrl;
    const level = parseInt(result.level || "1");

    if (level >= 1) document.querySelector('[data-menu="feedback"]')?.classList.remove("hidden");
    if (level >= 2) document.querySelector('[data-menu="scan"]')?.classList.remove("hidden");
    if (level >= 3) document.querySelector('[data-menu="stats"]')?.classList.remove("hidden");
    if (level >= 5) document.querySelector('[data-menu="settings"]')?.classList.remove("hidden");

    document.getElementById('adminLevel').textContent = level;
    document.getElementById('adminRole').textContent = result.role || '-';
    
    console.log("🆔 userId ก่อนส่ง Log:", userId);
    await sendAdminLog(result.name, 'เข้าสู่ระบบ', 'มีการเข้าใช้งานหน้า admin');

  } catch (err) {
    Swal.close();
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'โหลดข้อมูลผู้ดูแลไม่สำเร็จ',
      confirmButtonText: 'ปิดหน้าต่าง'
    }).then(() => {
      liff.closeWindow();
    });
    console.error(err);
  }
});
*/
