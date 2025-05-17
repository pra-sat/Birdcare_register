const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await liff.init({ liffId: '2007421084-WXmXrzZY' });
    if (!liff.isLoggedIn()) return liff.login();

    const profile = await liff.getProfile();
    const userId = profile.userId;
    console.log('UserId:', userId);

    // ดึงข้อมูลสมาชิก
    const res = await fetch(`${GAS_ENDPOINT}?action=member&userId=${userId}`);
    const data = await res.json();

    if (!data || !data.name) {
      document.getElementById('memberInfo').innerHTML = "❗️ ไม่พบข้อมูลสมาชิกในระบบ กรุณาติดต่อ Admin";
      return;
    }

    document.getElementById('memberInfo').innerHTML = `
👤 ${data.name}
📱 เบอร์โทร: ${data.phone}
🚗 รถ: ${data.brand} ${data.model} (${data.year})
🏷 หมวดหมู่: ${data.category}
💳 แต้มสะสม: ${data.point} แต้ม
⏰ แต้มหมดอายุ: ${new Date(data.expirationDate).toLocaleDateString('th-TH', { dateStyle: 'full' })}
    `;

    // Toggle ปุ่มแสดง/ซ่อน
    const toggleBtn = document.getElementById('toggleService');
    const historyDiv = document.getElementById('serviceHistory');
    let isLoaded = false;

    toggleBtn.addEventListener('click', async () => {
      if (historyDiv.classList.contains('hidden')) {
        toggleBtn.textContent = 'ซ่อนประวัติการใช้บริการ ▲';
        historyDiv.classList.remove('hidden');

        // โหลดข้อมูลประวัติครั้งแรก
        if (!isLoaded) {
          try {
            const res2 = await fetch(`${GAS_ENDPOINT}?action=service&userId=${userId}`);
            const serviceData = await res2.json();

            if (!serviceData || serviceData.length === 0) {
              historyDiv.innerHTML = "– ไม่มีประวัติการใช้บริการ";
            } else {
              historyDiv.innerHTML = serviceData.map(s =>
                `📅 ${s.date}\n🛠 บริการ: ${s.service}\n💰 ราคา: ${s.price} บาท\n💳 แต้ม: ${s.point} แต้ม\n📌 หมายเหตุ: ${s.note || '-'}`
              ).join('\n\n');
            }

            isLoaded = true;
          } catch (err) {
            historyDiv.innerHTML = "❗️ โหลดประวัติไม่สำเร็จ กรุณาลองใหม่";
          }
        }
      } else {
        toggleBtn.textContent = 'ดูประวัติการใช้บริการ ▼';
        historyDiv.classList.add('hidden');
      }
    });

  } catch (err) {
    console.error('Error:', err);
    document.getElementById('memberInfo').innerHTML = "❗️ เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่หรือติดต่อ Admin";
  }
});
