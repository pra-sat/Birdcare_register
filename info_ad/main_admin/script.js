const SHEET_API = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) return liff.login();

    const profile = await liff.getProfile();
    const userId = profile.userId;

    const res = await fetch(`${SHEET_API}?action=check_admin&userId=${userId}`);
    const result = await res.json();

    document.getElementById('adminName').textContent = result.name || 'ไม่ทราบชื่อ';

    if (checkResult.isAdmin && parseInt(checkResult.level) >= 5) {
      document.querySelector('[data-menu="settings"]').classList.remove("hidden");
    }


  } catch (err) {
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
    console.error(err);
  }
});
