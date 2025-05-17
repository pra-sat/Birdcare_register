// ✅ script.js
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';

const memberInfoEl = document.getElementById('memberInfo');
const historySection = document.getElementById('historySection');
const toggleBtn = document.getElementById('toggleHistory');

async function showPopupLoading() {
  await Swal.fire({
    title: '⏳ กำลังโหลดข้อมูลสมาชิก...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading()
  });
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
    await showPopupLoading();
    await liff.init({ liffId: '2007421084-WXmXrzZY' });
    if (!liff.isLoggedIn()) return liff.login();

    const profile = await liff.getProfile();
    const userId = profile.userId;
    //console.log('UserId:', userId);

    // ✅ เรียก API ด้วย userId ที่ได้แล้ว
    const res = await fetch(`${GAS_ENDPOINT}?action=member&userId=${userId}`);
    const data = await res.json();

    if (!data || !data.name) throw new Error('ไม่พบข้อมูลสมาชิก');
    Swal.close();

    memberInfoEl.innerHTML = `
      <p><b>👤 ${data.name}</b></p>
      <p>📱 เบอร์โทร: ${formatPhone(data.phone)}</p>
      <p>🚗 รถ: ${data.brand} ${data.model} (${data.year})</p>
      <p>📎 หมวดหมู่: ${data.category}</p>
      <p>💳 แต้มสะสม: ${data.point} แต้ม</p>
      <p>⏰ แต้มหมดอายุ: ${data.expirationDate && data.expirationDate.trim() ? data.expirationDate : '-'}</p>
    `;

    toggleBtn.addEventListener('click', () => {
      historySection.classList.toggle('hidden');
    });

    const history = Array.isArray(data.serviceHistory) ? data.serviceHistory : [];
    if (history.length === 0) {
      historySection.innerHTML = '<p>-</p>';
    } else {
      const rows = history.map(row => `
        <tr>
          <td>${formatDateTime(row.date)}</td>
          <td>${row.service}</td>
          <td>${row.price} ฿</td>
          <td>${row.point}</td>
          <td>${row.note}</td>
        </tr>`).join('');
      historySection.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>บริการ</th>
              <th>ราคา</th>
              <th>แต้ม</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

  } catch (err) {
    console.error('Error:', err);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถโหลดข้อมูลสมาชิกได้',
      confirmButtonText: 'OK'
    });
  }
});
