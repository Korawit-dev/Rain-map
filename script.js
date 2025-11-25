const VAR_MAP = {
    101: "temperature_2m",
    102: "relativehumidity_2m",
    103: "dewpoint_2m",
    104: "apparent_temperature",
    105: "precipitation_probability",
    106: "precipitation",
    107: "rain",
    108: "showers",
    109: "snowfall",
    110: "snow_depth",
    111: "weathercode",
    112: "surface_pressure",
    113: "cloudcover",
    114: "cloudcover_low",
    115: "cloudcover_mid",
    116: "cloudcover_high",
    117: "visibility",
    118: "windspeed_10m",
    119: "windspeed_80m",
    120: "windspeed_120m",
    121: "windspeed_180m",
    122: "winddirection_10m",
    123: "winddirection_80m",
    124: "winddirection_120m",
    125: "winddirection_180m",
    126: "windgusts_10m",
    127: "temperature_80m",
    128: "temperature_120m",
    129: "temperature_180m",
};
const weatherDB = {
    time: [],
    data: {},
    todayIndex: 0
};
async function fetchData() {
    console.log("--- 1. เริ่มดึงข้อมูล (V2 Lightweight) ---");
    const params = {
        latitude: 13.7563,
        longitude: 100.5018,
        timezone: "Asia/Bangkok",
        current_weather: true,
        past_days: 7,
        hourly: Object.values(VAR_MAP).join(","),
    };
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    try {
        const response = await fetch(url);
        const apiData = await response.json();
        console.log("--- 2. ดึงข้อมูลดิบสำเร็จ ---");
        weatherDB.time = apiData.hourly.time;
        const currentTime = apiData.current_weather.time;
        const currentIndex = weatherDB.time.indexOf(currentTime);
        const currentHour = new Date(currentTime).getHours();
        weatherDB.todayIndex = currentIndex - currentHour;
        weatherDB.data = {};
        for (const [code, apiKey] of Object.entries(VAR_MAP)) {
            if (apiData.hourly[apiKey]) {
                weatherDB.data[code] = apiData.hourly[apiKey];
            }
        }
        console.log("--- 4. สร้างฐานข้อมูล V2 สำเร็จ! ---");
        console.log(`Index ของวันนี้ (00:00น) คือ: ${weatherDB.todayIndex}`);
        runExamples();
    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
    }
}
/**
 * @param {number} code
 * @param {number} day
 * @param {number} hour
 */
function get(code, day, hour) {
    const targetIndex = weatherDB.todayIndex + (day * 24) + hour;
    const value = weatherDB.data[code]?.[targetIndex];
    return value;
}
function runExamples() {
    console.log("\n--- ⭐️ ตัวอย่างการใช้งาน V2 ⭐️ ---");
    const T2P6t15 = get(101, -6, 15);
    console.log(`get(101, -6, 15): ${T2P6t15}°C`);
    const H2F2t18 = get(102, 2, 18);
    console.log(`get(102, 2, 18): ${H2F2t18}%`);
    const PPF0t9 = get(105, 0, 9);
    console.log(`get(105, 0, 9): ${PPF0t9}%`);
    const W10P1t14 = get(118, -1, 14);
    console.log(`get(118, -1, 14): ${W10P1t14} km/h`);
    const W180F1t8 = get(121, 1, 8);
    console.log(`get(121, 1, 8): ${W180F1t8} km/h`);
}
fetchData();