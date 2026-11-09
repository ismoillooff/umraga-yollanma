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
