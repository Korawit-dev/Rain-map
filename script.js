//***************************************************************************************************************************************************************** */
const P = [
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
 * ฟังก์ชันหลัก: w(id, h, lat, lon)
 * @param {number} i - ID ของข้อมูล (0-56)
 * @param {number} h - เวลา offset (-12 ถึง +12 ชม.)
 * @param {number} lat - ละติจูด
 * @param {number} lon - ลองจิจูด
 */
async function w(i, h, lat, lon) {
    if (!P[i]) return console.error("❌ Invalid ID");

    // 1. สร้าง URL (ใช้ timezone=GMT เพื่อความแม่นยำในการเทียบเวลา)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${P[i]}&past_days=1&forecast_days=2&timezone=GMT`;

    try {
        const d = await (await fetch(url)).json();

        // 2. คำนวณเวลาเป้าหมาย (UTC/GMT)
        const t = new Date(Date.now() + h * 3600000);
        const tStr = t.toISOString().slice(0, 13) + ":00"; // แปลงเป็น "YYYY-MM-DDTHH:00"

        // 3. ดึงค่า
        const idx = d.hourly.time.indexOf(tStr);
        const val = d.hourly[P[i]][idx];
        const unit = d.hourly_units[P[i]];

        // 4. แสดงผล Console
        console.group(`🌍 Weather Data [ID:${i}]`);
        console.log(`📍 Coord : ${lat}, ${lon}`);
        console.log(`🕒 Time  : ${tStr} (GMT) [Offset ${h}h]`);
        console.log(`🏷️ Type  : ${P[i]}`);
        console.log(`📊 Value : %c${val} ${unit}`, "color: #4ade80; font-weight: bold; font-size: 1.2em;");
        console.groupEnd();

        return val; // คืนค่าเผื่อเอาไปใช้ต่อ
    } catch (e) { console.error("Error:", e); }
}

//************************************************************************************************** */

let time = 0;

// --- 1. เริ่มต้นแผนที่ (Map Initialization) ---
const map = L.map('map', {
    zoomControl: false // ซ่อนปุ่ม Zoom เดิมเพื่อความสวยงาม (ถ้าต้องการให้ลบออก)
}).setView([13.7563, 100.5018], 10); // กรุงเทพฯ

// เพิ่ม Layer แผนที่จาก OpenStreetMap
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// ย้ายปุ่ม Zoom ไปขวาบน (เพื่อให้ไม่บัง UI ซ้ายบน)
L.control.zoom({ position: 'topright' }).addTo(map);

// --- 2. จัดการพิกัดเมาส์ (Mouse Coordinates) ---
map.on('mousemove', function (e) {
    const lat = e.latlng.lat.toFixed(4);
    const lng = e.latlng.lng.toFixed(4);
    document.getElementById('mouse-coords').innerText = `Lat: ${lat}, Lng: ${lng}`;
});

// --- 3. ระบบค้นหาและอัปเดตข้อมูล (Search & Weather Logic) ---
async function searchLocation() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    const btn = document.querySelector('button');
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const displayName = data[0].display_name.split(',')[0];

            map.setView([lat, lon], 12);

            L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>${displayName}</b>`)
                .openPopup();

            updateWeatherUI(displayName, lat, lon, time);
        } else {
            alert('ไม่พบสถานที่ที่ค้นหา');
        }
    } catch (error) {
        console.error('Error searching:', error);
        alert('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
        btn.innerHTML = originalIcon;
    }
}

document.getElementById('search-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        searchLocation();
    }
});

async function updateWeatherUI(locationName, lat, lon, time) {
    // แสดงสถานะกำลังโหลด (Optional)
    document.getElementById('city-name').innerText = "กำลังโหลด...";

    try {
        const temperature_2m = await w(0, time, lat, lon);
        const relative_humidity_2m = await w(1, time, lat, lon);
        const wind_speed_10m = await w(10, time, lat, lon);
        const wind_direction_10m = await w(14, time, lat, lon);
        const cloud_cover = await w(6, time, lat, lon);
        const rain = await w(17, time, lat, lon);

        document.getElementById('city-name').innerText = locationName;
        document.getElementById('temperature').innerText = `${temperature_2m}°`;
        document.getElementById('humidity').innerText = `${relative_humidity_2m}%`;
        document.getElementById('wind').innerText = `${wind_speed_10m} km/h`;
        document.getElementById('wind_direction').innerText = `${wind_direction_10m}°`;
        document.getElementById('cloud_cover').innerText = `${cloud_cover}%`;
        document.getElementById('rain').innerText = `${rain} mm`;

        // อัปเดตวันที่
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        document.getElementById('current-date').innerText = now.toLocaleDateString('th-TH', options);
        
    } catch (error) {
        console.error("UI Update Error:", error);
    }
}

// เรียกอัปเดตครั้งแรก
updateWeatherUI('กรุงเทพมหานคร', 13.7563, 100.5018, time);

// --- 4. จัดการ Slider ด้านล่าง ---
const slider = document.getElementById('data-slider');
const sliderValue = document.getElementById('slider-value');

slider.addEventListener('input', function () {
    const val = this.value;
    sliderValue.innerText = `${val}%`;

    // พื้นที่สำหรับใส่ Logic ของคุณ
    console.log("Slider value changed to:", val);
    // ตัวอย่าง: ถ้า value > 50 ให้เปลี่ยนสี Map (สมมติ)
    // if (val > 50) { ... }
});