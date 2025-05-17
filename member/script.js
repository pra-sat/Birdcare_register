const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await liff.init({ liffId: '2007421084-WXmXrzZY' });
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        const profile = await liff.getProfile();
        const userId = profile.userId;
        console.log('UserId:', userId);

        // ✅ เรียกผ่าน proxy mode แบบหลบ CORS
        const res = await fetch(GAS_ENDPOINT, {
            method: "POST",
            redirect: "follow",
            body: JSON.stringify({ proxy: "getMember", userId }),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });

        if (!res.ok) throw new Error('ไม่สามารถติดต่อ Server ได้');

        const data = await res.json();
        if (!data || !data.name) {
            document.getElementById('memberInfo').innerHTML = "❗️ ไม่พบข้อมูลสมาชิกในระบบ กรุณาติดต่อ Admin";
            return;
        }

        document.getElementById('memberInfo').innerHTML = `
            <h3>👤 ชื่อสมาชิก: ${data.name}</h3>
            <p>📱 เบอร์โทร: ${data.phone}<br>
            🚗 รถ: ${data.brand} ${data.model} (${data.year})<br>
            🏷 หมวดหมู่: ${data.category}<br>
            💳 แต้มสะสม: ${data.point} แต้ม<br>
            ⏰ แต้มหมดอายุ: ${data.expirationDate}</p>
            <small>📌 หากต้องการแก้ไขข้อมูล กรุณาทักแชทหรือแจ้ง Admin</small>
        `;
    } catch (err) {
        console.error('Error:', err);
        document.getElementById('memberInfo').innerHTML = "❗️ เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่หรือติดต่อ Admin";
    }
});
