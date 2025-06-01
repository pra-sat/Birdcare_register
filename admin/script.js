const SHEET_API = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loadingOverlay');
  loading.classList.remove('hidden');

  try {
    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const userId = profile.userId;

    const res = await fetch(`${SHEET_API}?action=check_admin&userId=${userId}`);
    const result = await res.json();

    if (result.isAdmin) {
      document.getElementById('adminName').innerText = `👤 คุณ: ${result.name || 'แอดมิน'}`;
      document.getElementById('adminMenu').classList.remove('hidden');
      document.getElementById('adminView').classList.remove('hidden');
    } else {
      // ถ้าไม่ใช่แอดมิน แสดงหน้า user
      document.getElementById('userView').classList.remove('hidden');
    }

  } catch (err) {
    // ถ้ามีข้อผิดพลาดใด ๆ (ไม่สามารถโหลด profile, หรือ fetch ไม่ได้) → ปิด LIFF ไปเลย
    await liff.closeWindow();
  } finally {
    loading.classList.add('hidden');
  }
});


