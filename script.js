// ========================================
// Firebase Configuration & Initialization
// ========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCG7L8UH0UkhstpXc-rkmYAIxFQD4LplTQ",
    authDomain: "project-rain-powerby-community.firebaseapp.com",
    databaseURL: "https://project-rain-powerby-community-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "project-rain-powerby-community",
    storageBucket: "project-rain-powerby-community.firebasestorage.app",
    messagingSenderId: "360701221438",
    appId: "1:360701221438:web:00737f642e34ce2aedcf6f",
    measurementId: "G-PJPQYVLGL7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ========================================
// Global Function Exports
// ========================================
window.switchTab = switchTab;
window.switchsupwindow = switchsupwindow;
window.fetchWeatherData = fetchWeatherData;

// ========================================
// Application Initialization
// ========================================
window.onload = function () {
    switchTab('home');
    switchsupwindow(1);
    listenToFirebaseData();
    lucide.createIcons();
}

// ========================================
// Firebase Data Management
// ========================================

/**
 * ฟังก์ชันเชื่อมต่อและติดตามข้อมูลจาก Firebase แบบ Real-time
 * เมื่อข้อมูลมีการเปลี่ยนแปลงใน Firebase จะอัปเดต UI อัตโนมัติ
 * 
 * โครงสร้างข้อมูล: Communities > Users > Devices
 */
function listenToFirebaseData() {
    const dataRef = ref(db, 'communities');
    const container = document.getElementById('device-results-container');

    onValue(dataRef, (snapshot) => {
        const communities = snapshot.val();
        
        // ล้างข้อมูลเก่า
        if (container) container.innerHTML = '';

        if (communities) {
            let deviceCount = 0;
            
            // วนลูปชั้นที่ 1: Communities
            Object.entries(communities).forEach(([communityId, communityData]) => {
                
                // ตรวจสอบว่ามี users หรือไม่
                if (!communityData.users) return;
                
                // วนลูปชั้นที่ 2: Users
                Object.entries(communityData.users).forEach(([userId, userData]) => {
                    
                    // ตรวจสอบว่ามี devices หรือไม่
                    if (!userData.devices) return;
                    
                    // วนลูปชั้นที่ 3: Devices
                    Object.entries(userData.devices).forEach(([deviceId, deviceData]) => {
                        const cardData = formatFirebaseData(
                            deviceId, 
                            deviceData, 
                            communityId, 
                            userId
                        );
                        createWeatherCard(cardData, 'device-results-container');
                        deviceCount++;
                    });
                });
            });
            
            // แสดงข้อความถ้าไม่พบอุปกรณ์
            if (deviceCount === 0 && container) {
                container.innerHTML = '<p class="col-span-full text-center text-slate-500 py-10">ไม่พบอุปกรณ์ที่เชื่อมต่อในขณะนี้</p>';
            }
        } else {
            if (container) {
                container.innerHTML = '<p class="col-span-full text-center text-slate-500 py-10">ไม่พบข้อมูล Community</p>';
            }
        }
    });
}

/**
 * แปลงข้อมูลจาก Firebase ให้เป็นรูปแบบมาตรฐานสำหรับสร้าง Card
 * @param {string} deviceId - รหัสอุปกรณ์
 * @param {Object} data - ข้อมูลจาก Firebase
 * @param {string} communityId - รหัส Community
 * @param {string} userId - รหัส User
 * @returns {Object} ข้อมูลที่จัดรูปแบบแล้ว
 */
function formatFirebaseData(deviceId, data, communityId, userId) {
    // ตรวจสอบสถานะฝน (rain เป็น boolean, ถ้าไม่มีข้อมูลถือว่าไม่ฝน)
    const isRaining = data.rain === true;
    
    // ใช้ชื่อจาก name field ถ้ามี, ไม่งั้นใช้ deviceId
    const deviceName = data.name || deviceId;
    
    return {
        id: deviceId,
        title: deviceName,
        subtitle: `${communityId} • ${userId}`,
        temperature: data.temp !== undefined && data.temp !== null ? data.temp : '--',
        humidity: data.hum !== undefined && data.hum !== null ? data.hum : '--',
        rain: data.rain !== undefined ? (isRaining ? 'Raining' : 'Dry') : '--',
        rainValue: isRaining ? 1 : 0,
        pressure: data.press !== undefined && data.press !== null ? data.press : null,
        latitude: data.lat !== undefined && data.lat !== null ? data.lat : null,
        longitude: data.lon !== undefined && data.lon !== null ? data.lon : null,
        lastUpdate: data.lastUpdate || null,
        isRaining: isRaining,
        isOnline: true,
        source: 'firebase',
        communityId: communityId,
        userId: userId
    };
}

// ========================================
// Open-Meteo Weather API
// ========================================

// รายการพารามิเตอร์ทั้งหมดที่ Open-Meteo รองรับ
const WEATHER_PARAMETERS = [
    "temperature_2m", "relative_humidity_2m", "dewpoint_2m", "apparent_temperature", "pressure_msl", "surface_pressure", // 0-5
    "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high", // 6-9
    "wind_speed_10m", "wind_speed_80m", "wind_speed_120m", "wind_speed_180m", // 10-13
    "wind_direction_10m", "wind_direction_80m", "wind_gusts_10m", // 14-16
    "precipitation", "rain", "snowfall", "precipitation_probability", "weather_code", // 17-21
    "shortwave_radiation", "direct_radiation", "diffuse_radiation", "direct_normal_irradiance", "uv_index", "sunshine_duration", // 22-27
    "soil_temperature_0cm", "soil_temperature_6cm", "soil_temperature_18cm", "soil_temperature_54cm", // 28-31
    "soil_moisture_0_to_1cm", "soil_moisture_1_to_3cm", "soil_moisture_3_to_9cm", "soil_moisture_9_to_27cm", "soil_moisture_27_to_81cm", // 32-36
    "freezing_level_height", "boundary_layer_height", "et0_fao_evapotranspiration", "vapour_pressure_deficit", // 37-40
    "temperature_1000hPa", "temperature_850hPa", "temperature_500hPa", // 41-43
    "relative_humidity_1000hPa", "relative_humidity_850hPa", "relative_humidity_500hPa", // 44-46
    "geopotential_height_1000hPa", "geopotential_height_850hPa", "geopotential_height_500hPa", // 47-49
    "visibility", "cape", "lifted_index", "showalter_index", "k_index", "total_totals_index", "kelly_index" // 50-56
];

/**
 * ฟังก์ชันดึงข้อมูลสภาพอากาศจาก Open-Meteo API
 * @param {number} paramId - ID ของพารามิเตอร์ (0-56)
 * @param {number} hourOffset - เวลา offset (-12 ถึง +12 ชม.)
 * @param {number} lat - ละติจูด
 * @param {number} lon - ลองจิจูด
 * @returns {Promise<number>} ค่าที่ดึงมาจาก API
 */
async function w(paramId, hourOffset, lat, lon) {
    const param = WEATHER_PARAMETERS[paramId];
    
    if (!param) {
        console.error("❌ Invalid Parameter ID:", paramId);
        return null;
    }

    // สร้าง URL สำหรับ API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${param}&past_days=1&forecast_days=2&timezone=GMT`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // คำนวณเวลาเป้าหมาย (UTC/GMT)
        const targetTime = new Date(Date.now() + hourOffset * 3600000);
        const timeString = targetTime.toISOString().slice(0, 13) + ":00";

        // ค้นหา index และดึงค่า
        const index = data.hourly.time.indexOf(timeString);
        const value = data.hourly[param][index];
        const unit = data.hourly_units[param];

        // แสดงผลใน Console
        console.group(`🌍 Weather Data [ID:${paramId}]`);
        console.log(`📍 Coord : ${lat}, ${lon}`);
        console.log(`🕒 Time  : ${timeString} (GMT) [Offset ${hourOffset}h]`);
        console.log(`🏷️ Type  : ${param}`);
        console.log(`📊 Value : %c${value} ${unit}`, "color: #4ade80; font-weight: bold; font-size: 1.2em;");
        console.groupEnd();

        return value;
    } catch (error) {
        console.error("❌ Error fetching weather data:", error);
        return null;
    }
}

/**
 * ฟังก์ชันหลักสำหรับดึงข้อมูลสภาพอากาศจากหลายพิกัด
 * อ่านพิกัดจาก textarea และแสดงผลใน weather-results container
 */
async function fetchWeatherData() {
    const input = document.getElementById('coords-input').value;
    const lines = input.split('\n').filter(line => line.trim() !== '');
    const resultsContainer = document.getElementById('weather-results');
    const loadingState = document.getElementById('loading-state');
    const fetchBtn = document.getElementById('fetch-btn');

    // แสดง Loading State
    loadingState.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    fetchBtn.disabled = true;
    fetchBtn.querySelector('span').textContent = 'กำลังดึงข้อมูล...';

    try {
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length < 2) continue;

            const lat = parseFloat(parts[0].trim());
            const lon = parseFloat(parts[1].trim());
            const cityName = parts[2] ? parts[2].trim() : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

            if (isNaN(lat) || isNaN(lon)) continue;

            // ดึงข้อมูลจาก Open-Meteo
            const temperature = await w(0, 0, lat, lon);  // temperature_2m
            const humidity = await w(1, 0, lat, lon);      // relative_humidity_2m
            const precipitation = await w(18, 0, lat, lon); // precipitation
            const pressure = await w(5, 0, lat, lon);      // surface_pressure

            // จัดรูปแบบข้อมูล
            const cardData = {
                id: `${lat},${lon}`,
                title: cityName,
                subtitle: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                temperature: temperature,
                humidity: humidity,
                rain: `${precipitation} mm`,
                rainValue: precipitation,
                pressure: pressure,
                isRaining: precipitation > 0,
                isOnline: true,
                source: 'open-meteo'
            };

            // สร้าง Card
            createWeatherCard(cardData, 'weather-results');
        }
    } catch (error) {
        console.error("❌ Error fetching weather:", error);
        resultsContainer.innerHTML = `
            <div class="col-span-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-center">
                <i data-lucide="alert-circle" class="w-6 h-6 mx-auto mb-2 text-red-400"></i>
                เกิดข้อผิดพลาดในการดึงข้อมูล โปรดลองใหม่อีกครั้ง
            </div>`;
    } finally {
        // ซ่อน Loading State
        loadingState.classList.add('hidden');
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = '<i data-lucide="search" class="mr-2 w-5 h-5"></i><span>ดึงข้อมูลสภาพอากาศ</span>';
        lucide.createIcons();
    }
}

// ========================================
// UI Card Creation (Universal)
// ========================================

/**
 * ฟังก์ชันสร้าง Weather Card แบบ Universal
 * รองรับทั้งข้อมูลจาก Firebase และ Open-Meteo API
 * 
 * @param {Object} data - ข้อมูลที่จัดรูปแบบแล้ว
 * @param {string} data.id - ID หรือชื่ออุปกรณ์
 * @param {string} data.title - ชื่อหลัก (ชื่อเมือง/อุปกรณ์)
 * @param {string} data.subtitle - ชื่อรอง (พิกัด/ประเภท)
 * @param {number} data.temperature - อุณหภูมิ
 * @param {number} data.humidity - ความชื้น
 * @param {string} data.rain - สถานะฝน
 * @param {number} data.rainValue - ค่าฝน (สำหรับตรวจสอบ)
 * @param {number} data.pressure - ความกดอากาศ (optional)
 * @param {number} data.latitude - ละติจูด (optional)
 * @param {number} data.longitude - ลองจิจูด (optional)
 * @param {boolean} data.isRaining - กำลังฝนตกหรือไม่
 * @param {boolean} data.isOnline - สถานะออนไลน์
 * @param {string} data.source - แหล่งข้อมูล ('firebase' หรือ 'open-meteo')
 * @param {string} containerId - ID ของ container ที่จะแสดง card
 */
function createWeatherCard(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // กำหนดสีและไอคอนตามสถานะฝน
    const iconType = data.isRaining ? 'cloud-rain' : 'wind';
    const iconBgClass = data.isRaining
        ? 'bg-blue-500/20 text-blue-400'
        : 'bg-orange-500/20 text-orange-400';
    const glowColor = data.isRaining ? 'bg-blue-500/10' : 'bg-orange-500/10';

    // ตรวจสอบว่ามีพิกัดหรือไม่
    const hasCoordinates = data.latitude !== null && data.longitude !== null && 
                          data.latitude !== undefined && data.longitude !== undefined;
    
    // ตรวจสอบว่ามีข้อมูล pressure หรือไม่
    const hasPressure = data.pressure !== null && data.pressure !== undefined;

    // สร้าง HTML สำหรับ Card
    const cardHTML = `
        <div class="glass-card rounded-2xl p-6 relative overflow-hidden group animate-fade-in-up">
            <!-- Background Glow Effect -->
            <div class="absolute -right-6 -top-6 w-24 h-24 rounded-full ${glowColor} blur-2xl group-hover:blur-3xl transition-all"></div>
            
            <!-- Header -->
            <div class="flex justify-between items-start mb-4 relative z-10">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                        <i data-lucide="${data.source === 'firebase' ? 'cpu' : 'map-pin'}" class="w-4 h-4 text-cyan-400"></i> 
                        ${data.title}
                    </h3>
                    ${data.source === 'firebase' ? `
                        <p class="text-xs text-slate-400 mt-1 ml-6">${data.subtitle}</p>
                    ` : `
                        <p class="text-xs text-slate-400 font-mono mt-1 ml-6">${data.subtitle}</p>
                    `}
                </div>
                <div class="flex items-center gap-2">
                    ${data.isOnline ? `
                        <span class="flex h-2 w-2">
                            <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                    ` : ''}
                    <div class="p-3 rounded-xl ${iconBgClass} backdrop-blur-sm border border-white/5 shadow-lg">
                        <i data-lucide="${iconType}" class="w-6 h-6"></i>
                    </div>
                </div>
            </div>
            
            <!-- Temperature Display -->
            <div class="flex items-end space-x-3 mb-6 relative z-10">
                <span class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                    ${data.temperature}°
                </span>
                <span class="text-sm text-slate-400 mb-2 font-medium">Celsius</span>
            </div>

            <!-- Weather Details Grid -->
            <div class="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 relative z-10">
                <!-- Humidity -->
                <div class="text-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div class="flex justify-center text-blue-400 mb-2">
                        <i data-lucide="droplets" class="w-5 h-5"></i>
                    </div>
                    <p class="text-[10px] text-slate-400 uppercase tracking-wider">Humidity</p>
                    <p class="font-bold text-slate-200">${data.humidity !== '--' ? data.humidity + '%' : '--'}</p>
                </div>
                
                <!-- Rain Status -->
                <div class="text-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div class="flex justify-center text-cyan-400 mb-2">
                        <i data-lucide="cloud-rain" class="w-5 h-5"></i>
                    </div>
                    <p class="text-[10px] text-slate-400 uppercase tracking-wider">Rain</p>
                    <p class="font-bold ${data.rain === 'Raining' ? 'text-blue-400' : 'text-slate-200'}">${data.rain}</p>
                </div>
                
                <!-- Pressure -->
                <div class="text-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div class="flex justify-center text-purple-400 mb-2">
                        <i data-lucide="gauge" class="w-5 h-5"></i>
                    </div>
                    <p class="text-[10px] text-slate-400 uppercase tracking-wider">Pressure</p>
                    <p class="font-bold text-slate-200">${hasPressure ? data.pressure + ' hPa' : '--'}</p>
                </div>
            </div>

            <!-- Coordinates (แสดงเฉพาะเมื่อมีข้อมูล) -->
            ${hasCoordinates ? `
                <div class="mt-4 pt-4 border-t border-white/10 relative z-10">
                    <div class="flex items-center justify-center gap-2 text-xs text-slate-400 font-mono">
                        <i data-lucide="map-pin" class="w-3 h-3"></i>
                        <span>${parseFloat(data.latitude).toFixed(4)}, ${parseFloat(data.longitude).toFixed(4)}</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // แทรก Card เข้าไปใน Container
    container.insertAdjacentHTML('beforeend', cardHTML);
    
    // อัปเดตไอคอน Lucide
    lucide.createIcons();
}

// ========================================
// Navigation & UI Controls
// ========================================

/**
 * ฟังก์ชันสลับ Tab หลัก (Home, Dashboard, About)
 * @param {string} tabId - ID ของ tab ที่ต้องการแสดง
 */
function switchTab(tabId) {
    // ซ่อน section ทั้งหมด
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });

    // แสดง section ที่เลือก
    document.getElementById(tabId).classList.remove('hidden');

    // อัปเดตสถานะปุ่ม Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.target === tabId) {
            btn.classList.add('active');
            btn.classList.remove('text-slate-300', 'hover:bg-white/5');
        } else {
            btn.classList.remove('active');
            btn.classList.add('text-slate-300', 'hover:bg-white/5');
        }
    });

    // ปิด Mobile Menu
    document.getElementById('mobile-menu')?.classList.add('hidden');

    // Scroll to top
    window.scrollTo(0, 0);

    // โหลดข้อมูลเมื่อเปิด Dashboard (ถ้ายังไม่มีข้อมูล)
    if (tabId === 'dashboard') {
        const results = document.getElementById('weather-results');
        if (results && results.innerHTML.trim() === '') {
            fetchWeatherData();
        }
    }
}

/**
 * ฟังก์ชันสลับ Sub-window ใน Dashboard
 * @param {number} index - หมายเลข window (0=Software, 1=Hardware, 2=Device, 3=Open-Meteo)
 */
function switchsupwindow(index) {
    switch(index) {
        case 0: // Software
            document.querySelectorAll('.hardware-item').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.sofeware-item').forEach(el => el.classList.remove('hidden'));
            break;
            
        case 1: // Hardware
            document.querySelectorAll('.hardware-item').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('.sofeware-item').forEach(el => el.classList.add('hidden'));
            break;
            
        case 2: // Device Database
            document.querySelectorAll('.open-meteo').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.device').forEach(el => el.classList.remove('hidden'));
            break;
            
        case 3: // Open-Meteo
            document.querySelectorAll('.open-meteo').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('.device').forEach(el => el.classList.add('hidden'));
            break;
    }
    
    console.log(`Switched to window: ${index}`);
}

/**
 * เปิด/ปิด Mobile Menu
 */
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu?.classList.toggle('hidden');
}