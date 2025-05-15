// script.js

const webhookURL = 'https://script.google.com/macros/s/AKfycbyUj_iKVOAzGCCB4LilahJ2xZjlKvPQI1bB-F083-B8hkl1IYq_EovLKUAaps9uQCtQaw/exec';

let userId = '';

function initializeLiff() {
    liff.init({ liffId: '2007421084-6bzYVymA' })  // เปลี่ยนเป็น LIFF ID ของคุณ
        .then(() => {
            if (liff.isLoggedIn()) {
                liff.getProfile().then(profile => {
                    userId = profile.userId;
                    document.getElementById('userId').value = userId;
                }).catch(err => {
                    console.error('Error getting profile:', err);
                });
            }
        })
        .catch(err => {
            console.error('LIFF Initialization failed', err);
        });
}

function populateBrandList() {
    const brandSet = new Set();
    carData.forEach(item => brandSet.add(item.brand));
    const brandList = document.getElementById('brandList');
    brandSet.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        brandList.appendChild(option);
    });
}

function populateModelList(selectedBrand) {
    const modelSet = new Set();
    carData.forEach(item => {
        if (item.brand === selectedBrand) modelSet.add(item.model);
    });
    const modelList = document.getElementById('modelList');
    modelList.innerHTML = '';
    modelSet.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        modelList.appendChild(option);
    });
}

function populateYearList(selectedBrand, selectedModel) {
    const yearSet = new Set();
    carData.forEach(item => {
        if (item.brand === selectedBrand && item.model === selectedModel) {
            yearSet.add(item.year);
        }
    });
    const yearList = document.getElementById('yearList');
    yearList.innerHTML = '';
    yearSet.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        yearList.appendChild(option);
    });
}

function clearForm() {
    document.getElementById('registerForm').reset();
    document.getElementById('model').disabled = true;
    document.getElementById('year').disabled = true;
}

document.addEventListener('DOMContentLoaded', function() {
    initializeLiff();
    populateBrandList();

    // เมื่อเลือกรายการยี่ห้อรถ ให้เติมรายการรุ่นรถ
    document.getElementById('brand').addEventListener('change', function() {
        const brand = this.value;
        if (brand) {
            populateModelList(brand);
            document.getElementById('model').disabled = false;
        } else {
            document.getElementById('model').disabled = true;
            document.getElementById('year').disabled = true;
        }
    });

    // เมื่อเลือกรายการรุ่นรถ ให้เติมรายการปี
    document.getElementById('model').addEventListener('change', function() {
        const brand = document.getElementById('brand').value;
        const model = this.value;
        if (brand && model) {
            populateYearList(brand, model);
            document.getElementById('year').disabled = false;
        } else {
            document.getElementById('year').disabled = true;
        }
    });

    // เมื่อกดปุ่มสมัครสมาชิก
    document.getElementById('submitBtn').addEventListener('click', function() {
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const brand = document.getElementById('brand').value.trim();
        const model = document.getElementById('model').value.trim();
        const year = document.getElementById('year').value.trim();

        // ตรวจสอบชื่อและเบอร์โทร
        if (!name) {
            Swal.fire('กรุณากรอกชื่อผู้ใช้');
            return;
        }
        if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) {
            Swal.fire('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)');
            return;
        }
        if (!userId) {
            Swal.fire('เกิดข้อผิดพลาด: ไม่พบ userId');
            return;
        }

        // ตรวจสอบข้อมูลซ้ำ โดยดึงข้อมูลปัจจุบันจาก Google Sheets
        fetch(webhookURL)
            .then(response => response.json())
            .then(data => {
                const isDuplicate = data.some(row => {
                    return row.userId === userId ||
                        (row.phone === phone && row.brand === brand && row.model === model && row.year === year);
                });

                if (isDuplicate) {
                    Swal.fire('มีข้อมูลซ้ำอยู่แล้ว! ติดต่อผู้ดูแลระบบ')
                        .then(() => {
                            clearForm();
                            liff.closeWindow();
                        });
                } else {
                    // ส่งข้อมูลใหม่ไป Google Sheets
                    const params = new URLSearchParams({ userId, name, phone, brand, model, year });
                    fetch(`${webhookURL}?${params}`, { method: 'GET' })
                        .then(() => {
                            Swal.fire('สมัครสมาชิกสำเร็จ!');
                            clearForm();
                            liff.closeWindow();
                        })
                        .catch(err => {
                            console.error('Error sending data:', err);
                            Swal.fire('เกิดข้อผิดพลาดในการส่งข้อมูล');
                        });
                }
            })
            .catch(err => {
                console.error('Error fetching data:', err);
                Swal.fire('เกิดข้อผิดพลาดในการตรวจสอบข้อมูลซ้ำ');
            });
    });
});
