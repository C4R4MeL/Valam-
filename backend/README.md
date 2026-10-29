<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm ci
```

## VALAM: Prisma dan konfigurasi lokal

Integrasi main dan Supabase public terakhir: [catatan rilis 29 Oktober 2026](../docs/main-integration-2026-10-29.md).
`npm run db:audit` memverifikasi metadata menggunakan schema pembanding sementara;
`npm run db:release` menjalankan migrasi public yang telah ditinjau dalam
transaksi, memeriksa data lama tetap utuh, dan mencatat riwayat migrasi Prisma.
Startup tetap tidak memigrasi database otomatis.

Untuk demo yang berhenti dengan `DATABASE_SCHEMA_MISMATCH` pada tabel mutu:

```bash
npm run demo:migrate:quality
npm run demo:start
```

`demo:migrate:quality` menambah/memeriksa struktur mutu dan mitra awal ARC USK
hanya pada schema `pertamuda_test`, tanpa reset data. Perintah dapat dijalankan
ulang; jumlah baris tabel lama diperiksa di dalam transaksi. `demo:prepare`
juga menjalankan langkah ini setelah persiapan schema berhasil. Startup sendiri
tetap hanya memeriksa schema dan tidak melakukan migrasi otomatis.

Mode demo sengaja menonaktifkan NILA/Grok, Midtrans, dan Biteship eksternal;
ketiadaan kunci layanan tersebut bukan penyebab kegagalan pemeriksaan schema.

Jalankan perintah dari direktori backend. npm ci memakai versi pada lockfile.
Prisma Client digenerate melalui postinstall dan sebelum start/start:dev.
Generate tidak menjalankan migrasi atau mengubah isi database.
Jika install memakai --ignore-scripts, jalankan npm run prisma:generate secara manual.

File .env lokal memerlukan JWT_SECRET acak minimal 32 karakter dan koneksi database
sesuai lingkungan. Jangan commit atau menampilkan secret saat demo.
Untuk demonstrasi terisolasi Pertamuda, gunakan npm run demo:start;
perintah start biasa tetap memakai konfigurasi .env, bukan otomatis schema pengujian.
Schema database yang dipakai harus sudah sesuai migration yang ditinjau.
Startup memeriksa keberadaan kolom menggunakan metadata read-only sebelum
provider, scheduler, dan HTTP server dimulai. DATABASE_SCHEMA_MISMATCH berarti
koneksi masih menuju schema lama; gunakan demo:start untuk schema pengujian.
Tidak ada migration otomatis atau fallback ke schema lain.

Jika model Prisma hilang atau tipe paket openai tidak ditemukan, hentikan server
backend terkait, jalankan npm ci lalu npm run prisma:generate. Paket openai sudah
menyediakan deklarasi tipe; jangan menambahkan deklarasi any atau paket @types/openai.

Panduan: [demo Pertamuda](../docs/pertamuda-demo-guide.md).

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
