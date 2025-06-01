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

    await fetch(`${SHEET_API}?action=feedback_none`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        userId, name, statusMessage, pictureUrl,
        phone: "'0", score: "", feedback: ""
      })
    });

    
    // แยก fetch สำหรับ check_admin โดยเฉพาะ
    const checkRes = await fetch(`${SHEET_API}?action=check_admin&userId=${userId}`);
    const result = await checkRes.json();
    
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
      const btn = document.getElementById('submitFeedbackBtn');
      btn.disabled = true;
      btn.textContent = "⏳ กำลังส่ง...";
       
      const score = document.getElementById('scoreInput').value.trim();
      const feedback = document.getElementById('feedbackInput').value.trim();
      const phone = "'0";
      

    
      if (!feedback) {
        Swal.fire({
          icon: 'warning',
          title: 'กรุณาพิมพ์ข้อเสนอแนะ',
        });
        btn.disabled = false;
        btn.textContent = "✅ ส่งข้อเสนอแนะ";
        return;
      }
    
      const payload = {
        action: "feedback_none",
        userId, name, statusMessage, pictureUrl,
        phone, score, feedback
      };
    
      const res = await fetch(`${SHEET_API}?action=feedback_none`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

    
      const result = await res.json();
      if (result.status === "success") {
        Swal.fire({
          icon: 'success',
          title: '✅ ขอบคุณสำหรับข้อเสนอแนะ',
          confirmButtonText: 'ปิดหน้าต่าง',
        }).then(() => {
          liff.closeWindow();
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: '❌ เกิดข้อผิดพลาด',
          text: result.message || 'ไม่สามารถส่งข้อมูลได้',
        });
      btn.disabled = false;
      btn.textContent = "✅ ส่งข้อเสนอแนะ";
      }
    });

