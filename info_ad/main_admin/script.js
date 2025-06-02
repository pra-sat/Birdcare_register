const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

function logout() {
  liff.logout();
  liff.closeWindow();
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
    const userId = profile.userId;
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
    document.getElementById('adminPic').src = pictureUrl;
    const level = parseInt(result.level || "1");

    if (level >= 1) document.querySelector('[data-menu="feedback"]')?.classList.remove("hidden");
    if (level >= 2) document.querySelector('[data-menu="scan"]')?.classList.remove("hidden");
    if (level >= 3) document.querySelector('[data-menu="stats"]')?.classList.remove("hidden");
    if (level >= 5) document.querySelector('[data-menu="settings"]')?.classList.remove("hidden");

    document.getElementById('adminLevel').textContent = level;
    document.getElementById('adminRole').textContent = result.role || '-';

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
