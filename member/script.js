const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';

document.addEventListener('DOMContentLoaded', async () => {
  const memberInfoEl = document.getElementById('memberInfo');
  const historySection = document.getElementById('historySection');
  const toggleBtn = document.getElementById('toggleHistory');

  Swal.fire({
    title: '⏳ กำลังโหลดข้อมูลสมาชิก',
    text: 'กรุณารอสักครู่...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    await liff.init({ liffId: '2007421084-WXmXrzZY' });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const userId = profile.userId;

    const res = await fetch(`${GAS_ENDPOINT}?action=member&userId=${userId}`);
    if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');

    const data = await res.json();
    if (!data || !data.name) {
      Swal.close();
      memberInfoEl.innerHTML = "❗️ ไม่พบข้อมูลสมาชิก กรุณาติดต่อ Admin";
      return;
    }

    const formattedPhone = formatPhone(data.phone);
    const formattedExp = formatDate(data.expirationDate);

    memberInfoEl.innerHTML = `
      <p><b>ชื่อ:</b> ${data.name}</p>
      <p><b>เบอร์โทร:</b> ${formattedPhone}</p>
      <p><b>รถ:</b> ${data.brand} ${data.model} (${data.year})</p>
      <p><b>หมวดหมู่:</b> ${data.category}</p>
      <p><b>แต้มสะสม:</b> ${data.point} แต้ม</p>
      <p><b>แต้มหมดอายุ:</b> ${formattedExp}</p>
    `;

    toggleBtn.addEventListener('click', () => {
      historySection.classList.toggle('hidden');
    });

    // ดึงประวัติแยก
    const historyRes = await fetch(`${GAS_ENDPOINT}?action=service&userId=${userId}`);
    const historyData = await historyRes.json();

    if (!Array.isArray(historyData) || historyData.length === 0) {
      historySection.innerHTML = "<p>-</p>";
    } else {
      let html = `
        <table class="history-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>บริการ</th>
              <th>ราคา</th>
              <th>แต้ม</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
      `;
      for (const item of historyData) {
        html += `
          <tr>
            <td>${formatDateTime(item.date)}</td>
            <td>${item.service}</td>
            <td>${item.price}฿</td>
            <td>${item.point}</td>
            <td>${item.note || '-'}</td>
          </tr>`;
      }
      html += `</tbody></table>`;
      historySection.innerHTML = html;
    }

    Swal.close();

  } catch (err) {
    console.error(err);
    Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลสมาชิกได้", "error");
    memberInfoEl.innerHTML = "❗️ เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่หรือติดต่อ Admin";
  }
});

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : raw;
}

function formatDate(rawDate) {
  const d = new Date(rawDate);
  if (isNaN(d)) return '-';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateTime(rawDate) {
  const d = new Date(rawDate);
  if (isNaN(d)) return '-';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hour = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} | ${hour}:${min}น.`;
}
