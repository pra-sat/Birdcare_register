// ✅ ค่าเริ่มต้น และ config ต่าง ๆ
let userId = '';
const liffId = '2007421084-0VKG7anQ';
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const confirmText = 'ตกลง';

// ✅ ฟังก์ชันโหลด LIFF
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
        const userIdInput = document.getElementById('userId');
        if (userIdInput) userIdInput.value = `${userId.substring(0, 8)}xxx...`;
    } catch (err) {
        console.error('LIFF Init Error:', err);
        Swal.fire({
            icon: 'error',
            title: '❗️เกิดปัญหาการเชื่อมต่อ LIFF',
            text: 'กรุณาลองใหม่อีกครั้ง',
            confirmButtonText: confirmText
        });
    }
}

// ✅ Format phone + ตรวจสอบ
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

// ✅ เตรียม Payload
function preparePayload() {
    const name = document.getElementById('name').value.trim();
    const phoneInput = document.getElementById('phone');
    const phoneFormatted = validatePhone(phoneInput);
    if (!phoneFormatted) return null;

    const brand = document.getElementById('brand').value.trim();
    const model = document.getElementById('model').value.trim();
    const year = document.getElementById('year').value.trim();
    const category = document.getElementById('category').value;
    const channel = document.getElementById('channel')?.value.trim() || 'LINE';

    if (!userId || !name || !phoneFormatted || !brand || !model || !year || !category) {
        Swal.fire("Incomplete Data", "กรุณากรอกข้อมูลให้ครบทุกช่อง", "warning");
        return null;
    }

    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        Swal.fire("Invalid Year", `โปรดใส่ปีให้ถูกต้อง (1900 - ${currentYear})`, "warning");
        return null;
    }

    return { userId, phone: phoneFormatted, name, brand, model, year, category, channel };
}

// ✅ เช็คซ้ำเบอร์+รถรุ่น
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
        console.error("Error checking duplicates:", error);
        Swal.fire("⚠ ไม่สามารถตรวจสอบข้อมูลซ้ำได้", "ระบบจะดำเนินการต่อ โปรดตรวจสอบข้อมูลอีกครั้ง", "warning");
        return false;
    }
}

// ✅ ส่งข้อมูลจริง
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
            liff.closeWindow();
        } else {
            throw new Error(data.message || 'Registration failed.');
        }
    } catch (error) {
        console.error("Error sending data:", error);
        Swal.fire("❗️ส่งข้อมูลล้มเหลว", error.message, "error");
    }
}

// ✅ Event หลัก
document.addEventListener('DOMContentLoaded', () => {
    initLIFF();
    const phoneInput = document.getElementById('phone');
    const brand = document.getElementById('brand');
    const model = document.getElementById('model');
    const year = document.getElementById('year');
    const category = document.getElementById('category');

    // Format phone ขณะพิมพ์
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

    // ✅ Populate brand list แบบแนะนำ + ปล่อย user พิมพ์เองได้
    if (typeof carData !== 'undefined') {
        for (let brandName in carData) {
            const opt = document.createElement('option');
            opt.value = brandName;
            document.getElementById('brandList').appendChild(opt);
        }
    }

    brand.addEventListener('input', () => {
        document.getElementById('modelList').innerHTML = '';
        document.getElementById('yearList').innerHTML = '';
        const brandVal = brand.value.trim();
        if (carData?.[brandVal]) {
            Object.keys(carData[brandVal].models).forEach(modelName => {
                const opt = document.createElement('option');
                opt.value = modelName;
                document.getElementById('modelList').appendChild(opt);
            });
        } // ✅ ถ้าไม่เจอ → อนุญาตให้พิมพ์เอง
    });

    model.addEventListener('input', () => {
        document.getElementById('yearList').innerHTML = '';
        const brandVal = brand.value.trim();
        const modelVal = model.value.trim();
        if (carData?.[brandVal]?.models[modelVal]) {
            carData[brandVal].models[modelVal].years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                document.getElementById('yearList').appendChild(opt);
            });
            category.value = carData[brandVal].models[modelVal].category;
        } // ✅ ถ้าไม่เจอ → อนุญาตให้พิมพ์เอง
    });

    const form = document.getElementById('registrationForm');
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const payload = preparePayload();
        if (!payload) return;

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        Swal.fire({
            title: 'กำลังส่งข้อมูล...',
            text: 'กรุณารอสักครู่',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const isDuplicate = await checkDuplicate(payload);
        if (isDuplicate) {
            await Swal.fire("❗️ข้อมูลซ้ำ", "เบอร์โทร และ รถรุ่นนี้มีในระบบแล้ว", "error");
            submitBtn.disabled = false;
            submitBtn.textContent = "ส่งข้อมูล";
            return;
        }

        await sendData(payload);

        form.reset();
        if (userId) {
            const userIdInput = document.getElementById('userId');
            if (userIdInput) userIdInput.value = `${userId.substring(0, 8)}xxx...`;
        }
        document.getElementById('name').focus();
        submitBtn.disabled = false;
    });
});
