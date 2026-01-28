window.onload = function () {
    switchTab('home');
    switchsupwindow(1);
}

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

// Initialize Icons
lucide.createIcons();

// === Navigation Logic ===
function switchTab(tabId) {
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show target section
    document.getElementById(tabId).classList.remove('hidden');

    // Update Nav Buttons State
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.target === tabId) {
            btn.classList.add('active');
            btn.classList.remove('text-slate-300', 'hover:bg-white/5');
        } else {
            btn.classList.remove('active');
            btn.classList.add('text-slate-300', 'hover:bg-white/5');
        }
    });

    // Close mobile menu if open
    document.getElementById('mobile-menu').classList.add('hidden');

    // If home, we might want to ensure scroll to top
    window.scrollTo(0, 0);

    // If switching to dashboard, load data if empty
    if (tabId === 'dashboard') {
        const results = document.getElementById('weather-results');
        if (results.innerHTML.trim() === '') {
            fetchWeatherData();
        }
    }
}

function switchsupwindow(index) {
    if (index == 0) {
        document.querySelectorAll('.hardware-item').forEach(section => {
            section.classList.add('hidden');
        });
        document.querySelectorAll('.sofeware-item').forEach(section => {
            section.classList.remove('hidden');
        });
        console.log(index," = 0");
        return;
    } else if (index == 1) {
        document.querySelectorAll('.hardware-item').forEach(section => {
            section.classList.remove('hidden');
        });
        document.querySelectorAll('.sofeware-item').forEach(section => {
            section.classList.add('hidden');
        });
        console.log(index," = 1");
        return;
    } else if (index == 2) {
        document.querySelectorAll('.open-meteo ').forEach(section => {
            section.classList.add('hidden');
        });
        document.querySelectorAll('.device').forEach(section => {
            section.classList.remove('hidden');
        });
        console.log(index," = 2");
        return;
    } else {
        document.querySelectorAll('.open-meteo ').forEach(section => {
            section.classList.remove('hidden');
        });
        document.querySelectorAll('.device').forEach(section => {
            section.classList.add('hidden');
        });
        console.log(index," = 3");
        return;
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// === Weather Dashboard Logic ===
async function fetchWeatherData() {
    const input = document.getElementById('coords-input').value;
    const lines = input.split('\n').filter(line => line.trim() !== '');
    const resultsContainer = document.getElementById('weather-results');
    const loadingState = document.getElementById('loading-state');
    const fetchBtn = document.getElementById('fetch-btn');

    // UI State: Loading
    loadingState.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    fetchBtn.disabled = true;
    fetchBtn.querySelector('span').textContent = 'กำลังดึงข้อมูล...';

    try {
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length < 2) continue;

            const latStr = parts[0].trim();
            const lonStr = parts[1].trim();
            const city = parts[2] ? parts[2].trim() : `${latStr}, ${lonStr}`;

            const lat = parseFloat(latStr);
            const lon = parseFloat(lonStr);

            if (isNaN(lat) || isNaN(lon)) continue;

            // Fetch from Open-Meteo
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain,surface_pressure,wind_speed_10m`
            );
            const data = await response.json();

            if (data.current) {
                const isRaining = data.current.rain > 0;
                const iconType = isRaining ? 'cloud-rain' : 'wind';

                // Color logic for icon background
                const iconBgClass = isRaining
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-orange-500/20 text-orange-400';

                // Create Card HTML (Updated for Glassmorphism)
                const cardHTML = `
                            <div class="glass-card rounded-2xl p-6 relative overflow-hidden group animate-fade-in-up">
                                <div class="absolute -right-6 -top-6 w-24 h-24 rounded-full ${isRaining ? 'bg-blue-500/10' : 'bg-orange-500/10'} blur-2xl group-hover:blur-3xl transition-all"></div>
                                
                                <div class="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <h3 class="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                                            <i data-lucide="map-pin" class="w-4 h-4 text-slate-500"></i> ${city}
                                        </h3>
                                        <p class="text-xs text-slate-400 font-mono mt-1 ml-6">${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
                                    </div>
                                    <div class="p-3 rounded-xl ${iconBgClass} backdrop-blur-sm border border-white/5 shadow-lg">
                                        <i data-lucide="${iconType}" class="w-6 h-6"></i>
                                    </div>
                                </div>
                                
                                <div class="flex items-end space-x-3 mb-8 relative z-10">
                                    <span class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">${await w(0, 0, lat, lon)}°</span>
                                    <span class="text-sm text-slate-400 mb-2 font-medium">Celsius</span>
                                </div>

                                <div class="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 relative z-10">
                                    <div class="text-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <div class="flex justify-center text-blue-400 mb-2"><i data-lucide="droplets" class="w-5 h-5"></i></div>
                                        <p class="text-[10px] text-slate-400 uppercase tracking-wider">Humidity</p>
                                        <p class="font-bold text-slate-200">${await w(1, 0, lat, lon)}%</p>
                                    </div>
                                    <div class="text-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <div class="flex justify-center text-cyan-400 mb-2"><i data-lucide="cloud-rain" class="w-5 h-5"></i></div>
                                        <p class="text-[10px] text-slate-400 uppercase tracking-wider">Rain</p>
                                        <p class="font-bold text-slate-200">${await w(18, 0, lat, lon)} mm</p>
                                    </div>
                                    <div class="text-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <div class="flex justify-center text-purple-400 mb-2"><i data-lucide="gauge" class="w-5 h-5"></i></div>
                                        <p class="text-[10px] text-slate-400 uppercase tracking-wider">Pressure</p>
                                        <p class="font-bold text-slate-200">${await w(5, 0, lat, lon)}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                resultsContainer.insertAdjacentHTML('beforeend', cardHTML);
            }
        }
    } catch (error) {
        console.error("Error fetching weather:", error);
        resultsContainer.innerHTML = `
            <div class="col-span-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-center">
                <i data-lucide="alert-circle" class="w-6 h-6 mx-auto mb-2 text-red-400"></i>
                เกิดข้อผิดพลาดในการดึงข้อมูล โปรดลองใหม่อีกครั้ง
            </div>`;
    } finally {
        // UI State: Finished
        loadingState.classList.add('hidden');
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = '<i data-lucide="search" class="mr-2 w-5 h-5"></i><span>ดึงข้อมูลสภาพอากาศ</span>';

        // Re-initialize icons for newly added elements
        lucide.createIcons();
    }
}