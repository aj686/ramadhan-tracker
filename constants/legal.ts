// Fill in before release. The contact line on the privacy page stays hidden while this is empty.
export const SUPPORT_EMAIL = '';

export const PRIVACY_LAST_UPDATED = '2026-11-01';

export type LegalLanguage = 'ms' | 'en';

interface LegalSection {
  heading: string;
  body: string;
}

// PDPA notices must be available in both Bahasa Melayu and English.
// DRAFT: have this reviewed before release, and update it whenever the data below changes.
export const PRIVACY_POLICY: Record<LegalLanguage, { title: string; intro: string; contact: string; sections: LegalSection[] }> = {
  en: {
    title: 'Privacy Policy',
    intro:
      'MyLittleMuslim is used by parents to track and encourage their children\'s Islamic habits. A parent creates and controls the account. Children do not sign up.',
    contact: 'Questions or requests about your data:',
    sections: [
      {
        heading: 'What we collect',
        body:
          'From the parent: email address and password (stored in hashed form by our login provider).\n\nAbout a child, entered by the parent: first name only, plus fasting, solat, sunat, Quran and doa records and the reward settings you choose.\n\nGame progress such as stars and scores, and the state you choose for prayer reminders, are saved on your device, not on our servers. We do not collect a child\'s photo, birth date, location or contact details.',
      },
      {
        heading: 'How we use it',
        body:
          'Only to run the app: signing you in, showing and syncing your children\'s records, and checking your subscription. We do not sell personal data.',
      },
      {
        heading: 'Who processes it',
        body:
          'Supabase stores account and tracker data. ToyyibPay processes payments if you subscribe. Cloudflare hosts the web version. Google AdMob may show non-personalised, child-directed ads to free users on non-game screens. Each acts only as needed to provide its service.',
      },
      {
        heading: 'Keeping and deleting data',
        body:
          'We keep your data while your account exists. To delete everything, go to Profile > Delete Account. This removes your account, your children\'s profiles and all their records immediately. It cannot be undone. Removing a child deletes that child\'s records.',
      },
      {
        heading: 'Your rights',
        body:
          'Under Malaysia\'s Personal Data Protection Act 2010 you may ask to access or correct your data, and withdraw consent by deleting your account. Parents are responsible for what they enter about their children.',
      },
      {
        heading: 'Security',
        body:
          'Data is sent over encrypted connections, and database rules let each account read only its own records. No system is perfectly secure, so please use a strong password.',
      },
      {
        heading: 'Changes',
        body: 'If this policy changes we will update the date on this page and tell you in the app when the change is significant.',
      },
    ],
  },
  ms: {
    title: 'Dasar Privasi',
    intro:
      'MyLittleMuslim digunakan oleh ibu bapa untuk menjejak dan menggalakkan amalan Islam anak-anak. Ibu bapa yang membuat dan mengawal akaun. Kanak-kanak tidak mendaftar sendiri.',
    contact: 'Soalan atau permintaan tentang data anda:',
    sections: [
      {
        heading: 'Data yang kami kumpul',
        body:
          'Daripada ibu bapa: alamat e-mel dan kata laluan (disimpan dalam bentuk cincang oleh penyedia log masuk kami).\n\nTentang anak, yang dimasukkan oleh ibu bapa: nama pertama sahaja, serta rekod puasa, solat, sunat, Quran dan doa, dan tetapan ganjaran yang anda pilih.\n\nKemajuan permainan seperti bintang dan markah, serta negeri yang anda pilih untuk peringatan solat, disimpan pada peranti anda, bukan pada pelayan kami. Kami tidak mengumpul gambar, tarikh lahir, lokasi atau butiran hubungan anak.',
      },
      {
        heading: 'Cara kami menggunakannya',
        body:
          'Hanya untuk menjalankan aplikasi: log masuk, memaparkan dan menyegerakkan rekod anak-anak, dan menyemak langganan anda. Kami tidak menjual data peribadi.',
      },
      {
        heading: 'Siapa yang memproses data',
        body:
          'Supabase menyimpan data akaun dan rekod. ToyyibPay memproses bayaran jika anda melanggan. Cloudflare mengehoskan versi web. Google AdMob mungkin memaparkan iklan tidak diperibadikan yang sesuai untuk kanak-kanak kepada pengguna percuma pada skrin bukan permainan. Setiap pihak bertindak setakat yang perlu untuk menyediakan perkhidmatannya.',
      },
      {
        heading: 'Penyimpanan dan pemadaman data',
        body:
          'Kami menyimpan data selagi akaun anda wujud. Untuk memadam semuanya, pergi ke Profil > Padam Akaun. Ini akan memadam akaun anda, profil anak-anak dan semua rekod mereka serta-merta, dan tidak boleh dibatalkan. Membuang seorang anak akan memadam rekod anak tersebut.',
      },
      {
        heading: 'Hak anda',
        body:
          'Di bawah Akta Perlindungan Data Peribadi 2010 Malaysia, anda boleh meminta untuk mengakses atau membetulkan data anda, dan menarik balik persetujuan dengan memadam akaun. Ibu bapa bertanggungjawab atas maklumat yang dimasukkan tentang anak-anak.',
      },
      {
        heading: 'Keselamatan',
        body:
          'Data dihantar melalui sambungan yang disulitkan, dan peraturan pangkalan data membenarkan setiap akaun membaca rekodnya sendiri sahaja. Tiada sistem yang selamat sepenuhnya, jadi sila gunakan kata laluan yang kuat.',
      },
      {
        heading: 'Perubahan',
        body: 'Jika dasar ini berubah, kami akan mengemas kini tarikh pada halaman ini dan memaklumkan anda dalam aplikasi jika perubahan itu besar.',
      },
    ],
  },
};
