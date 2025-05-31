// ✅ script.js
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';

const memberInfoEl = document.getElementById('memberInfo');
const historySection = document.getElementById('historySection');
const toggleBtn = document.getElementById('toggleHistory');

// ⭐ Global variable to store current userId for later use (e.g., submitting feedback)
let currentUserId = null;

// async function showPopupLoading() {
//   return await Swal.fire({
//     title: '⏳ กำลังโหลดข้อมูลสมาชิก...',
//     allowOutsideClick: false,
//     allowEscapeKey: false,
//     showConfirmButton: false,
//     didOpen: () => Swal.showLoading()
//   });
// }

function showLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function formatDateToYMD(rawDate) {
  const d = new Date(rawDate);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`; // 📌 ตรงกับ Sheet ฝั่ง Admin ใส่
}


function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

function formatDate(rawDate) {
  const d = new Date(rawDate);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateTime(rawDate) {
  const d = new Date(rawDate);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hour = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} | ${hour}:${min}น.`;
}

// ⏳ ฟังก์ชันสร้าง token ไม่ซ้ำ
function generateToken(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ✅ เพิ่มใน script.js — หลัง currentUserId ถูกกำหนดแล้ว qr code
window.qrToken = null;
    let qrInterval = null;
    
    async function showQRSection() {
      const token = generateToken();
      window.qrToken = token;
      const createdAt = new Date().toISOString();
      const payload = {
        action: "create_token",
        token,
        userId: currentUserId,
        createdAt
      };
      try {
        const res = await fetch(GAS_ENDPOINT + '?action=create_token', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("create_token failed");
        document.getElementById('qrSection').classList.remove('hidden');
        generateQRCode(token, data);
        startQRCountdown();
      } catch (err) {
        Swal.fire("❌ ไม่สามารถสร้าง QR ได้", err.message, "error");
      }
    }
    
    function generateQRCode(text, userInfo) {
      const canvas = document.getElementById("qrCanvas");
      const qr = new QRious({
        element: canvas,
        value: text,
        size: 200
      });
      document.getElementById('qrUserInfo').innerText = `🔑 ${userInfo.name} - ${userInfo.brand} ${userInfo.model} (${userInfo.year})`;
    }

    async function closeQRSection() {
      document.getElementById('qrSection').classList.add('hidden');
      clearInterval(qrInterval);
      await deleteQRToken();
    }

    function startQRCountdown() {
      let count = 600;
      document.getElementById("qrCountdown").textContent = count;
      qrInterval = setInterval(() => {
        count--;
        document.getElementById("qrCountdown").textContent = count;
        if (count <= 0) {
          clearInterval(qrInterval);
          deleteQRToken();
        }
      }, 1000);
    }
    
    
    async function deleteQRToken() {
      if (!window.qrToken) return;
      await fetch(GAS_ENDPOINT + '?action=delete_token', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "delete_token", token: window.qrToken })
      });
      window.qrToken = null;
    }

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // await showPopupLoading();
    showLoadingOverlay();
    console.log("Start login line...");
    await liff.init({ liffId: '2007421084-WXmXrzZY' });
    if (!liff.isLoggedIn()) {
      liff.login();
     return;
   }
    
    
    const profile = await liff.getProfile();
    const userId = profile.userId;
    console.log("✅ userId:", userId);
    currentUserId = userId;  // ⭐ store userId globally for later

    
    const res = await fetch(`${GAS_ENDPOINT}?action=member&userId=${userId}`);
    console.log("✅ response status:", res.status);
    
    if (!res.ok) {
      hideLoadingOverlay(); // ✅ ต้องมาก่อน popup
    
      Swal.fire({
        icon: 'error',
        title: '❗️ ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้',
        text: 'กรุณาลองใหม่อีกครั้งหรือติดต่อ Admin',
        confirmButtonText: 'Close'
      }).then(() => {
        liff.closeWindow(); // ✅ ปิดหลังจาก popup ปิด
      });
    
      return;
    }
    
    const data = await res.json();
    if (!data || !data.name) {
      hideLoadingOverlay(); // ✅ ก่อน Swal.fire
    
      Swal.fire({
        icon: 'error',
        title: '❌ ไม่พบข้อมูลสมาชิก',
        text: 'กรุณาคลิกที่เมนู สมัครสมาชิก',
        confirmButtonText: 'Close'
      }).then(() => {
        liff.closeWindow(); // ✅ หลัง popup ปิด
      });
    
      return;
    }


    // Swal.close(); // ✅ ปิดหลังเช็ค name
    

    memberInfoEl.innerHTML = `
      <p><b>👤 ชื่อ : ${data.name}</b></p>
      <p>📱 เบอร์โทร : ${formatPhone(data.phone)}</p>
      <p>🚗 รถ : ${data.brand} ${data.model} (${data.year})</p>
      <p>📎 หมวดหมู่ : ${data.category}</p>
      <p>💳 แต้มสะสม : ${data.point} แต้ม</p>
      <p>⏰ แต้มหมดอายุ : ${data.expirationDate && data.expirationDate.trim() ? data.expirationDate : '-'}</p>
    `;
    
    toggleBtn.disabled = true;
    historySection.innerHTML = '<p>⏳ กำลังโหลดประวัติ...</p>';
    // แล้วเปิดให้กด toggleBtn ได้หลังจากโหลดเสร็จ
    toggleBtn.disabled = false;

    if (!toggleBtn.classList.contains('bound')) {
      toggleBtn.addEventListener('click', () => {
        historySection.classList.toggle('hidden');
        toggleBtn.textContent = historySection.classList.contains('hidden')
          ? '▼ ดูประวัติการใช้บริการ'
          : '▲ ซ่อนประวัติการใช้บริการ';
      });
      toggleBtn.classList.add('bound');
    }

    const history = Array.isArray(data.serviceHistory) ? data.serviceHistory : [];
  
    // 🔃 เรียงจากวันที่ใหม่ไปเก่า
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (history.length === 0) {
      historySection.innerHTML = '<p>-</p>';
    } else {
      // ⭐ Generate history list with rating/feedback feature
      if (window.innerWidth <= 480) {
        // 📱 Mobile View: use cards
        let historyCardsHtml = '';
        history.forEach((row, index) => {
          const dateStr = formatDateTime(row.date);
          // Card container (add 'rated' class if already rated to adjust style)
          historyCardsHtml += `<div class="history-card${row.rating && row.feedback ? ' rated' : ''}">`;
          if (row.rating) {
            // Already rated: show stars given (static display in top-right)
            historyCardsHtml += '<div class="rating-display">';
            for (let s = 1; s <= 5; s++) {
              historyCardsHtml += `<span class="star static${s <= row.rating ? ' filled' : ''}">${s <= row.rating ? '★' : '☆'}</span>`;
            }
            historyCardsHtml += '</div>';
          } else {
            // Not rated yet: show Rate/Feedback button
            historyCardsHtml += `
              <button class="btn feedback-btn"
                data-date="${dateStr}"
                data-raw="${formatDateToYMD(row.date)}"
                data-service="${row.service || ''}">
                ให้คะแนน / ข้อเสนอแนะ
              </button>
            `;

          }
          // Service details in card
          historyCardsHtml += `
            <p><b>📅 วันที่:</b> ${dateStr}</p>
            <p><b>🚘 ยี่ห้อ/รุ่น:</b> ${row.brand || '-'} ${row.model || '-'}</p>
            <p><b>🛠 บริการ:</b> ${row.service}</p>
            <p><b>💰 ราคา:</b> ${row.price} ฿</p>
            <p><b>🏅 แต้ม:</b> ${row.point}</p>
            <p><b>📝 หมายเหตุ:</b> ${row.note}</p>
          `;
          // Feedback form panel (hidden by default) for not-yet-rated service
          if (!row.rating || !row.feedback) {
            historyCardsHtml += `
              <div class="feedback-panel">
                <div class="star-selector">
                  <span class="star">☆</span><span class="star">☆</span><span class="star">☆</span><span class="star">☆</span><span class="star">☆</span>
                </div>
                <textarea class="feedback-text" placeholder="ข้อเสนอแนะ..."></textarea>
                <button class="btn submit-feedback-btn">ส่งความคิดเห็น</button>
              </div>
            `;
          }
          historyCardsHtml += `</div>`; // close .history-card
        });
        historySection.innerHTML = historyCardsHtml;
      } else {
        // 🖥️ Desktop View: use table
        const rowsHtml = history.map((row, index) => {
          const dateStr = formatDateTime(row.date);
          if (row.rating) {
            // Already rated: single row with static stars in last column
            let starsTd = '';
            for (let s = 1; s <= 5; s++) {
              starsTd += `<span class="star static${s <= row.rating ? ' filled' : ''}">${s <= row.rating ? '★' : '☆'}</span>`;
            }
            return `
              <tr class="history-entry">
                <td>${dateStr}</td>
                <td>${row.brand || '-'} ${row.model || '-'}</td>
                <td>${row.service}</td>
                <td>${row.price} ฿</td>
                <td>${row.point}</td>
                <td>${row.note}</td>
                <td>${starsTd}</td>
              </tr>
            `;
          } else {
            // Not rated: main row + a hidden feedback form row
            return `
              <tr class="history-entry">
                <td>${dateStr}</td>
                <td>${row.brand || '-'} ${row.model || '-'}</td>
                <td>${row.service}</td>
                <td>${row.price} ฿</td>
                <td>${row.point}</td>
                <td>${row.note}</td>
                <td>  <button class="btn feedback-btn"
                      data-date="${dateStr}"
                      data-raw="${formatDateToYMD(row.date)}"
                      data-service="${row.service}">
                      ให้คะแนน / ข้อเสนอแนะ
                  </button>
              </td>
              </tr>
              <tr class="feedback-row hidden">
                <td colspan="7">
                  <div class="feedback-panel">
                    <div class="star-selector">
                      <span class="star">☆</span><span class="star">☆</span><span class="star">☆</span><span class="star">☆</span><span class="star">☆</span>
                    </div>
                    <textarea class="feedback-text" placeholder="ข้อเสนอแนะ..."></textarea>
                    <button class="btn submit-feedback-btn">ส่งความคิดเห็น</button>
                  </div>
                </td>
              </tr>
            `;
          }
        }).join('');
        historySection.innerHTML = `
          <div class="history-section-wrapper">
            <table>
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ยี่ห้อ/รุ่น</th>
                  <th>บริการ</th>
                  <th>ราคา</th>
                  <th>แต้ม</th>
                  <th>หมายเหตุ</th>
                  <th>คะแนน</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      }
    }

    hideLoadingOverlay();
    toggleBtn.disabled = false;
    toggleBtn.classList.remove("disabled"); // เพิ่มความสวยงามกรณีใส่ CSS .disabled
    
    // ⭐ Event listeners for Rating/Feedback interactions
    const feedbackButtons = document.querySelectorAll('.feedback-btn');
    feedbackButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.innerWidth <= 480) {
          // Mobile: Toggle slide-down panel in card
          const card = btn.closest('.history-card');
          const panel = card.querySelector('.feedback-panel');
          if (panel) {
            panel.classList.toggle('open');
          }
        } else {
          // Desktop: Toggle slide-down panel row in table
          const mainRow = btn.closest('tr');
          const panelRow = mainRow.nextElementSibling;
          if (panelRow && panelRow.classList.contains('feedback-row')) {
            const panelDiv = panelRow.querySelector('.feedback-panel');
            if (panelRow.classList.contains('hidden')) {
              panelRow.classList.remove('hidden');
              // force reflow before expanding (for smooth transition)
              panelDiv.offsetHeight;
              panelDiv.classList.add('open');
            } else {
              panelDiv.classList.remove('open');
              setTimeout(() => {
                panelRow.classList.add('hidden');
              }, 300);  // hide row after transition
            }
          }
        }
      });
    });
    // Star rating selection events
    const starContainers = document.querySelectorAll('.star-selector');
    starContainers.forEach(container => {
      const stars = container.querySelectorAll('.star');
      container.dataset.rating = '0';  // initialize selected rating as 0
      stars.forEach((starEl, idx) => {
        // Highlight stars on hover (desktop only, no effect on mobile)
        starEl.addEventListener('mouseenter', () => {
          stars.forEach((s, i) => {
            if (i <= idx) {
              s.textContent = '★';
              s.classList.add('filled');
            } else {
              s.textContent = '☆';
              s.classList.remove('filled');
            }
          });
        });
        starEl.addEventListener('mouseleave', () => {
          const currentRating = parseInt(container.dataset.rating) || 0;
          stars.forEach((s, i) => {
            if (i < currentRating) {
              s.textContent = '★';
              s.classList.add('filled');
            } else {
              s.textContent = '☆';
              s.classList.remove('filled');
            }
          });
        });
        // Set rating on click
        starEl.addEventListener('click', () => {
          const selectedRating = idx + 1;
          container.dataset.rating = String(selectedRating);
          stars.forEach((s, i) => {
            if (i < selectedRating) {
              s.textContent = '★';
              s.classList.add('filled');
            } else {
              s.textContent = '☆';
              s.classList.remove('filled');
            }
          });
        });
      });
    });
    // Submit feedback event
    const submitButtons = document.querySelectorAll('.submit-feedback-btn');
    submitButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const panelDiv = btn.closest('.feedback-panel');
        const ratingVal = parseInt(panelDiv.querySelector('.star-selector').dataset.rating) || 0;
        const feedbackText = panelDiv.querySelector('.feedback-text').value.trim();
        if (!ratingVal) {
          // If no star selected, alert user
          await Swal.fire({
            icon: 'warning',
            title: 'กรุณาให้คะแนน (เลือกจำนวนดาว)',
            confirmButtonText: 'ตกลง'
          });
          return;
        }
        try {
          // Show sending status (SweetAlert2 loading)
          btn.disabled = true;
          Swal.fire({
            title: 'กำลังส่งความคิดเห็น...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
          // Identify the service entry via data attributes
          let serviceDate = '', serviceName = '';
          let feedbackBtn;
          if (window.innerWidth <= 480) {
            const card = btn.closest('.history-card');
            feedbackBtn = card.querySelector('.feedback-btn');
          } else {
            const panelRow = btn.closest('.feedback-row');
            const mainRow = panelRow.previousElementSibling;
            feedbackBtn = mainRow.querySelector('.feedback-btn');
          }
          if (feedbackBtn) {
            serviceDate = feedbackBtn.getAttribute('data-raw');  // เพราะมันถูก format มาแล้วเป็น yyyy-MM-dd
            serviceName = feedbackBtn.getAttribute('data-service');
          }
          if (!feedbackBtn) {
            Swal.fire({ icon: 'error', title: '❌ ไม่พบข้อมูลบริการ', confirmButtonText: 'ปิด' });
            btn.disabled = false;
            return;
          }

          // Send feedback data to Google Apps Script (updates spreadsheet)
         const res = await fetch(GAS_ENDPOINT + '?action=feedback', {
            redirect: "follow",
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
              action: 'feedback',
              userId: currentUserId,
              date: serviceDate,
              service: serviceName,
              rating: ratingVal,
              feedback: feedbackText
            })
          });

          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          // On success, update the UI:
          if (window.innerWidth <= 480) {
            // Mobile: close form and show stars on card
            const card = btn.closest('.history-card');
            panelDiv.classList.remove('open');             // slide-up the panel
            const fbButton = card.querySelector('.feedback-btn');
            if (fbButton) fbButton.remove();               // remove "ให้คะแนน" button
            // Display static stars in top-right corner
            let staticStarsHtml = '<div class="rating-display">';
            for (let s = 1; s <= 5; s++) {
              staticStarsHtml += `<span class="star static${s <= ratingVal ? ' filled' : ''}">${s <= ratingVal ? '★' : '☆'}</span>`;
            }
            staticStarsHtml += '</div>';
            card.insertAdjacentHTML('beforeend', staticStarsHtml);
            card.classList.add('rated');  // mark card as rated (for styling)
          } else {
            // Desktop: remove form row and replace button with static stars in table
            const panelRow = btn.closest('.feedback-row');
            const mainRow = panelRow.previousElementSibling;
            panelRow.remove();  // remove the feedback form row from table
            const fbButton = mainRow.querySelector('.feedback-btn');
            if (fbButton) {
              const cell = fbButton.parentElement;
              fbButton.remove();
              // Insert static stars into the cell
              let starsDisplay = '';
              for (let s = 1; s <= 5; s++) {
                starsDisplay += `<span class="star static${s <= ratingVal ? ' filled' : ''}">${s <= ratingVal ? '★' : '☆'}</span>`;
              }
              cell.innerHTML = starsDisplay;
            }
          }
          console.log("📦 ส่ง feedback", {
            userId: currentUserId,
            date: serviceDate,
            service: serviceName,
            rating: ratingVal,
            feedback: feedbackText
          });
          // Show success feedback
          Swal.fire({
            icon: 'success',
            title: 'ส่งความคิดเห็นสำเร็จ!',
            text: 'ขอบคุณสำหรับความคิดเห็นของคุณ',
            confirmButtonText: 'ตกลง'
          });
        } catch (error) {
          console.error('Error sending feedback:', error);
          // Show error message
          Swal.fire({
            icon: 'error',
            title: '❌ ไม่สามารถส่งความคิดเห็นได้',
            text: 'กรุณาลองใหม่อีกครั้ง',
            confirmButtonText: 'ปิด'
          });
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    hideLoadingOverlay();
    console.error('Error:', err);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถโหลดข้อมูลสมาชิกได้',
      confirmButtonText: 'Close'
    });
    liff.closeWindow();
  }
});
