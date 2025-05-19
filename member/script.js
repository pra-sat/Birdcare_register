// ✅ script.js
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';

const memberInfoEl = document.getElementById('memberInfo');
const historySection = document.getElementById('historySection');
const toggleBtn = document.getElementById('toggleHistory');

let currentUserId = null; // ⭐ store userId globally

function showLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function formatDateToYMD(rawDate) {
  const d = new Date(rawDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTime(rawDate) {
  const d = new Date(rawDate);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} | ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}น.`;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    showLoadingOverlay();
    await liff.init({ liffId: '2007421084-WXmXrzZY' });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }
    const profile = await liff.getProfile();
    currentUserId = profile.userId;
    const res = await fetch(`${GAS_ENDPOINT}?action=member&userId=${currentUserId}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    if (!data || !data.name) throw new Error('No member data found');

    memberInfoEl.innerHTML = `
      <p><b>👤 ชื่อ : ${data.name}</b></p>
      <p>📱 เบอร์โทร : ${data.phone}</p>
      <p>🚗 รถ : ${data.brand} ${data.model} (${data.year})</p>
      <p>📎 หมวดหมู่ : ${data.category}</p>
      <p>💳 แต้มสะสม : ${data.point} แต้ม</p>
      <p>⏰ แต้มหมดอายุ : ${data.expirationDate || '-'}</p>
    `;

    const history = Array.isArray(data.serviceHistory) ? data.serviceHistory.sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
    renderServiceHistory(history);
  } catch (err) {
    console.error(err);
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
    liff.closeWindow();
  } finally {
    hideLoadingOverlay();
  }
});

function renderServiceHistory(history) {
  toggleBtn.disabled = false;
  toggleBtn.classList.remove("disabled");
  if (!toggleBtn.classList.contains('bound')) {
    toggleBtn.addEventListener('click', () => {
      historySection.classList.toggle('hidden');
      toggleBtn.textContent = historySection.classList.contains('hidden') ? '▼ ดูประวัติการใช้บริการ' : '▲ ซ่อนประวัติการใช้บริการ';
    });
    toggleBtn.classList.add('bound');
  }

  if (!history.length) {
    historySection.innerHTML = '<p>-</p>';
    return;
  }

  const rowsHtml = history.map(row => {
    const dateStr = formatDateTime(row.date);
    const stars = row.rating ? [...Array(5)].map((_, i) => `<span class="star static${i + 1 <= row.rating ? ' filled' : ''}">${i + 1 <= row.rating ? '★' : '☆'}</span>`).join('') : 
      `<button class="btn feedback-btn" data-raw="${formatDateToYMD(row.date)}" data-service="${row.service}">ให้คะแนน / ข้อเสนอแนะ</button>`;

    return `
      <tr class="history-entry">
        <td>${dateStr}</td>
        <td>${row.brand} ${row.model}</td>
        <td>${row.service}</td>
        <td>${row.price} ฿</td>
        <td>${row.point}</td>
        <td>${row.note}</td>
        <td>${stars}</td>
      </tr>
    `;
  }).join('');

  historySection.innerHTML = `
    <table><thead><tr><th>วันที่</th><th>ยี่ห้อ/รุ่น</th><th>บริการ</th><th>ราคา</th><th>แต้ม</th><th>หมายเหตุ</th><th>คะแนน</th></tr></thead><tbody>
    ${rowsHtml}
    </tbody></table>
  `;

  document.querySelectorAll('.feedback-btn').forEach(btn => {
    btn.addEventListener('click', () => showFeedbackForm(btn));
  });
}

function showFeedbackForm(btn) {
  Swal.fire({
    title: 'ให้คะแนน / ข้อเสนอแนะ',
    html: `
      <div class="star-selector">
        ${[...Array(5)].map(() => '<span class="star">☆</span>').join('')}
      </div>
      <textarea id="feedbackText" class="swal2-textarea" placeholder="พิมพ์ข้อเสนอแนะ... (ขั้นต่ำ 10 คำ)"></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: 'ส่ง',
    preConfirm: () => {
      const stars = document.querySelectorAll('.swal2-html-container .star');
      const rating = [...stars].filter(s => s.classList.contains('filled')).length;
      const feedback = document.getElementById('feedbackText').value.trim();
      if (rating === 0 || feedback.length < 10) {
        Swal.showValidationMessage('กรุณาให้ดาวและพิมพ์ข้อเสนอแนะอย่างน้อย 10 คำ');
        return false;
      }
      return { rating, feedback };
    },
    didOpen: () => {
      const starEls = document.querySelectorAll('.swal2-html-container .star');
      starEls.forEach((star, i) => {
        star.addEventListener('click', () => {
          starEls.forEach((s, idx) => {
            s.textContent = idx <= i ? '★' : '☆';
            s.classList.toggle('filled', idx <= i);
          });
        });
      });
    }
  }).then(async result => {
    if (result.isConfirmed && result.value) {
      await sendFeedback(btn.dataset.raw, btn.dataset.service, result.value.rating, result.value.feedback);
    }
  });
}

async function sendFeedback(date, service, rating, feedback) {
  try {
    const res = await fetch(GAS_ENDPOINT + '?action=feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'feedback',
        userId: currentUserId,
        date,
        service,
        rating,
        feedback
      })
    });
    if (!res.ok) throw new Error('ส่งไม่สำเร็จ');
    Swal.fire({ icon: 'success', title: '✅ ส่งความคิดเห็นสำเร็จ!', text: 'ขอบคุณสำหรับความคิดเห็นของคุณ' });
  } catch (err) {
    Swal.fire({ icon: 'error', title: '❌ ไม่สามารถส่งความคิดเห็นได้', text: err.message });
  }
}
