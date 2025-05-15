
const liffId = '2007421084-6bzYVymA'; // LIFF ID ของคุณ
const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec';

async function initLIFF() {
    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
    } else {
        const profile = await liff.getProfile();
        document.getElementById('profile').innerText = `สวัสดี ${profile.displayName}`;
        document.getElementById('registerBtn').onclick = () => register(profile.userId);
    }
}

function register(userId) {
    fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: userId,
            action: 'register'
        })
    }).then(() => {
        alert('ลงทะเบียนเรียบร้อยแล้ว');
    }).catch((err) => {
        console.error(err);
        alert('เกิดข้อผิดพลาด');
    });
}

window.onload = initLIFF;
