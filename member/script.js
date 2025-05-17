const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';

document.addEventListener('DOMContentLoaded', async () => {
  const memberInfoEl = document.getElementById('memberInfo');
  const historySection = document.getElementById('historySection');
  const toggleBtn = document.getElementById('toggleHistory');

  try {
    await liff.init({ liffId: '2007421084-WXmXrzZY' });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const userId = profile.userId;

    const res = await fetch(GAS_ENDPOINT + '?action=member&userId=' + encodeURIComponent(userId));
    if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูล');

    const data = await res.json();
    if (!data || !data.name) {
      memberInfoEl.innerHTML = "❗️ ไม่พบข้อมูลสมาชิก กรุณาติดต่อ Admin";
      return;
    }

    const expDate = formatDate(data.expirationDate);

    memberInfoEl.innerHTML = `
      <p>👤 <b>${data.name}</b></p>
      <p>📱 เบอร์โทร: ${data.phone}</p>
      <p>🚗 รถ: ${data.brand} ${data.model} (${data.year})</p>
      <p>📎 หมวดหมู่: ${data.category}</p>
      <p>💳 แต้มสะสม: ${data.point} แต้ม</p>
      <p>⏰ แต้มหมดอายุ: ${expDate}</p>
    `;

    // แสดงประวัติการใช้บริการ
    toggleBtn.addEventListener('click', () => {
      historySection.classList.toggle('hidden');
    });

    const history = data.serviceHistory || [];
    if (history.length === 0) {
      historySection.innerHTML = "-";
    } else {
      historySection.innerHTML = history.map(item => `
        <div>
          📅 ${item.date} | 🛠 ${item.service} | 💵 ${item.price}฿ | 🎁 ${item.point} แต้ม
          ${item.note ? `| 📝 ${item.note}` : ''}
        </div>
      `).join('<hr style="border:0.5px dashed #888;">');
    }

  } catch (err) {
    console.error(err);
    memberInfoEl.innerHTML = "❗️ เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่หรือติดต่อ Admin";
  }
});

function formatDate(rawDate) {
  const d = new Date(rawDate);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
