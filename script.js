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



document.addEventListener('DOMContentLoaded', () => {
    initLIFF();
    const phone = document.getElementById('phone');
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
            const currentUserId = userId;
            const name = document.getElementById('name').value.trim();
            let phone = document.getElementById('phone').value.trim();
            const brand = document.getElementById('brand').value;
            const model = document.getElementById('model').value;
            const year = document.getElementById('year').value.trim();
            const category = document.getElementById('category').value;
            const channelElement = document.getElementById('channel');
            const channel = channelElement ? channelElement.value.trim() : 'LINE';


        // Basic form validation
        if (!userId) {
        Swal.fire("Error", "❗️Could not get LINE user profile. Please try again in LINE app.-4", "error");
        return;
        }
        if (!name || !phone || !brand || !model || !year || !category) {
        Swal.fire("Incomplete Data", "Please fill in all required fields.", "warning");
        return;
        }

        // ✅ ตรวจสอบเบอร์โทร
        phone = phone.startsWith('0') ? phone : (/^[0-9]{8,9}$/.test(phone) ? '0' + phone : phone);
        if (!/^0[0-9]{8,14}$/.test(phone)) {
            Swal.fire("Invalid Phone", "Phone number should be 9-15 digits and start with 0.", "warning");
            return;
        }



        // Validate year (reasonable range)
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(year, 10);
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        Swal.fire("Invalid Year", "Please enter a valid year (1900 - " + currentYear + ").", "warning");
        return;
        }

        // Prepare data payload
        const payload = { userId: currentUserId, phone, name, brand, model, year, category, channel };
        const submitBtn = document.getElementById('submitBtn');
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
            console.log("Preparing to send payload:", payload);
            const response = await fetch(GAS_ENDPOINT, {
                redirect: "follow",
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            console.log("Server Response:", data);

            if (data.status === "success") {
                console.log("Sending payload:", payload);
                await Swal.fire("✅ Registration Successful", "Your membership has been registered.", "success");
                form.reset();
                document.getElementById('statusMessage').textContent = "✅ บันทึกเรียบร้อย";
                document.getElementById('userId').value = userId;  // ให้คง Masked UserId แสดงหลัง reset
                document.getElementById('name').value = name;
                document.getElementById('name').focus();
            } else {
                await Swal.fire("❗️Registration Failed", data.message || "❗️Registration could not be completed.", "error");
            }
        } catch (error) {
            console.error("Error during fetch:", error);
            await Swal.fire("Error", "❗️Unable to submit form. Please try again.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit";
        }
    });
});
