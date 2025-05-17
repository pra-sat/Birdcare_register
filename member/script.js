// ✅ script.js
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';

const memberInfoEl = document.getElementById('memberInfo');
const historySection = document.getElementById('historySection');
const toggleBtn = document.getElementById('toggleHistory');

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
      // 📱 Mobile View
      if (window.innerWidth <= 480) {
        historySection.innerHTML = history.map(row => `
          <div class="history-card">
            <p><b>📅 วันที่:</b> ${formatDateTime(row.date)}</p>
            <p><b>🚘 ยี่ห้อ/รุ่น:</b> ${row.brand || '-'} ${row.model || '-'}</p>
            <p><b>🛠 บริการ:</b> ${row.service}</p>
            <p><b>💰 ราคา:</b> ${row.price} ฿</p>
            <p><b>🏅 แต้ม:</b> ${row.point}</p>
            <p><b>📝 หมายเหตุ:</b> ${row.note}</p>
          </div>
        `).join('');
      } else {
        // 🖥️ Desktop Table View
        const rows = history.map(row => `
          <tr>
            <td>${formatDateTime(row.date)}</td>
            <td>${row.brand || '-'} ${row.model || '-'}</td>
            <td>${row.service}</td>
            <td>${row.price} ฿</td>
            <td>${row.point}</td>
            <td>${row.note}</td>
          </tr>`).join('');
    
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
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      }
    }


    hideLoadingOverlay();
    toggleBtn.disabled = false;
    toggleBtn.classList.remove("disabled"); // เพิ่มความสวยงามกรณีใส่ CSS .disabled


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
