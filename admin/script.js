const SHEET_API = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

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
    const name = profile.displayName;
    const statusMessage = profile.statusMessage || "";
    const pictureUrl = profile.pictureUrl || "";

    const res = await fetch(`${SHEET_API}?action=check_admin&userId=${userId}`);
    const result = await res.json();

    if (result.isAdmin) {
      // ✅ ถ้าเป็นแอดมิน → ไปหน้า main_admin.html
      window.location.href = 'main_admin.html';
    } else {
      // ✅ ไม่ใช่แอดมิน → แสดงหน้า user และผูก event ให้ส่ง feedback
      document.getElementById('userView').classList.remove('hidden');

      // ✅ เปิดแถบ feedback
      document.getElementById('openFeedbackBtn').addEventListener('click', () => {
        document.getElementById('feedbackPanel').classList.remove('hidden');
      });

      // ✅ ปิด LIFF
      document.getElementById('closeLiffBtn').addEventListener('click', () => {
        liff.closeWindow();
      });

      // ✅ ส่ง feedback
      document.getElementById('submitFeedbackBtn').addEventListener('click', async () => {
        const score = document.getElementById('scoreInput').value.trim();
        const feedback = document.getElementById('feedbackInput').value.trim();
        const phone = "'0"; // ✅ แก้: ส่งเบอร์โทรเป็นค่าคงที่ พร้อมใส่ ' นำหน้า

        if (!score || !feedback) {
          alert("กรุณากรอกคะแนนและข้อเสนอแนะ");
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
          liff.closeWindow();
        } else {
          alert("❌ เกิดข้อผิดพลาด: " + result.message);
        }
      });
    }

  } catch (err) {
    await liff.closeWindow();
  } finally {
    loading.classList.add('hidden');
  }
});
