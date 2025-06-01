const SHEET_API = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) return liff.login();

    const profile = await liff.getProfile();
    const userId = profile.userId;
    const name = profile.displayName;
    const statusMessage = profile.statusMessage || "";
    const pictureUrl = profile.pictureUrl || "";

    const res = await fetch(`${SHEET_API}?action=check_admin&userId=${userId}&name=${encodeURIComponent(name)}&statusMessage=${encodeURIComponent(statusMessage)}&pictureUrl=${encodeURIComponent(pictureUrl)}`);
    const result = await res.json();

    if (result.blacklisted) {
      alert("🚫 คุณถูกจำกัดสิทธิ์การเข้าถึง");
      return liff.closeWindow();
    }

    if (!result.isAdmin) {
      alert("❌ คุณไม่ใช่ผู้ดูแลระบบ");
      return liff.closeWindow();
    }

    // ✅ กรณีเป็น admin จริง
    document.getElementById('adminName').textContent = result.name || 'ไม่ทราบชื่อ';
    const level = parseInt(result.level || "1");

    if (level >= 1) document.querySelector('[data-menu="feedback"]')?.classList.remove("hidden");
    if (level >= 2) document.querySelector('[data-menu="scan"]')?.classList.remove("hidden");
    if (level >= 3) document.querySelector('[data-menu="stats"]')?.classList.remove("hidden");
    if (level >= 5) document.querySelector('[data-menu="settings"]')?.classList.remove("hidden");

  } catch (err) {
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
    console.error(err);
    liff.closeWindow(); // ป้องกันค้าง
  }
});
