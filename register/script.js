let userId = '';
const liffId = '2007421084-0VKG7anQ';
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const confirmText = 'ตกลง';

async function initLIFF() {
    try {
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) liff.login();
        const profile = await liff.getProfile();
        if (!profile.userId) {
            Swal.fire("❗️User ID ไม่ถูกต้อง", "กรุณาลองใหม่อีกครั้งใน LINE APP", "error");
            return;
        }
        userId = profile.userId;
        document.getElementById('userId').value = `${userId.substring(0, 8)}xxx...`;
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: '❗️เกิดปัญหาการเชื่อมต่อ LIFF',
            text: 'กรุณาลองใหม่อีกครั้ง',
            confirmButtonText: confirmText
        });
    }
}

function validatePhone(phoneInput) {
    let phoneRaw = phoneInput.value.replace(/\D/g, '');
    if (/^0[689]/.test(phoneRaw)) {
        if (!/^0[689][0-9]{8}$/.test(phoneRaw)) {
            Swal.fire("Invalid Phone", "เบอร์ขึ้นต้นด้วย 08, 06, 09 ต้องมี 10 หลักเท่านั้น", "warning");
            return null;
        }
    } else {
        if (!/^0[0-9]{8,14}$/.test(phoneRaw)) {
            Swal.fire("Invalid Phone", "เบอร์โทรควรเริ่มด้วย 0 และมี 9-15 หลัก", "warning");
            return null;
        }
    }
    return phoneRaw.length === 10 ? `${phoneRaw.slice(0, 3)}-${phoneRaw.slice(3, 6)}-${phoneRaw.slice(6)}` : phoneRaw;
}

function preparePayload() {
    const name = document.getElementById('name').value.trim();
    const phoneInput = document.getElementById('phone');
    const phoneFormatted = validatePhone(phoneInput);
    if (!phoneFormatted) return null;
    const phoneClean = phoneFormatted.replace(/-/g, '');

    const brand = document.getElementById('brand').value.trim();
    const model = document.getElementById('model').value.trim();
    const year = document.getElementById('year').value.trim();

    if (!userId || !name || !phoneClean || !brand || !model || !year) {
        Swal.fire("Incomplete Data", "กรุณากรอกข้อมูลให้ครบทุกช่อง", "warning");
        return null;
    }

    const currentYear = new Date().getFullYear();
    if (isNaN(parseInt(year)) || parseInt(year) < 1900 || parseInt(year) > currentYear) {
        Swal.fire("Invalid Year", `โปรดใส่ปีให้ถูกต้อง (1900 - ${currentYear})`, "warning");
        return null;
    }

    return { userId, phone: phoneClean, name, brand, model, year, category: 'Unknown', channel: 'LINE' };
}

async function checkDuplicate(payload) {
    try {
        const checkResponse = await fetch(`${GAS_ENDPOINT}?check=1`);
        const checkData = await checkResponse.json();
        return checkData.find(row =>
            row.phone === payload.phone &&
            row.brand === payload.brand &&
            row.model === payload.model &&
            row.year === payload.year
        );
    } catch (error) {
        Swal.fire("⚠ ไม่สามารถตรวจสอบข้อมูลซ้ำได้", "ระบบจะดำเนินการต่อ โปรดตรวจสอบข้อมูลอีกครั้ง", "warning");
        return false;
    }
}

async function sendData(payload) {
    try {
        const response = await fetch(GAS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.status === "success") {
            await Swal.fire("✅ Registration Successful", "Your membership has been registered.", "success");
            confirmButtonText: confirmText
            liff.closeWindow();
        } else {
            throw new Error(data.message || 'Registration failed.');
            confirmButtonText: confirmText
            liff.closeWindow();
        }
    } catch (error) {
        Swal.fire("❗️ส่งข้อมูลล้มเหลว", error.message, "error");
        confirmButtonText: confirmText
        liff.closeWindow();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initLIFF();
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', () => {
        let raw = phoneInput.value.replace(/\D/g, '');
        if (raw.length > 10) raw = raw.slice(0, 10);
        if (raw.length > 6) {
            phoneInput.value = `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
        } else if (raw.length > 3) {
            phoneInput.value = `${raw.slice(0, 3)}-${raw.slice(3)}`;
        } else {
            phoneInput.value = raw;
        }
    });

    const form = document.getElementById('registrationForm');
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const payload = preparePayload();
        if (!payload) return;

        const confirm = await Swal.fire({
            title: 'ยืนยันข้อมูลก่อนส่ง',
            html: `
                ชื่อ: ${payload.name}<br>
                เบอร์โทร: ${document.getElementById('phone').value}<br>
                ยี่ห้อ: ${payload.brand}<br>
                รุ่น: ${payload.model}<br>
                ปี: ${payload.year}`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันส่งข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });

        if (!confirm.isConfirmed) return;

        Swal.fire({
            title: 'กำลังส่งข้อมูล...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const isDuplicate = await checkDuplicate(payload);
        if (isDuplicate) {
            await Swal.fire("❗️ข้อมูลซ้ำ", "เบอร์โทร และ รถรุ่นนี้มีในระบบแล้ว", "error");
            return;
        }

        await sendData(payload);
    });
});
