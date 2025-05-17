// ตรวจสอบการโหลด LIFF SDK


let userId = '';
const liffId = '2007421084-0VKG7anQ';
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const confirmText = 'ตกลง';


async function initLIFF() {
    try {
        console.log('Initializing LIFF');
        await liff.init({ liffId });
        console.log('LIFF Init OK');

        if(!liff.isLoggedIn()){
            liff.login();
        }  


        // if (!liff.isInClient()) {
        //     showSwal({
        //         icon: 'error',
        //         title: '❗️ข้อผิดพลาด-0',
        //         text: 'กรุณาเปิดหน้านี้ใน LINE App เท่านั้น',
        //         confirmButtonText: confirmText
        //     });
        //     return;
        // }

        const profile = await liff.getProfile();
        console.log('Profile retrieved:', profile);

       if (!profile.userId) {
            Swal.fire("❗️User ID ไม่ถูกต้อง", "กรุณาลองใหม่อีกครั้งใน LINE APP", "error");
            return;
        }

        userId = profile.userId;  // เก็บ userId เต็มตรงนี้เท่านั้น
        const maskedUserId = userId.substring(0, 8) + 'xxx...';
        const userIdInput = document.getElementById('userId');
        if (userIdInput) {
            userIdInput.value = maskedUserId;
            console.log('userId set to:', userId);
        } else {
            console.error('userId input element not found');
        }

    } catch (err) {
        console.error('LIFF Init Error:', err);
        Swal.fire({
            icon: 'error',
            title: '❗️เกิดปัญหาการเชื่อมต่อ LIFF-1',
            text: 'กรุณาลองใหม่อีกครั้งหรือติดต่อ Admin',
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
    const name = document.getElementById('name');
    const brand = document.getElementById('brand');
    const model = document.getElementById('model');
    const year = document.getElementById('year');
    const category = document.getElementById('category');

    if (!brand || !model || !year || !category) {
        console.error('Required form elements not found');
        return;
    }

    if (typeof carData === 'undefined') {
        console.error('carData is not defined. Ensure all_car_model.js is loaded.');
        Swal.fire({
            icon: 'error',
            title: '❗️ข้อผิดพลาด-3',
            text: 'ไม่สามารถโหลดข้อมูลยี่ห้อรถได้ กรุณาลองใหม่หรือติดต่อ Admin',
            confirmButtonText: confirmText
        });
        return;
    }

    // Populate brand list
    for (let brandName in carData) {
        const opt = document.createElement('option');
        opt.value = brandName;
        document.getElementById('brandList').appendChild(opt);
    }

    // Update model list based on brand (รองรับพิมพ์ฟรี)
    brand.addEventListener('input', () => {
        model.value = '';
        year.value = '';
        category.value = 'Unknown';
        document.getElementById('modelList').innerHTML = '';
        document.getElementById('yearList').innerHTML = '';
        const brandVal = brand.value.trim();
        console.log('Selected Brand:', brandVal);
        if (carData[brandVal]) {
            Object.keys(carData[brandVal].models).forEach(modelName => {
                const opt = document.createElement('option');
                opt.value = modelName;
                document.getElementById('modelList').appendChild(opt);
            });
        } else {
            console.warn(`No models found for brand: ${brandVal}. Proceeding with manual input.`);
        }
    });

    // Update year list and category based on model (รองรับพิมพ์ฟรี)
    model.addEventListener('input', () => {
        year.value = '';
        category.value = 'Unknown';
        document.getElementById('yearList').innerHTML = '';
        const brandVal = brand.value.trim();
        const modelVal = model.value.trim();
        console.log('Selected Model:', modelVal);
        if (carData[brandVal]?.models[modelVal]) {
            carData[brandVal].models[modelVal].years.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                document.getElementById('yearList').appendChild(opt);
                console.log('Selected year:', y);
            });
            category.value = carData[brandVal].models[modelVal].category;
        } else {
            console.warn(`No years found for brand: ${brandVal}, model: ${modelVal}. Proceeding with manual input.`);
        }
    });


        const form = document.getElementById('registrationForm');
    if (!form) {
        console.error('Registration form not found');
        return;
    }


        // เมื่อคลิกสมัครสมาชิก
        // Form submission handler
form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!userId) {
        Swal.fire("Error", "❗️Could not get LINE user profile. Please try again in LINE app.-4", "error");
        return;
    }

    const phoneInputElement = document.getElementById('phone');
    let phoneRaw = phoneInputElement.value.replace(/\D/g, '');
    const validatedPhone = validatePhone(phoneInputElement);
    if (!validatedPhone) return;

    const phone = validatedPhone;  // ส่ง display ให้ user เป็น format
    const name = document.getElementById('name').value.trim();
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model').value;
    const year = document.getElementById('year').value.trim();
    const category = document.getElementById('category').value;
    const channelElement = document.getElementById('channel');
    const channel = channelElement ? channelElement.value.trim() : 'LINE';

    if (!name || !phone || !brand || !model || !year || !category) {
        Swal.fire("Incomplete Data", "Please fill in all required fields.", "warning");
        return;
    }

    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        Swal.fire("Invalid Year", `Please enter a valid year (1900 - ${currentYear}).`, "warning");
        return;
    }

    const payload = { 
        userId, 
        phone, 
        name: name.trim(), 
        brand: brand.trim(), 
        model: model.trim(), 
        year: year.trim(), 
        category, 
        channel 
    };

    const confirm = await Swal.fire({
        title: 'ยืนยันข้อมูลก่อนส่ง',
        html: `ชื่อ: ${payload.name}<br>
            เบอร์โทร: ${payload.phone}<br>
            ยี่ห้อ: ${payload.brand}<br>
            รุ่น: ${payload.model}<br>
            ปี: ${payload.year}`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันส่งข้อมูล',
        cancelButtonText: 'ยกเลิก'
    });
    if (!confirm.isConfirmed) return;

    const submitBtn = document.getElementById('submitBtn');  // ✅ ตรงนี้ควรอยู่ใน handler เสมอ
    if (submitBtn.disabled) return;  // ดักทันที
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    
    Swal.fire({
        title: 'กำลังส่งข้อมูล...',
        text: 'กรุณารอสักครู่',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const checkResponse = await fetch(`${GAS_ENDPOINT}?action=register&check=1`);
        const checkData = await checkResponse.json();
        const duplicate = checkData.find(row =>
            row.phone.replace(/\D/g, '') === phoneRaw &&  // ✅ เปรียบเทียบแบบไม่มี -
            row.brand === brand &&
            row.model === model &&
            row.year === year
        );
        if (duplicate) {
            await Swal.fire({
                icon: 'error',
                title: '❗️ข้อมูลซ้ำ',
                text: 'เบอร์โทร และ รถรุ่นนี้ มีในระบบแล้ว\n\nกรุณาติดต่อ Admin',
                confirmButtonText: confirmText
            });
                submitBtn.disabled = false; // ✅ คืนค่า
                submitBtn.textContent = "Submit"; // ✅ คืนข้อความ
            return;
        }
    } catch (checkError) {
        console.error("Error checking duplicates:", checkError);
        await Swal.fire({
            icon: 'warning',
            title: '⚠ ไม่สามารถตรวจสอบข้อมูลซ้ำได้',
            text: 'ระบบจะดำเนินการต่อ โปรดตรวจสอบข้อมูลอีกครั้ง',
            confirmButtonText: confirmText
        });
        liff.closeWindow();
    }

        console.log("Preparing to send payload:", payload);

    try {
        const response = await fetch(GAS_ENDPOINT + '?action=register', {
            redirect: "follow",
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });

        const textData = await response.text();
        console.log('Full Response:', textData);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${textData}`);
        }

        let data;
        try {
            data = JSON.parse(textData);
        } catch (parseError) {
            throw new Error(`Invalid JSON response: ${textData}`);
        }

        if (data.status === "success") {
            await Swal.fire("✅ Registration Successful", "Your membership has been registered.", "success");
            submitBtn.textContent = "✅Submit";
            liff.closeWindow();
            console.log("Final Sending Payload:", JSON.stringify(payload));

        } else {
            throw new Error(data.message || "Registration failed");
        }

    } catch (error) {
        console.error("Error during fetch:", error);
        await Swal.fire({
            icon: 'error',
            title: '❗️Registration Failed',
            text: error.message,
            confirmButtonText: confirmText
        });
        liff.closeWindow();
    }

    finally {
            form.reset();
            // ป้องกันกรณี userId หายระหว่าง session
            if (userId) {
                const userIdInput = document.getElementById('userId');
                if (userIdInput) {
                    userIdInput.value = userId.substring(0, 8) + 'xxx...';
                }
            }
            document.getElementById('name').focus();
            submitBtn.disabled = false;
        }
    });
});
