# Git Workflow

Dokumen ini menjelaskan alur kerja, konvensi, dan praktik yang tim kami gunakan terkait Git. Jika kamu belum familiar dengan apa yang dilakukan Git, cara kerjanya, dan perintah-perintah dasarnya (atau kamu ingin menyegarkan kembali pengetahuan kamu), silakan lihat tautan-tautan berikut:

- [what is git](https://www.atlassian.com/git/tutorials/what-is-git) - Informasi latar belakang tentang Git, dan beberapa keuntungannya
- [git - the simple guide](http://rogerdudler.github.io/git-guide/) - Memperkenalkan _branches_ dan _pushing_
- [gittutorial](http://git-scm.com/docs/gittutorial) - Penjelasan yang sedikit lebih detail terkait Git
- [Interactive git](https://pcottle.github.io/learnGitBranching/) - Dilengkapi dengan visualisasi dari _branching_, _committing_, dll

## Branching

`main` adalah branch yang di-_deploy_ ke _production_, sehingga harus selalu dalam kondisi _production-ready_ (artinya semua tes harus lolos). Setiap perubahan, baik itu fitur baru, _bug fix_, maupun perbaikan ejaan, harus dikembangkan di branch yang terpisah. Nama branch harus menggunakan huruf kecil (_lower-case_) dan menggunakan tanda hubung (_hyphens_) untuk memisahkan kata. Gunakan nama branch yang deskriptif. <br>
Aturan:

- branch `main` harus stabil
- tidak commit langsung ke `main`
- semua perubahan lewat Pull Request

### Buat Branch Terpisah

**Format penamaan**: `<name-user>/<description>`<br>
Github :<br>
![branching from github](https://gitprotect.io/blog/wp-content/uploads/2024/02/how-to-vreate-a-new-GitHub-branch.png)<br>
Git Bash:

```bash
git checkout main
git pull origin main

git checkout -b new-branch
    //atau
git switch -c new-branch
```

### Contoh

Baik:

- `fadh/bigger-api-keys`
- `jong/sftp-row-validation-error`
- `teo/clever-js-deps-update`
- `iqbal/INFRA-101-update-node-package`

Buruk:

- `fadh/no_sync_tag` menggunakan underscore daripada tanda hubung (-)
- `jong/errors` tidak deskriptif
- `rewrite-ongoing` tidak ada nama pengguna

## Committing

Ikuti pedoman commit pada [Conventional Commits](conventional-commits.md)

## Workflow

Berikut adalah _development workflow_ paling sederhana yang dapat kamu gunakan:

0.  Clone repositori Git atau dapatkan versi terbaru dari `main`.

        git clone https://github.com/Fadhlan1706/Final.Project-Web.Application.git
        cd Final.Project-Web.Application

        git checkout main
        git pull

1.  Buat branch baru dari `main`.

        git checkout -b branch-kamu

            //atau

        git switch -c branch-kamu

2.  Implementasikan perubahan kamu, lalu push commit kamu sepanjang proses pembuatannya.

        git add nama-file
        git commit -m "pesan-commit"
        git push

    Kamu harus melakukan push lebih awal dan sering (_early and often_) untuk memastikan bahwa kode paling mutakhir sudah ada di GitHub. Artinya melakukan push setelah setiap commit, atau setiap kali kamu menyudahi sesi kerja. Paling minimal, lakukan push sebelum kamu selesai bekerja di hari tersebut.

    Jika kamu melakukan pengembangan dalam jangka waktu yang lama dan `main` terus berubah, kamu harus sering melakukan merge `main` ke dalam branch kamu untuk memastikannya tetap mutakhir atau pada versi perubahan terbaru. Ini akan mengurangi merge conflicts saat kamu akhirnya melakukan merge kembali branch kamu ke `main`.

        git checkout main
        git pull
        git checkout branch-kamu
        git merge main

            //atau

        git checkout branch-kamu
        git pull origin main

3.  Ketika kamu siap agar kode kamu di-_review_, buka sebuah pull request (PR) dan tetapkan (assign) ke seorang reviewer.

    Sebagai reviewer, gunakan komentar GitHub untuk menyampaikan umpan balik (feedback) kamu pada PR tersebut. Assign kembali ke pembuat permintaan (requester) setelah setiap kumpulan komentar selesai diberikan. Terakhir, assign ke requester dengan menyertakan pesan LGTM (Looks Good To Me) untuk menyetujui (sign off) PR tersebut.

    Sebagai requester, lakukan perubahan berdasarkan komentar dari reviewer. Tanggapi komentar tersebut dengan menyertakan SHA dari commit yang menangani komentar tersebut, sehingga kamu dan reviewer dapat memastikan bahwa setiap komentar telah ditangani. Setelah kamu menangani komentar-komentar tersebut, assign PR kembali ke reviewer. Ulangi proses ini sampai reviewer tidak memiliki komentar lagi.
