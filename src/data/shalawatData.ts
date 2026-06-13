export interface Shalawat {
  id: number;
  name: string;
  desc: string;
  arab: string;
  latin: string;
  arti: string;
}

export const SHALAWAT_DATA: Shalawat[] = [
  {
    id: 1,
    name: "Shalawat Ibrahimiyah",
    desc: "Shalawat yang selalu kita baca pada tasyahud akhir dalam sholat.",
    arab: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيْدٌ مَجِيْدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيْدٌ مَجِيْدٌ",
    latin: "Allahumma shalli 'alaa Muhammad wa 'alaa aali Muhammad, kamaa shallaita 'alaa Ibraahiim wa 'alaa aali Ibraahiim, innaka Hamiidum Majiid. Allahumma baarik 'alaa Muhammad wa 'alaa aali Muhammad, kamaa baarakta 'alaa Ibraahiim wa 'alaa aali Ibraahiim, innaka Hamiidum Majiid.",
    arti: "Ya Allah, limpahkanlah rahmat kepada Nabi Muhammad dan kepada keluarga Nabi Muhammad, sebagaimana telah Engkau limpahkan rahmat kepada Nabi Ibrahim dan keluarga Nabi Ibrahim. Sesungguhnya Engkau Maha Terpuji lagi Maha Mulia. Ya Allah, berkahilah kepada Nabi Muhammad dan kepada keluarga Nabi Muhammad, sebagaimana Engkau telah memberkahi Nabi Ibrahim dan keluarga Nabi Ibrahim. Sesungguhnya Engkau Maha Terpuji lagi Maha Mulia."
  },
  {
    id: 2,
    name: "Shalawat Nariyah",
    desc: "Shalawat yang diyakini dapat melepaskan kesulitan, menghindarkan bencana, dan melancarkan rezeki atas izin Allah.",
    arab: "اللَّهُمَّ صَلِّ صَلاةً كَامِلَةً وَسَلِّمْ سَلاَمًا تَامًّا عَلَى سَيِّدِنَا مُحَمَّدٍ الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ، وَتَنْفَرِجُ بِهِ الْكُرَبُ، وَتُقْضَى بِهِ الْحَوَائِجُ، وَتُنَالُ بِهِ الرَّغَائِبُ وَحُسْنُ الْخَوَاتِمِ، وَيُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ الْكَرِيمِ، وَعَلَى آلِهِ وَصَحْبِهِ فِي كُلِّ لَمْحَةٍ وَنَفَسٍ بِعَدَدِ كُلِّ مَعْلُومٍ لَكَ",
    latin: "Allahumma shalli shalaatan kaamilatan wa sallim salaaman taamman 'alaa sayyidinaa Muhammadinnilladzii tanhallu bihil 'uqadu, wa tanfariju bihil kurabu, wa tuqdhaa bihil hawaa'iju, wa tunaalu bihir raghaa'ibu wa husnul khawaatimi, wa yustasqal ghamaamu biwajhihil kariimi, wa 'alaa aalihi wa shahbihi fii kulli lamhatin wa nafasin bi'adadi kulli ma'luumillak.",
    arti: "Ya Allah, limpahkanlah shalawat yang sempurna dan keselamatan yang sempurna kepada junjungan kami Nabi Muhammad, yang dengannya terurai segala ikatan, lenyap segala kesedihan, terpenuhi segala kebutuhan, tercapai segala keinginan dan kesudahan yang baik, dan dimintakan hujan dengan wajahnya yang mulia. Dan (limpahkanlah pula) kepada keluarganya dan para sahabatnya, pada setiap kedipan mata dan hembusan nafas, sebanyak jumlah semua yang Engkau ketahui."
  },
  {
    id: 3,
    name: "Shalawat Thibbil Qulub",
    desc: "Shalawat untuk mengobati penyakit hati dan menyembuhkan penyakit jasmani.",
    arab: "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ طِبِّ الْقُلُوْبِ وَدَوَائِهَا، وَعَافِيَةِ الأَبْدَانِ وَشِفَائِهَا، وَنُوْرِ الأَبْصَارِ وَضِيَائِهَا، وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ",
    latin: "Allahumma shalli 'alaa sayyidinaa Muhammadin thibbil quluubi wa dawaa-ihaa, wa 'aafiyatil abdaani wa syifaa-ihaa, wa nuuril abshaari wa dhiyaa-ihaa, wa 'alaa aalihi wa shahbihi wa sallim.",
    arti: "Ya Allah, curahkanlah rahmat kepada junjungan kami Nabi Muhammad, sebagai obat hati dan penyembuhnya, penyehat badan dan kesembuhannya, dan sebagai penyinar penglihatan mata beserta cahayanya. Semoga sholawat dan salam tercurahkan pula kepada keluarga serta para sahabat-sahabatnya."
  },
  {
    id: 4,
    name: "Shalawat Munjiyat",
    desc: "Shalawat penyelamat, dibaca untuk memohon perlindungan dari segala musibah dan marabahaya.",
    arab: "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ صَلاَةً تُنْجِيْنَا بِهَا مِنْ جَمِيْعِ الأَهْوَالِ وَالآفَاتِ، وَتَقْضِيْ لَنَا بِهَا جَمِيْعَ الْحَاجَاتِ، وَتُطَهِّرُنَا بِهَا مِنْ جَمِيْعِ السَّيِّئَاتِ، وَتَرْفَعُنَا بِهَا عِنْدَكَ أَعْلَى الدَّرَجَاتِ، وَتُبَلِّغُنَا بِهَا أَقْصَى الْغَايَاتِ مِنْ جَمِيْعِ الْخَيْرَاتِ فِي الْحَيَاةِ وَبَعْدَ الْمَمَاتِ",
    latin: "Allahumma shalli 'alaa sayyidinaa Muhammadin shalaatan tunjiinaa bihaa min jamii'il ahwaali wal aafaat, wa taqdhii lanaa bihaa jamii'al haajaat, wa tuthahhirunaa bihaa min jamii'is sayyi'aat, wa tarfa'unaa bihaa 'indaka a'lad darajaat, wa tuballighunaa bihaa aqshal ghaayaat min jamii'il khairaat fil hayaati wa ba'dal mamaat.",
    arti: "Ya Allah, limpahkanlah rahmat kepada junjungan kami Nabi Muhammad, yang dengan shalawat itu, Engkau akan menyelamatkan kami dari semua keadaan yang menakutkan dan dari semua cobaan; dengan shalawat itu, Engkau akan mengabulkan hajat kami; dengan shalawat itu, Engkau akan menyucikan kami dari segala keburukan; dengan shalawat itu, Engkau akan mengangkat derajat kami setinggi-tingginya di sisi-Mu; dengan shalawat itu pula, Engkau akan menyampaikan kami kepada tempat yang paling ujung dari semua kebaikan pada waktu hidup dan sesudah mati."
  },
  {
    id: 5,
    name: "Shalawat Fatih",
    desc: "Shalawat pembuka pintu segala kebaikan.",
    arab: "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ الْفَاتِحِ لِمَا أُغْلِقَ، وَالْخَاتِمِ لِمَا سَبَقَ، نَاصِرِ الْحَقِّ بِالْحَقِّ، وَالْهَادِي إِلَى صِرَاطِكَ الْمُسْتَقِيمِ، وَعَلَى آلِهِ حَقَّ قَدْرِهِ وَمِقْدَارِهِ الْعَظِيمِ",
    latin: "Allahumma shalli 'alaa sayyidinaa Muhammadinil faatihi limaa ughliq, wal khaatimi limaa sabaq, naashiril haqqi bil haqq, wal haadii ilaa shiraathikal mustaqiim, wa 'alaa aalihi haqqa qadrihi wa miqdaarihil 'azhiim.",
    arti: "Ya Allah, limpahkanlah rahmat kepada junjungan kami Nabi Muhammad, pembuka sesuatu yang tertutup, penutup nabi-nabi yang lalu, penolong kebenaran dengan kebenaran, penunjuk jalan yang lurus. Limpahkan pula rahmat kepada keluarganya sesuai dengan derajat beliau dan kedudukannya yang agung."
  }
];
