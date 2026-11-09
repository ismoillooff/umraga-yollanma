<div align="center">

# Umraga yo‘llanma

**Umra safarlarini tanlash, maslahat uchun ariza yuborish va ularni boshqarish platformasi**

Ziyorat dasturi · 3–5 yulduzli paketlar · Namoz vaqtlari · Admin panel

![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Vite 7](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-339933?logo=nodedotjs&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-maʼlumotlar-003b57?logo=sqlite&logoColor=white)
![O‘zbekcha](https://img.shields.io/badge/til-o%CA%BBzbekcha-15803d)

</div>

## Loyiha haqida

**Umraga yo‘llanma** — Umra agentligi uchun o‘zbek tilidagi landing va boshqaruv paneli. Tashrif buyuruvchi paketlarni solishtiradi, Makka va Madinadagi ziyorat dasturi bilan tanishadi va maslahat uchun ariza qoldiradi. Ariza SQLite bazasiga yoziladi va admin panelda ko‘rinadi.

Paket narxlari, mehmonxona misollari va aloqa ma’lumotlari demo kontent. Amaldagi takliflarni admin panel orqali kiriting. To‘lov bo‘limi agentlik bilan kelishiladigan usullar haqida ma’lumot beradi.

## Mundarija

- [Imkoniyatlar](#imkoniyatlar)
- [Ishga tushirish](#ishga-tushirish)
- [Admin panel](#admin-panel)
- [Texnologiyalar va tuzilma](#texnologiyalar-va-tuzilma)
- [API](#api)
- [Konfiguratsiya va ma’lumotlar](#konfiguratsiya-va-malumotlar)

## Imkoniyatlar

| Yo‘nalish | Nimalar qilish mumkin |
| --- | --- |
| Paketlar va mehmonxonalar | Standart, Komfort va Premium paketlarni filtrlash, xona va xizmatlarni solishtirish |
| Ziyorat dasturi | Manzillar, safar bosqichlari va savol-javoblarni ko‘rish, safar dasturini matnli fayl qilib yuklab olish |
| Arizalar | Tanlangan paket bilan ariza yoki umumiy maslahat xabarini yuborish |
| Namoz va ob-havo | Toshkent, Makka va Madina uchun namoz jadvali va joriy ob-havo |
| Aloqa | Telefon, email, Telegram va Instagram manzillarini saytdan ochish |
| Boshqaruv | Arizalarni filtrlash, holat va izohni yangilash, CSV eksport qilish, kontent va rasmlarni tahrirlash |

## Ishga tushirish

**Talablar:** Git, Node.js **24+** va npm. Loyiha Node.js tarkibidagi SQLite modulidan foydalanadi.

```sh
git clone https://github.com/ismoillooff/umraga-yollanma.git
cd umraga-yollanma
npm ci
npm run dev -- --port 5180 --strictPort
```

| Manzil | Vazifasi |
| --- | --- |
| [127.0.0.1:5180](http://127.0.0.1:5180/) | Landing sahifa |
| [127.0.0.1:5180/admin](http://127.0.0.1:5180/admin) | Boshqaruv paneli |
| [127.0.0.1:5182/api/health](http://127.0.0.1:5182/api/health) | API ishlayotganini tekshirish |

Tayyor build va API’ni bitta portdan ishga tushirish uchun dev jarayonini to‘xtatib, quyidagilarni bajaring.

```sh
npm run build
npm start
```

Bu rejimda sayt [5182-portda](http://127.0.0.1:5182/) ishlaydi, boshqaruv paneli esa [`/admin`](http://127.0.0.1:5182/admin) manzilida ochiladi.

## Admin panel

1. Lokal `/admin` sahifasini oching. Birinchi kirishda 3–40 belgili login va kamida 12 belgili parol yarating.
2. **Sayt sozlamalari** bo‘limidan brend, telefon, email, Telegram, Instagram, ofis va to‘lov ma’lumotlarini yangilang.
3. Paket narxlari, mehmonxona tafsilotlari va savol-javoblarni tegishli bo‘limlarda tahrirlang. Rasm yuklash JPG, PNG va WebP formatlarini 5 MB gacha qabul qiladi.
4. Saytdan yuborilgan arizalarni panelda ko‘ring, holati va izohini yangilang yoki CSV faylga eksport qiling.

## Texnologiyalar va tuzilma

| Qatlam | Texnologiya |
| --- | --- |
| Interfeys | React 19, TypeScript 5.9, oddiy CSS, Framer Motion va Lucide React |
| Build | Vite 7 |
| API va ma’lumotlar | Node.js 24, HTTP server va `node:sqlite` |
| Test | Node.js test runner va Playwright |

```text
.
├── public/        Favicon, lokal shriftlar va rasmlar
├── scripts/       Vite va API’ni birga ishga tushirish
├── server/        API, validatsiya, SQLite va tashqi ma’lumotlar
├── shared/        Yangi bazaga yoziladigan boshlang‘ich kontent
├── src/           Landing, admin panel va umumiy UI
└── tests/         Mobil va desktop brauzer testlari
```

Ishlab chiqish rejimida Vite `/api` so‘rovlarini mahalliy Node.js serveriga uzatadi. Tayyor build rejimida Node.js bitta manzildan React sahifalarini ham, API’ni ham xizmat qiladi.

## API

| Usul va manzil | Vazifa |
| --- | --- |
| `GET /api/health` | Server holatini tekshirish |
| `GET /api/config` | Landing uchun kontent va sozlama reviziyasi |
| `GET /api/travel?city=tashkent` | Namoz va ob-havo. Shahar qiymatlari `tashkent`, `makkah`, `madinah` |
| `POST /api/leads` | Paket yoki maslahat arizasini yuborish |
| `GET /api/session` | Kirish va dastlabki sozlash holati |
| `POST /api/setup`, `/api/login`, `/api/logout` | Admin hisobini yaratish, kirish va chiqish |
| `GET /api/admin/state` | Admin sozlamalari, arizalar va faoliyat |
| `PUT /api/admin/config` | Sozlamalarni reviziya nazorati bilan yozish |
| `PATCH /api/admin/leads/:id` | Ariza holati va izohini yangilash |
| `POST /api/admin/upload`, `PUT /api/admin/password` | Rasm yuklash va parolni yangilash |

`/api/admin/*` so‘rovlari admin sessiyasini talab qiladi. Server yozish so‘rovlarining `Origin` sarlavhasini tekshiradi. Parollar scrypt bilan xeshlanadi. Seans cookie’si HttpOnly va SameSite=Strict.

## Konfiguratsiya va ma’lumotlar

`.env` fayli ixtiyoriy. Uni loyiha ildizida yarating yoki o‘zgaruvchilarni server jarayoniga uzating.

| O‘zgaruvchi | Standart | Vazifasi |
| --- | --- | --- |
| `UMRA_API_PORT` | `5182` | API porti |
| `UMRA_DB_PATH` | `.local/safar.sqlite3` | SQLite fayli. Yuklangan rasmlar uning yonidagi `uploads/` katalogida saqlanadi |
| `UMRA_ADMIN_USERNAME` | `admin` | Muhit orqali dastlabki admin yaratishda ishlatiladigan login |
| `UMRA_ADMIN_PASSWORD` | Bo‘sh | Birinchi ishga tushirishda admin yaratish uchun kamida 12 belgili parol |
| `UMRA_SECURE_COOKIES` | Bo‘sh | HTTPS orqali ishlaganda `1` qiymatini qo‘ying |
| `UMRA_WEATHER_API_KEY` | Bo‘sh | Open-Meteo mijoz endpointi uchun kalit |

`shared/default-config.json` yangi baza yaratilganda qo‘llanadi. Mavjud saytdagi paketlar, narx va aloqa ma’lumotlarini admin paneldan o‘zgartiring. Zaxira olayotganda SQLite bazasi va `uploads/` katalogini birga saqlang.

Server `127.0.0.1` manziliga bog‘lanadi. Tashqi serverda xizmatni ochishdan oldin admin hisobini lokal tarzda yarating. HTTPS reverse proxy ishlatsangiz, tashqi `Host` sarlavhasini saqlang va `UMRA_SECURE_COOKIES=1` ni belgilang.
