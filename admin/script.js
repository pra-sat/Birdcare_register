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

    // ✅ ส่งข้อมูล LINE ก่อน
    const sendLineRes = await fetch(`${SHEET_API}?action=feedback_none`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        userId, name, statusMessage, pictureUrl,
        phone: "'0", score: "", feedback: ""
      })
    });
    await sendLineRes.json();

    // ✅ ตรวจสอบว่าเป็นแอดมินหรือไม่
    const checkRes = await fetch(`${SHEET_API}?action=check_admin&userId=${userId}`);
    const checkResult = await checkRes.json();

    if (checkResult.isAdmin) {
      window.location.href = 'main_admin.html';
    } else {
      document.getElementById('userView').classList.remove('hidden');

      const scoreInput = document.getElementById('scoreInput');
      const feedbackInput = document.getElementById('feedbackInput');
      const btn = document.getElementById('submitFeedbackBtn');

      document.getElementById('openFeedbackBtn').addEventListener('click', () => {
        document.getElementById('feedbackPanel').classList.remove('hidden');
      });

      document.getElementById('closeLiffBtn').addEventListener('click', () => {
        liff.closeWindow();
      });

      document.getElementById('submitFeedbackBtn').addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = "⏳ กำลังส่ง...";

        const score = scoreInput.value.trim();
        const feedback = feedbackInput.value.trim();
        const phone = "'0";

        if (!feedback) {
          Swal.fire({ icon: 'warning', title: 'กรุณาพิมพ์ข้อเสนอแนะ' });
          btn.disabled = false;
          btn.textContent = "✅ ส่งข้อเสนอแนะ";
          return;
        }

        const payload = {
          action: "feedback_none",
          userId, name, statusMessage, pictureUrl,
          phone, score, feedback
        };

        try {
          const res = await fetch(`${SHEET_API}?action=feedback_none`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });

          const result = await res.json();
          if (["success", "feedback_saved", "entry_updated"].includes(result.status)) {
            Swal.fire({
              icon: 'success',
              title: '✅ ขอบคุณสำหรับข้อเสนอแนะ',
              confirmButtonText: 'ปิดหน้าต่าง',
            }).then(() => {
              scoreInput.value = "";
              feedbackInput.value = "";
              liff.closeWindow();
            });
          } else {
            throw new Error(result.message || "ไม่สามารถส่งข้อมูลได้");
          }
        } catch (err) {
          Swal.fire({ icon: 'error', title: '❌ เกิดข้อผิดพลาด', text: err.message });
          btn.disabled = false;
          btn.textContent = "✅ ส่งข้อเสนอแนะ";
        }
      });
    }
  } catch (err) {
    console.error('❌ LIFF Init Error:', err);
    await liff.closeWindow();
  } finally {
    loading.classList.add('hidden');
  }
});
