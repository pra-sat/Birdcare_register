const SHEET_API = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

// ✅ เพิ่ม: เก็บข้อมูลผู้ใช้ LINE
const profile = await liff.getProfile();
const userId = profile.userId;
const name = profile.displayName;
const statusMessage = profile.statusMessage || "";
const pictureUrl = profile.pictureUrl || "";

// ✅ เพิ่ม: เปิด-ปิดแถบฟีดแบ็ก
document.getElementById('openFeedbackBtn').addEventListener('click', () => {
  document.getElementById('feedbackPanel').classList.remove('hidden');
});
document.getElementById('closeLiffBtn').addEventListener('click', () => {
  liff.closeWindow(); // ✅ ปิด LIFF แทนการซ่อน
});

// ✅ เพิ่ม: ส่งข้อมูล feedback ไป Google Apps Script
document.getElementById('submitFeedbackBtn').addEventListener('click', async () => {
  const phone = document.getElementById('phoneInput').value.trim();
  const score = document.getElementById('scoreInput').value.trim();
  const feedback = document.getElementById('feedbackInput').value.trim();

  if (!phone || !score || !feedback) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  const payload = {
    action: "feedback_none",
    userId, name, statusMessage, pictureUrl,
    phone, score, feedback
  };

  const res = await fetch(SHEET_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await res.json();
  if (result.status === "success") {
    alert("✅ ขอบคุณสำหรับข้อเสนอแนะ");
    liff.closeWindow(); // ✅ รีเซ็ตโดยปิด LIFF ไปเลย
  } else {
    alert("❌ เกิดข้อผิดพลาด: " + result.message);
  }
});




document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loadingOverlay');

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
      // ✅ ถ้าเป็นแอดมิน → ไปหน้า main_admin.html
      window.location.href = 'main_admin.html';
    } else {
      // ❌ ไม่ใช่แอดมิน → แสดงหน้า user
      document.getElementById('userView').classList.remove('hidden');
    }
  } catch (err) {
    await liff.closeWindow();
  } finally {
    loading.classList.add('hidden');
  }
});

