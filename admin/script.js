const SHEET_API = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loadingOverlay');
  loading.classList.remove('hidden'); // แสดงโหลด

  try {
    await liff.init({ liffId: 'YOUR_LIFF_ID' });

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
    } else {
      document.getElementById('adminName').innerText = "❌ คุณไม่ใช่ผู้ดูแลระบบ";
      document.getElementById('adminNotice').innerText = "กรุณาติดต่อเจ้าของระบบเพื่อขอสิทธิ์";
    }

  } catch (err) {
    document.getElementById('adminName').innerText = "⚠️ ไม่สามารถโหลดข้อมูลได้";
    document.getElementById('adminNotice').innerText = "โปรดลองใหม่ หรือแจ้งผู้ดูแลระบบ";
  } finally {
    loading.classList.add('hidden'); // ซ่อนโหลด
  }
});

