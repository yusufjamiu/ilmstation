/** App phrases → translations. Keys are the exact English text shown on screen. Add more any time. */
type T = Partial<Record<"ar" | "fr" | "ur" | "ha" | "id" | "tl" | "yo" | "ig" | "bn" | "ms", string>>;
export const DICT: Record<string, T> = {
  // navigation
  "Today": { ar: "اليوم", fr: "Aujourd’hui", ur: "آج", ha: "Yau" },
  "Play": { ar: "العب", fr: "Jouer", ur: "کھیلیں", ha: "Wasa" },
  "Quests": { ar: "المهام", fr: "Quêtes", ur: "مہمات", ha: "Ayyuka" },
  "Progress": { ar: "التقدم", fr: "Progrès", ur: "پیش رفت", ha: "Ci gaba" },
  "You": { ar: "أنت", fr: "Vous", ur: "آپ", ha: "Kai" },
  "Home": { ar: "الرئيسية", fr: "Accueil", ur: "ہوم", ha: "Gida" },
  "Study": { ar: "الدراسة", fr: "Étudier", ur: "مطالعہ", ha: "Karatu" },
  "Challenge": { ar: "التحدي", fr: "Défi", ur: "مقابلہ", ha: "Ƙalubale" },
  "Quran": { ar: "القرآن", fr: "Coran", ur: "قرآن", ha: "Alƙur’ani" },
  "Qur’an": { ar: "القرآن", fr: "Coran", ur: "قرآن", ha: "Alƙur’ani" },
  "Halaqah": { ar: "الحلقة", fr: "Halaqa", ur: "حلقہ", ha: "Halaka" },
  "Chatrooms": { ar: "الغرف", fr: "Salons", ur: "چیٹ روم", ha: "Dakunan hira" },
  "Library": { ar: "المكتبة", fr: "Bibliothèque", ur: "لائبریری", ha: "Laburare" },
  "Settings": { ar: "الإعدادات", fr: "Paramètres", ur: "ترتیبات", ha: "Saituna" },
  "Family hub": { ar: "ركن العائلة", fr: "Espace famille", ur: "فیملی ہب", ha: "Cibiyar iyali" },
  "Wallet & store": { ar: "المحفظة والمتجر", fr: "Portefeuille et boutique", ur: "والٹ اور اسٹور", ha: "Jaka da shago" },
  "Practice": { ar: "تدريب", fr: "Pratique", ur: "مشق", ha: "Atisaye" },
  "Log out": { ar: "تسجيل الخروج", fr: "Se déconnecter", ur: "لاگ آؤٹ", ha: "Fita" },
  "Log in": { ar: "تسجيل الدخول", fr: "Se connecter", ur: "لاگ ان", ha: "Shiga" },
  "Sign up": { ar: "إنشاء حساب", fr: "S’inscrire", ur: "سائن اپ", ha: "Yi rajista" },
  "Create account": { ar: "إنشاء حساب", fr: "Créer un compte", ur: "اکاؤنٹ بنائیں", ha: "Buɗe asusu" },
  "Create an account": { ar: "إنشاء حساب", fr: "Créer un compte", ur: "اکاؤنٹ بنائیں", ha: "Buɗe asusu" },
  "Get started": { ar: "ابدأ الآن", fr: "Commencer", ur: "شروع کریں", ha: "Fara yanzu" },
  "Continue with Google": { ar: "المتابعة باستخدام Google", fr: "Continuer avec Google", ur: "Google کے ساتھ جاری رکھیں", ha: "Ci gaba da Google" },
  "Forgot password?": { ar: "نسيت كلمة المرور؟", fr: "Mot de passe oublié ?", ur: "پاس ورڈ بھول گئے؟", ha: "Ka manta kalmar sirri?" },
  "Email": { ar: "البريد الإلكتروني", fr: "E-mail", ur: "ای میل", ha: "Imel" },
  "Password": { ar: "كلمة المرور", fr: "Mot de passe", ur: "پاس ورڈ", ha: "Kalmar sirri" },
  "Open dashboard": { ar: "لوحة التحكم", fr: "Tableau de bord", ur: "ڈیش بورڈ", ha: "Buɗe dashboard" },
  "Events": { ar: "الفعاليات", fr: "Événements", ur: "تقریبات", ha: "Taruka" },
  "Centres": { ar: "المراكز", fr: "Centres", ur: "مراکز", ha: "Cibiyoyi" },
  "Sponsor": { ar: "ادعم", fr: "Parrainer", ur: "سرپرستی", ha: "Tallafa" },
  // common buttons
  "Save": { ar: "حفظ", fr: "Enregistrer", ur: "محفوظ کریں", ha: "Ajiye" },
  "Cancel": { ar: "إلغاء", fr: "Annuler", ur: "منسوخ", ha: "Soke" },
  "Close": { ar: "إغلاق", fr: "Fermer", ur: "بند کریں", ha: "Rufe" },
  "Done": { ar: "تم", fr: "Terminé", ur: "ہو گیا", ha: "An gama" },
  "Continue": { ar: "متابعة", fr: "Continuer", ur: "جاری رکھیں", ha: "Ci gaba" },
  "Back": { ar: "رجوع", fr: "Retour", ur: "واپس", ha: "Koma baya" },
  "Next": { ar: "التالي", fr: "Suivant", ur: "اگلا", ha: "Na gaba" },
  "Previous": { ar: "السابق", fr: "Précédent", ur: "پچھلا", ha: "Na baya" },
  "Go": { ar: "اذهب", fr: "Aller", ur: "جائیں", ha: "Je" },
  "Page": { ar: "صفحة", fr: "Page", ur: "صفحہ", ha: "Shafi" },
  "Start": { ar: "ابدأ", fr: "Commencer", ur: "شروع کریں", ha: "Fara" },
  "Loading…": { ar: "جارٍ التحميل…", fr: "Chargement…", ur: "لوڈ ہو رہا ہے…", ha: "Ana lodawa…" },
  "Try again": { ar: "حاول مرة أخرى", fr: "Réessayer", ur: "دوبارہ کوشش کریں", ha: "Sake gwadawa" },
  "Search": { ar: "بحث", fr: "Rechercher", ur: "تلاش", ha: "Nema" },
  "Send": { ar: "إرسال", fr: "Envoyer", ur: "بھیجیں", ha: "Aika" },
  "Update": { ar: "تحديث", fr: "Mettre à jour", ur: "اپ ڈیٹ", ha: "Sabunta" },
  "Install": { ar: "تثبيت", fr: "Installer", ur: "انسٹال کریں", ha: "Saka" },
  "Not now": { ar: "ليس الآن", fr: "Pas maintenant", ur: "ابھی نہیں", ha: "Ba yanzu ba" },
  "Turn on": { ar: "تشغيل", fr: "Activer", ur: "آن کریں", ha: "Kunna" },
  "Coming soon": { ar: "قريبًا", fr: "Bientôt", ur: "جلد آرہا ہے", ha: "Yana zuwa nan ba da daɗewa ba" },
  "Tap to play": { ar: "اضغط للعب", fr: "Touchez pour jouer", ur: "کھیلنے کے لیے ٹیپ کریں", ha: "Taɓa don yin wasa" },
  // Qur'an
  "Hifz": { ar: "الحفظ", fr: "Mémorisation", ur: "حفظ", ha: "Haddar" },
  "Tilawah": { ar: "التلاوة", fr: "Lecture", ur: "تلاوت", ha: "Tilawa" },
  "Revision": { ar: "المراجعة", fr: "Révision", ur: "دہرائی", ha: "Bita" },
  "Listen": { ar: "الاستماع", fr: "Écouter", ur: "سنیں", ha: "Saurara" },
  "What would you like to do?": { ar: "ماذا تريد أن تفعل؟", fr: "Que voulez-vous faire ?", ur: "آپ کیا کرنا چاہیں گے؟", ha: "Me kake so ka yi?" },
  "Memorise step by step": { ar: "احفظ خطوة بخطوة", fr: "Mémorisez pas à pas", ur: "قدم بہ قدم حفظ کریں", ha: "Haddace mataki-mataki" },
  "Read the mushaf page by page": { ar: "اقرأ المصحف صفحة صفحة", fr: "Lisez le mushaf page par page", ur: "مصحف صفحہ بہ صفحہ پڑھیں", ha: "Karanta Mushafi shafi-shafi" },
  "Review what you’ve memorised": { ar: "راجع ما حفظته", fr: "Révisez ce que vous avez mémorisé", ur: "جو حفظ کیا ہے اسے دہرائیں", ha: "Yi bitar abin da ka haddace" },
  "Listen to beautiful recitations": { ar: "استمع إلى تلاوات جميلة", fr: "Écoutez de belles récitations", ur: "خوبصورت تلاوتیں سنیں", ha: "Saurari kyawawan karatuttuka" },
  "☰ Surahs": { ar: "☰ السور", fr: "☰ Sourates", ur: "☰ سورتیں", ha: "☰ Surori" },
  "Search a surah…": { ar: "ابحث عن سورة…", fr: "Rechercher une sourate…", ur: "سورت تلاش کریں…", ha: "Nemo sura…" },
  "Or choose a surah:": { ar: "أو اختر سورة:", fr: "Ou choisissez une sourate :", ur: "یا کوئی سورت منتخب کریں:", ha: "Ko zaɓi sura:" },
  "Choose a surah": { ar: "اختر سورة", fr: "Choisir une sourate", ur: "سورت منتخب کریں", ha: "Zaɓi sura" },
  "Start from the beginning": { ar: "ابدأ من البداية", fr: "Commencer depuis le début", ur: "شروع سے پڑھیں", ha: "Fara daga farko" },
  "Continue reading?": { ar: "متابعة القراءة؟", fr: "Continuer la lecture ?", ur: "پڑھنا جاری رکھیں؟", ha: "Ci gaba da karatu?" },
  "Continue listening?": { ar: "متابعة الاستماع؟", fr: "Continuer l’écoute ?", ur: "سننا جاری رکھیں؟", ha: "Ci gaba da sauraro?" },
  "▶ Play": { ar: "▶ تشغيل", fr: "▶ Lire", ur: "▶ چلائیں", ha: "▶ Kunna" },
  "⏸ Pause": { ar: "⏸ إيقاف مؤقت", fr: "⏸ Pause", ur: "⏸ روکیں", ha: "⏸ Dakata" },
  "▶ Play from this verse": { ar: "▶ التشغيل من هذه الآية", fr: "▶ Lire à partir de ce verset", ur: "▶ اس آیت سے چلائیں", ha: "▶ Kunna daga wannan aya" },
  "Loading the page…": { ar: "جارٍ تحميل الصفحة…", fr: "Chargement de la page…", ur: "صفحہ لوڈ ہو رہا ہے…", ha: "Ana loda shafin…" },
  // Today
  "Daily Wisdom": { ar: "حكمة اليوم", fr: "Sagesse du jour", ur: "آج کی حکمت", ha: "Hikimar yau" },
  "Prayer times": { ar: "مواقيت الصلاة", fr: "Heures de prière", ur: "اوقاتِ نماز", ha: "Lokutan sallah" },
  "Fajr": { ar: "الفجر", fr: "Fajr", ur: "فجر", ha: "Asuba" },
  "Sunrise": { ar: "الشروق", fr: "Lever du soleil", ur: "طلوعِ آفتاب", ha: "Fitowar rana" },
  "Dhuhr": { ar: "الظهر", fr: "Dhuhr", ur: "ظہر", ha: "Azahar" },
  "Asr": { ar: "العصر", fr: "Asr", ur: "عصر", ha: "La’asar" },
  "Maghrib": { ar: "المغرب", fr: "Maghrib", ur: "مغرب", ha: "Magariba" },
  "Isha": { ar: "العشاء", fr: "Isha", ur: "عشاء", ha: "Isha" },
  "Copy": { ar: "نسخ", fr: "Copier", ur: "کاپی", ha: "Kwafi" },
  "Card": { ar: "بطاقة", fr: "Carte", ur: "کارڈ", ha: "Kati" },
  // kids
  "Games 🎮": { ar: "الألعاب 🎮", fr: "Jeux 🎮", ur: "کھیل 🎮", ha: "Wasanni 🎮" },
  "Study 📚": { ar: "الدراسة 📚", fr: "Étudier 📚", ur: "مطالعہ 📚", ha: "Karatu 📚" },
  "Games": { ar: "الألعاب", fr: "Jeux", ur: "کھیل", ha: "Wasanni" },
  "Quizzes": { ar: "الاختبارات", fr: "Quiz", ur: "کوئز", ha: "Tambayoyi" },
  "Puzzles": { ar: "الألغاز", fr: "Puzzles", ur: "پہیلیاں", ha: "Wasanin wasa ƙwaƙwalwa" },
  "Memory games": { ar: "ألعاب الذاكرة", fr: "Jeux de mémoire", ur: "یادداشت کے کھیل", ha: "Wasannin tunawa" },
  "Pick something to learn!": { ar: "اختر شيئًا لتتعلمه!", fr: "Choisis quelque chose à apprendre !", ur: "سیکھنے کے لیے کچھ چنیں!", ha: "Zaɓi abin da za ka koya!" },
  "Pick a subject!": { ar: "اختر مادة!", fr: "Choisis une matière !", ur: "مضمون چنیں!", ha: "Zaɓi darasi!" },
  "What do you want to play?": { ar: "ماذا تريد أن تلعب؟", fr: "À quoi veux-tu jouer ?", ur: "آپ کیا کھیلنا چاہتے ہیں؟", ha: "Me kake so ka yi wasa?" },
  "New lessons are coming soon! 🌟": { ar: "دروس جديدة قريبًا! 🌟", fr: "De nouvelles leçons arrivent bientôt ! 🌟", ur: "نئے اسباق جلد آ رہے ہیں! 🌟", ha: "Sababbin darussa na nan tafe! 🌟" },
  "Subjects": { ar: "المواد", fr: "Matières", ur: "مضامین", ha: "Darussa" },
  // Premium
  "Premium": { ar: "بريميوم", fr: "Premium", ur: "پریمیم", ha: "Premium" },
  "Free": { ar: "مجاني", fr: "Gratuit", ur: "مفت", ha: "Kyauta" },
  "Monthly": { ar: "شهري", fr: "Mensuel", ur: "ماہانہ", ha: "Wata-wata" },
  "Yearly": { ar: "سنوي", fr: "Annuel", ur: "سالانہ", ha: "Shekara-shekara" },
  "Choose plan": { ar: "اختر الخطة", fr: "Choisir l’offre", ur: "پلان منتخب کریں", ha: "Zaɓi tsari" },
  "Ask for a quote": { ar: "اطلب عرض سعر", fr: "Demander un devis", ur: "قیمت معلوم کریں", ha: "Nemi farashi" },
  "Pay now": { ar: "ادفع الآن", fr: "Payer maintenant", ur: "ابھی ادائیگی کریں", ha: "Biya yanzu" },
  // Settings
  "🔔 Notifications": { ar: "🔔 الإشعارات", fr: "🔔 Notifications", ur: "🔔 اطلاعات", ha: "🔔 Sanarwa" },
  "Turn on notifications": { ar: "تفعيل الإشعارات", fr: "Activer les notifications", ur: "اطلاعات آن کریں", ha: "Kunna sanarwa" },
  "Send me a test": { ar: "أرسل لي تجربة", fr: "M’envoyer un test", ur: "مجھے ٹیسٹ بھیجیں", ha: "Aiko mini da gwaji" },
  "📲 Install the app": { ar: "📲 ثبّت التطبيق", fr: "📲 Installer l’application", ur: "📲 ایپ انسٹال کریں", ha: "📲 Saka manhajar" },
  "Install IlmStation": { ar: "ثبّت IlmStation", fr: "Installer IlmStation", ur: "IlmStation انسٹال کریں", ha: "Saka IlmStation" },
  "Delete my account": { ar: "حذف حسابي", fr: "Supprimer mon compte", ur: "میرا اکاؤنٹ حذف کریں", ha: "Share asusuna" },
  "Privacy Policy": { ar: "سياسة الخصوصية", fr: "Politique de confidentialité", ur: "رازداری کی پالیسی", ha: "Manufar sirri" },
  "Terms of Use": { ar: "شروط الاستخدام", fr: "Conditions d’utilisation", ur: "استعمال کی شرائط", ha: "Sharuɗɗan amfani" },
  "Prize Rules": { ar: "قواعد الجوائز", fr: "Règles des prix", ur: "انعامات کے قواعد", ha: "Dokokin kyaututtuka" },
  "🌍 Language": { ar: "🌍 اللغة", fr: "🌍 Langue", ur: "🌍 زبان", ha: "🌍 Harshe" },
  // settings
  "Preferences & account": { ar: "التفضيلات والحساب", fr: "Préférences et compte", ur: "ترجیحات اور اکاؤنٹ", ha: "Zaɓuɓɓuka da asusu" },
  "Experience": { ar: "التجربة", fr: "Expérience", ur: "تجربہ", ha: "Kwarewa" },
  "Saved automatically": { ar: "يُحفظ تلقائيًا", fr: "Enregistré automatiquement", ur: "خودبخود محفوظ", ha: "Ana ajiyewa kai tsaye" },
  "Quest reminders": { ar: "تذكيرات المهام", fr: "Rappels de quêtes", ur: "مہم کی یاد دہانیاں", ha: "Tunatarwar ayyuka" },
  "Sound effects": { ar: "المؤثرات الصوتية", fr: "Effets sonores", ur: "صوتی اثرات", ha: "Sautuka" },
  "Reduced motion": { ar: "تقليل الحركة", fr: "Animations réduites", ur: "کم حرکت", ha: "Rage motsi" },
  "Language": { ar: "اللغة", fr: "Langue", ur: "زبان", ha: "Harshe" },
  "Account": { ar: "الحساب", fr: "Compte", ur: "اکاؤنٹ", ha: "Asusu" },
  "Frontend demo": { ar: "تجريبي", fr: "Démo", ur: "ڈیمو", ha: "Gwaji" },
  "Replay onboarding": { ar: "إعادة الجولة التعريفية", fr: "Revoir la présentation", ur: "تعارف دوبارہ دیکھیں", ha: "Sake kallon gabatarwa" },
  "Privacy & accessibility": { ar: "الخصوصية وسهولة الوصول", fr: "Confidentialité et accessibilité", ur: "رازداری اور رسائی", ha: "Sirri da sauƙin amfani" },
  "Preview offline state": { ar: "معاينة وضع عدم الاتصال", fr: "Aperçu hors ligne", ur: "آف لائن حالت دیکھیں", ha: "Duba yanayin babu intanet" },
  "Dark theme preview": { ar: "الوضع الداكن", fr: "Thème sombre", ur: "ڈارک تھیم", ha: "Yanayin duhu" },
  "Language saved": { ar: "تم حفظ اللغة", fr: "Langue enregistrée", ur: "زبان محفوظ ہو گئی", ha: "An ajiye harshe" },
  // Today
  "Your daily ledger": { ar: "سجلك اليومي", fr: "Votre journal du jour", ur: "آپ کا روزانہ ریکارڈ", ha: "Littafin ka na yau" },
  "Quick quiz": { ar: "اختبار سريع", fr: "Quiz rapide", ur: "فوری کوئز", ha: "Gajeren gwaji" },
  "Quick Quiz": { ar: "اختبار سريع", fr: "Quiz rapide", ur: "فوری کوئز", ha: "Gajeren gwaji" },
  "Days to Ramadan": { ar: "يومًا على رمضان", fr: "jours avant le Ramadan", ur: "دن رمضان تک", ha: "Kwanaki zuwa Ramadan" },
  "Prepare": { ar: "استعد", fr: "Se préparer", ur: "تیاری کریں", ha: "Shirya" },
  "Pick up where you left off": { ar: "تابع من حيث توقفت", fr: "Reprenez là où vous vous êtes arrêté", ur: "جہاں چھوڑا تھا وہیں سے شروع کریں", ha: "Ci gaba daga inda ka tsaya" },
  "Continue reading": { ar: "تابع القراءة", fr: "Continuer la lecture", ur: "پڑھنا جاری رکھیں", ha: "Ci gaba da karatu" },
  "Continue in Library": { ar: "تابع في المكتبة", fr: "Continuer dans la bibliothèque", ur: "لائبریری میں جاری رکھیں", ha: "Ci gaba a laburare" },
  "Next prayer": { ar: "الصلاة القادمة", fr: "Prochaine prière", ur: "اگلی نماز", ha: "Sallah ta gaba" },
  "Download": { ar: "تنزيل", fr: "Télécharger", ur: "ڈاؤن لوڈ", ha: "Sauke" },
  "Share": { ar: "مشاركة", fr: "Partager", ur: "شیئر کریں", ha: "Raba" },
  "Ramadan": { ar: "رمضان", fr: "Ramadan", ur: "رمضان", ha: "Ramadan" },
  "Cards": { ar: "البطاقات", fr: "Cartes", ur: "کارڈز", ha: "Katuna" },
  "Community": { ar: "المجتمع", fr: "Communauté", ur: "کمیونٹی", ha: "Al’umma" },
  "IlmBot": { ar: "IlmBot", fr: "IlmBot", ur: "IlmBot", ha: "IlmBot" },
  // dashboard
  "Assalamu-alaikum,": { ar: "السلام عليكم،", fr: "Assalamu-alaikum,", ur: "السلام علیکم،", ha: "Assalamu alaikum," },
  "Assalamu alaikum": { ar: "السلام عليكم", fr: "Assalamu alaikum", ur: "السلام علیکم", ha: "Assalamu alaikum" },
  "days to Ramadan": { ar: "يومًا على رمضان", fr: "jours avant le Ramadan", ur: "دن رمضان تک", ha: "kwanaki zuwa Ramadan" },
  "Prepare your intention, Tarawih plan, and 30-day quest chain.": { ar: "جهّز نيّتك وخطة التراويح وسلسلة مهام الثلاثين يومًا.", fr: "Préparez votre intention, votre plan de Tarawih et votre parcours de 30 jours.", ur: "اپنی نیت، تراویح کا منصوبہ اور 30 دن کی مہمات تیار کریں۔", ha: "Shirya niyyarka, tsarin Tarawihi, da ayyukan kwanaki 30." },
  "Prepare your intention, Tarawih plan, and 30-day quest chain": { ar: "جهّز نيّتك وخطة التراويح وسلسلة مهام الثلاثين يومًا", fr: "Préparez votre intention, votre plan de Tarawih et votre parcours de 30 jours", ur: "اپنی نیت، تراویح کا منصوبہ اور 30 دن کی مہمات تیار کریں", ha: "Shirya niyyarka, tsarin Tarawihi, da ayyukan kwanaki 30" },
  "Play Modes": { ar: "أنماط اللعب", fr: "Modes de jeu", ur: "کھیل کے طریقے", ha: "Hanyoyin wasa" },
  "Choose a practice": { ar: "اختر تدريبًا", fr: "Choisissez une pratique", ur: "مشق منتخب کریں", ha: "Zaɓi atisaye" },
  "Hifz Drills": { ar: "تمارين الحفظ", fr: "Exercices de mémorisation", ur: "حفظ کی مشقیں", ha: "Atisayen haddar" },
  "Recite and review": { ar: "رتّل وراجع", fr: "Réciter et réviser", ur: "پڑھیں اور دہرائیں", ha: "Karanta ka yi bita" },
  "Tafsir Quiz": { ar: "اختبار التفسير", fr: "Quiz de tafsir", ur: "تفسیر کوئز", ha: "Gwajin tafsiri" },
  "10 mixed questions": { ar: "10 أسئلة متنوعة", fr: "10 questions variées", ur: "10 ملے جلے سوالات", ha: "Tambayoyi 10 gauraye" },
  "Learn with family": { ar: "تعلّم مع العائلة", fr: "Apprendre en famille", ur: "خاندان کے ساتھ سیکھیں", ha: "Koyo tare da iyali" },
  "Ask and explore": { ar: "اسأل واستكشف", fr: "Demander et explorer", ur: "پوچھیں اور دریافت کریں", ha: "Tambaya ka bincika" },
  "Leaderboard": { ar: "لوحة المتصدرين", fr: "Classement", ur: "لیڈر بورڈ", ha: "Teburin gwaraza" },
  "Weekly": { ar: "أسبوعي", fr: "Hebdomadaire", ur: "ہفتہ وار", ha: "Na mako" },
  "Invite friends to see the leaderboard.": { ar: "ادعُ أصدقاءك لرؤية لوحة المتصدرين.", fr: "Invitez des amis pour voir le classement.", ur: "لیڈر بورڈ دیکھنے کے لیے دوستوں کو مدعو کریں۔", ha: "Gayyaci abokai don ganin teburin gwaraza." },
  "View all": { ar: "عرض الكل", fr: "Tout voir", ur: "سب دیکھیں", ha: "Duba duka" },
  "Daily streak": { ar: "السلسلة اليومية", fr: "Série quotidienne", ur: "روزانہ تسلسل", ha: "Jerin kwanaki" },
  // prayer card and adhan
  "Adhan": { ar: "الأذان", fr: "Adhan", ur: "اذان", ha: "Kiran sallah" },
  "▶ Play adhan": { ar: "▶ تشغيل الأذان", fr: "▶ Jouer l’adhan", ur: "▶ اذان چلائیں", ha: "▶ Kunna kiran sallah" },
  "Stop": { ar: "إيقاف", fr: "Arrêter", ur: "روکیں", ha: "Tsaya" },
  "Turn off adhan": { ar: "إيقاف الأذان", fr: "Désactiver l’adhan", ur: "اذان بند کریں", ha: "Kashe kiran sallah" },
  "Couldn't load prayer times.": { ar: "تعذّر تحميل مواقيت الصلاة.", fr: "Impossible de charger les heures de prière.", ur: "اوقاتِ نماز لوڈ نہیں ہو سکے۔", ha: "An kasa loda lokutan sallah." },
  // continue card
  "Continue listening": { ar: "تابع الاستماع", fr: "Continuer l’écoute", ur: "سننا جاری رکھیں", ha: "Ci gaba da sauraro" },
  "Start reading": { ar: "ابدأ القراءة", fr: "Commencer la lecture", ur: "پڑھنا شروع کریں", ha: "Fara karatu" },
  "Start with a quick quiz": { ar: "ابدأ باختبار سريع", fr: "Commencez par un quiz rapide", ur: "فوری کوئز سے شروع کریں", ha: "Fara da gajeren gwaji" },
  "Open a book from the library, or test yourself with a quick quiz.": { ar: "افتح كتابًا من المكتبة، أو اختبر نفسك باختبار سريع.", fr: "Ouvrez un livre de la bibliothèque ou testez-vous avec un quiz rapide.", ur: "لائبریری سے کوئی کتاب کھولیں، یا فوری کوئز سے خود کو آزمائیں۔", ha: "Buɗe littafi daga laburare, ko gwada kanka da gajeren gwaji." },
  // Friday Al-Kahf
  "Jumu’ah Mubarak": { ar: "جمعة مباركة", fr: "Joumou’a Moubarak", ur: "جمعہ مبارک", ha: "Juma’a Mubarak" },
  "Surah Al-Kahf": { ar: "سورة الكهف", fr: "Sourate Al-Kahf", ur: "سورۃ الکہف", ha: "Suratul Kahfi" },
  "Mushaf": { ar: "المصحف", fr: "Mushaf", ur: "مصحف", ha: "Mushafi" },
  "With translation": { ar: "مع الترجمة", fr: "Avec traduction", ur: "ترجمے کے ساتھ", ha: "Tare da fassara" },
  "110 ayat · read or listen": { ar: "110 آية · اقرأ أو استمع", fr: "110 versets · lire ou écouter", ur: "110 آیات · پڑھیں یا سنیں", ha: "Ayoyi 110 · karanta ko saurara" },
  "Couldn't load the surah. Check your connection and try again.": { ar: "تعذّر تحميل السورة. تحقق من اتصالك وحاول مرة أخرى.", fr: "Impossible de charger la sourate. Vérifiez votre connexion et réessayez.", ur: "سورت لوڈ نہیں ہو سکی۔ اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔", ha: "An kasa loda surar. Duba intanet ɗinka ka sake gwadawa." },
  "Read Surah Al-Kahf": { ar: "اقرأ سورة الكهف", fr: "Lire la sourate Al-Kahf", ur: "سورۃ الکہف پڑھیں", ha: "Karanta Suratul Kahfi" },
  "I’ve read Al-Kahf": { ar: "قرأتُ سورة الكهف", fr: "J’ai lu Al-Kahf", ur: "میں نے سورۃ الکہف پڑھ لی", ha: "Na karanta Suratul Kahfi" },
  "Level": { ar: "المستوى", fr: "Niveau", ur: "لیول", ha: "Mataki" },
  "▶ Next": { ar: "▶ التالي", fr: "▶ Suivant", ur: "▶ اگلا", ha: "▶ Na gaba" },
  // website, signup, app
  "Seek · Learn · Grow": { ar: "اطلب · تعلّم · انمُ", fr: "Chercher · Apprendre · Grandir", ur: "تلاش · سیکھیں · بڑھیں", ha: "Nema · Koyo · Girma" },
  "Knowledge pursued with purpose.": { ar: "علمٌ يُطلب بهدف.", fr: "Le savoir recherché avec un but.", ur: "مقصد کے ساتھ علم کی تلاش۔", ha: "Ilimi da ake nema da manufa." },
  "About": { ar: "من نحن", fr: "À propos", ur: "ہمارے بارے میں", ha: "Game da mu" },
  "Sponsor a learner": { ar: "ادعم متعلّمًا", fr: "Parrainer un apprenant", ur: "کسی طالب علم کی سرپرستی کریں", ha: "Tallafa wa ɗalibi" },
  "Dashboard": { ar: "لوحة التحكم", fr: "Tableau de bord", ur: "ڈیش بورڈ", ha: "Dashboard" },
  "Privacy": { ar: "الخصوصية", fr: "Confidentialité", ur: "رازداری", ha: "Sirri" },
  "Terms": { ar: "الشروط", fr: "Conditions", ur: "شرائط", ha: "Sharuɗɗa" },
  "Prize rules": { ar: "قواعد الجوائز", fr: "Règles des prix", ur: "انعامات کے قواعد", ha: "Dokokin kyaututtuka" },
  "A living school for everyday Muslims": { ar: "مدرسة حيّة لكل مسلم في حياته اليومية", fr: "Une école vivante pour les musulmans au quotidien", ur: "روزمرہ مسلمانوں کے لیے ایک زندہ درسگاہ", ha: "Makaranta mai rai ga Musulmi a kowace rana" },
  "Seek knowledge.": { ar: "اطلب العلم.", fr: "Cherchez le savoir.", ur: "علم حاصل کریں۔", ha: "Nemi ilimi." },
  "Grow together.": { ar: "وانمُ معنا.", fr: "Grandissons ensemble.", ur: "ساتھ مل کر بڑھیں۔", ha: "Mu girma tare." },
  "Daily lessons, quizzes, a library with audio, moderated chatrooms and a 3D Muslim world, in one purposeful journey.": { ar: "دروس يومية، واختبارات، ومكتبة صوتية، وغرف محادثة مُشرف عليها، وعالم إسلامي ثلاثي الأبعاد، في رحلة واحدة هادفة.", fr: "Des leçons quotidiennes, des quiz, une bibliothèque audio, des salons modérés et un monde musulman en 3D, réunis dans un même parcours.", ur: "روزانہ اسباق، کوئز، آڈیو والی لائبریری، نگرانی والے چیٹ روم اور تھری ڈی مسلم دنیا، ایک بامقصد سفر میں۔", ha: "Darussan yau da kullum, tambayoyi, laburare mai sauti, dakunan hira masu kulawa da duniyar Musulmi ta 3D, a cikin tafiya ɗaya mai manufa." },
  "Start today’s quest": { ar: "ابدأ مهمة اليوم", fr: "Commencer la quête du jour", ur: "آج کی مہم شروع کریں", ha: "Fara aikin yau" },
  "Explore IlmWorld": { ar: "استكشف IlmWorld", fr: "Explorer IlmWorld", ur: "IlmWorld دیکھیں", ha: "Bincika IlmWorld" },
  "to start learning": { ar: "لبدء التعلّم", fr: "pour commencer à apprendre", ur: "سیکھنا شروع کرنے کے لیے", ha: "don fara koyo" },
  "3 zones": { ar: "3 أقسام", fr: "3 espaces", ur: "3 زونز", ha: "Sassa 3" },
  "Kids · Teens · Adults": { ar: "أطفال · يافعون · كبار", fr: "Enfants · Ados · Adultes", ur: "بچے · نوجوان · بالغ", ha: "Yara · Matasa · Manya" },
  "“My Lord, increase me in knowledge.”": { ar: "«رَبِّ زِدْنِي عِلْمًا»", fr: "« Seigneur, accroît mes connaissances. »", ur: "”اے میرے رب! میرے علم میں اضافہ فرما۔“", ha: "“Ya Ubangijina, ka ƙara mini ilimi.”" },
  "Qur’an 20:114": { ar: "القرآن ٢٠:١١٤", fr: "Coran 20:114", ur: "قرآن 20:114", ha: "Alƙur’ani 20:114" },
  "Simple by design": { ar: "بسيط في تصميمه", fr: "Simple par nature", ur: "سادہ ڈیزائن", ha: "Mai sauƙi a tsari" },
  "How IlmStation works": { ar: "كيف يعمل IlmStation", fr: "Comment fonctionne IlmStation", ur: "IlmStation کیسے کام کرتا ہے", ha: "Yadda IlmStation ke aiki" },
  "New · 3D world": { ar: "جديد · عالم ثلاثي الأبعاد", fr: "Nouveau · monde 3D", ur: "نیا · تھری ڈی دنیا", ha: "Sabo · duniyar 3D" },
  "IlmWorld: live a Muslim life, learn as you go.": { ar: "IlmWorld: عِش حياة المسلم وتعلّم أثناء ذلك.", fr: "IlmWorld : vivez une vie musulmane et apprenez en chemin.", ur: "IlmWorld: مسلم زندگی گزاریں، چلتے چلتے سیکھیں۔", ha: "IlmWorld: rayu rayuwar Musulmi, ka koya a hanya." },
  "Enter IlmWorld": { ar: "ادخل IlmWorld", fr: "Entrer dans IlmWorld", ur: "IlmWorld میں داخل ہوں", ha: "Shiga IlmWorld" },
  "One companion, the whole journey": { ar: "رفيق واحد للرحلة كلها", fr: "Un seul compagnon pour tout le parcours", ur: "ایک ساتھی، پورا سفر", ha: "Abokin tafiya ɗaya, har ƙarshe" },
  "Everything you need to keep going": { ar: "كل ما تحتاجه للاستمرار", fr: "Tout ce qu’il faut pour continuer", ur: "آگے بڑھنے کے لیے سب کچھ", ha: "Duk abin da kake bukata don ci gaba" },
  "Open the app": { ar: "افتح التطبيق", fr: "Ouvrir l’application", ur: "ایپ کھولیں", ha: "Buɗe manhajar" },
  "Ramadan with IlmStation": { ar: "رمضان مع IlmStation", fr: "Le Ramadan avec IlmStation", ur: "IlmStation کے ساتھ رمضان", ha: "Ramadan tare da IlmStation" },
  "Your best Ramadan, day by day.": { ar: "أفضل رمضان لك، يومًا بيوم.", fr: "Votre meilleur Ramadan, jour après jour.", ur: "آپ کا بہترین رمضان، دن بہ دن۔", ha: "Ramadan ɗinka mafi kyau, rana-rana." },
  "Prepare for Ramadan": { ar: "استعد لرمضان", fr: "Se préparer au Ramadan", ur: "رمضان کی تیاری کریں", ha: "Shirya wa Ramadan" },
  "Sponsor a day’s prizes": { ar: "ادعم جوائز يوم", fr: "Parrainer les prix d’un jour", ur: "ایک دن کے انعامات اسپانسر کریں", ha: "Dauki nauyin kyaututtukan rana ɗaya" },
  "Conversations with adab": { ar: "محادثات بأدب", fr: "Des échanges avec adab", ur: "ادب کے ساتھ گفتگو", ha: "Hira da ladabi" },
  "The circle stays open.": { ar: "الحلقة مفتوحة دائمًا.", fr: "Le cercle reste ouvert.", ur: "حلقہ کھلا رہتا ہے۔", ha: "Da’irar a buɗe take." },
  "Topic rooms for each age group, sisters’ and brothers’ circles, text-only and moderated by our team.": { ar: "غرف موضوعية لكل فئة عمرية، وحلقات للأخوات والإخوة، نصية فقط ويشرف عليها فريقنا.", fr: "Des salons par thème pour chaque tranche d’âge, des cercles sœurs et frères, en texte uniquement et modérés par notre équipe.", ur: "ہر عمر کے لیے موضوعاتی کمرے، بہنوں اور بھائیوں کے حلقے، صرف تحریری اور ہماری ٹیم کی نگرانی میں۔", ha: "Dakuna bisa jigo ga kowane rukuni na shekaru, da’irori na ’yan’uwa mata da maza, rubutu kaɗai kuma ƙungiyarmu tana kula da su." },
  "Enter chatrooms": { ar: "ادخل غرف المحادثة", fr: "Entrer dans les salons", ur: "چیٹ روم میں جائیں", ha: "Shiga dakunan hira" },
  "Rooms are opening soon.": { ar: "ستُفتح الغرف قريبًا.", fr: "Les salons ouvrent bientôt.", ur: "کمرے جلد کھلیں گے۔", ha: "Za a buɗe dakunan nan ba da daɗewa ba." },
  "Kids & family": { ar: "الأطفال والعائلة", fr: "Enfants et famille", ur: "بچے اور خاندان", ha: "Yara da iyali" },
  "A safe, joyful journey for children.": { ar: "رحلة آمنة ومبهجة للأطفال.", fr: "Un parcours sûr et joyeux pour les enfants.", ur: "بچوں کے لیے محفوظ اور خوشگوار سفر۔", ha: "Tafiya mai aminci da farin ciki ga yara." },
  "Sponsor a child": { ar: "ادعم طفلًا", fr: "Parrainer un enfant", ur: "کسی بچے کی سرپرستی کریں", ha: "Tallafa wa yaro" },
  "Before you begin": { ar: "قبل أن تبدأ", fr: "Avant de commencer", ur: "شروع کرنے سے پہلے", ha: "Kafin ka fara" },
  "Questions, answered.": { ar: "أسئلة وأجوبتها.", fr: "Vos questions, nos réponses.", ur: "سوالات کے جوابات۔", ha: "Tambayoyi da amsoshi." },
  "Anything else? Write to us at": { ar: "هل لديك سؤال آخر؟ راسلنا على", fr: "Autre chose ? Écrivez-nous à", ur: "کچھ اور؟ ہمیں لکھیں:", ha: "Wani abu kuma? Rubuto mana a" },
  "Your first lesson is one click away.": { ar: "درسك الأول على بُعد نقرة واحدة.", fr: "Votre première leçon est à un clic.", ur: "آپ کا پہلا سبق بس ایک کلک دور ہے۔", ha: "Darasinka na farko yana nesa da danna ɗaya." },
  "No long setup, no pressure. Open the app, read today’s wisdom, take a quick quiz, and let the streak begin.": { ar: "لا إعداد طويل ولا ضغط. افتح التطبيق، واقرأ حكمة اليوم، وخُض اختبارًا سريعًا، ولتبدأ سلسلتك.", fr: "Pas de longue configuration, aucune pression. Ouvrez l’application, lisez la sagesse du jour, faites un quiz rapide et lancez votre série.", ur: "نہ لمبی تیاری، نہ دباؤ۔ ایپ کھولیں، آج کی حکمت پڑھیں، ایک فوری کوئز دیں، اور تسلسل شروع کریں۔", ha: "Babu dogon shiri, babu matsi. Buɗe manhajar, karanta hikimar yau, yi gajeren gwaji, sai jerin kwanakinka ya fara." },
  "Is IlmStation free to use?": { ar: "هل IlmStation مجاني؟", fr: "IlmStation est-il gratuit ?", ur: "کیا IlmStation مفت ہے؟", ha: "Shin IlmStation kyauta ne?" },
  "Do I need to know Arabic to start?": { ar: "هل أحتاج إلى معرفة العربية للبدء؟", fr: "Faut-il connaître l’arabe pour commencer ?", ur: "کیا شروع کرنے کے لیے عربی جاننا ضروری ہے؟", ha: "Shin sai na san Larabci kafin na fara?" },
  "No. Everything has English, and the Arabic is there for when you’re ready.": { ar: "لا. كل شيء متوفر بلغتك، والعربية موجودة متى ما كنت مستعدًا.", fr: "Non. Tout est traduit, et l’arabe est là quand vous serez prêt.", ur: "نہیں۔ ہر چیز آپ کی زبان میں ہے، اور عربی تب کے لیے ہے جب آپ تیار ہوں۔", ha: "A’a. Komai yana da fassara, kuma Larabci yana nan lokacin da ka shirya." },
  "What is IlmWorld?": { ar: "ما هو IlmWorld؟", fr: "Qu’est-ce qu’IlmWorld ?", ur: "IlmWorld کیا ہے؟", ha: "Mene ne IlmWorld?" },
  "How does the Ramadan prize quiz work?": { ar: "كيف تعمل مسابقة رمضان؟", fr: "Comment fonctionne le quiz à prix du Ramadan ?", ur: "رمضان انعامی کوئز کیسے کام کرتا ہے؟", ha: "Yaya gasar kyaututtukan Ramadan ke aiki?" },
  "Is it suitable for children?": { ar: "هل هو مناسب للأطفال؟", fr: "Est-ce adapté aux enfants ?", ur: "کیا یہ بچوں کے لیے موزوں ہے؟", ha: "Shin ya dace da yara?" },
  "Yes. IlmStation works fully online on your phone or computer.": { ar: "نعم. يعمل IlmStation بالكامل عبر الإنترنت على هاتفك أو حاسوبك.", fr: "Oui. IlmStation fonctionne entièrement en ligne sur votre téléphone ou ordinateur.", ur: "جی ہاں۔ IlmStation آپ کے فون یا کمپیوٹر پر مکمل آن لائن چلتا ہے۔", ha: "Eh. IlmStation yana aiki kan layi gaba ɗaya a wayarka ko kwamfuta." },
  "How do children join IlmStation?": { ar: "كيف ينضم الأطفال إلى IlmStation؟", fr: "Comment les enfants rejoignent-ils IlmStation ?", ur: "بچے IlmStation میں کیسے شامل ہوتے ہیں؟", ha: "Yaya yara ke shiga IlmStation?" },
  "Is kids mode safe?": { ar: "هل وضع الأطفال آمن؟", fr: "Le mode enfants est-il sûr ?", ur: "کیا بچوں کا موڈ محفوظ ہے؟", ha: "Shin yanayin yara yana da aminci?" },
  "Can my child play on another device?": { ar: "هل يمكن لطفلي اللعب على جهاز آخر؟", fr: "Mon enfant peut-il jouer sur un autre appareil ?", ur: "کیا میرا بچہ کسی اور ڈیوائس پر کھیل سکتا ہے؟", ha: "Shin yarona zai iya yin wasa a wata na’ura?" },
  "Quizzes & daily streaks": { ar: "اختبارات وسلاسل يومية", fr: "Quiz et séries quotidiennes", ur: "کوئز اور روزانہ تسلسل", ha: "Tambayoyi da jerin kwanaki" },
  "Short quizzes on Aqeedah, Hadith, Seerah, Fiqh, Arabic and more, with a streak that rewards showing up every day.": { ar: "اختبارات قصيرة في العقيدة والحديث والسيرة والفقه والعربية وغيرها، مع سلسلة تكافئك على الحضور كل يوم.", fr: "De courts quiz sur l’aqida, le hadith, la sira, le fiqh, l’arabe et plus, avec une série qui récompense votre régularité.", ur: "عقیدہ، حدیث، سیرت، فقہ، عربی اور مزید پر مختصر کوئز، روزانہ آنے پر انعام والے تسلسل کے ساتھ۔", ha: "Gajerun tambayoyi kan Aƙida, Hadisi, Sira, Fiƙhu, Larabci da sauransu, tare da jerin kwanaki da ke ba da lada idan ka zo kowace rana." },
  "Library with audio": { ar: "مكتبة صوتية", fr: "Bibliothèque audio", ur: "آڈیو والی لائبریری", ha: "Laburare mai sauti" },
  "Books and articles that remember your page, plus audiobooks and lecture series chapter by chapter.": { ar: "كتب ومقالات تتذكر صفحتك، مع كتب صوتية وسلاسل محاضرات فصلًا بفصل.", fr: "Des livres et articles qui retiennent votre page, plus des livres audio et des séries de conférences chapitre par chapitre.", ur: "کتابیں اور مضامین جو آپ کا صفحہ یاد رکھتے ہیں، ساتھ ہی آڈیو بکس اور لیکچرز باب بہ باب۔", ha: "Littattafai da makaloli da ke tuna shafinka, da littattafan sauti da laccoci babi-babi." },
  "Memorise at your own pace with revision and gentle daily targets.": { ar: "احفظ بالسرعة التي تناسبك مع المراجعة وأهداف يومية لطيفة.", fr: "Mémorisez à votre rythme avec des révisions et des objectifs quotidiens doux.", ur: "اپنی رفتار سے حفظ کریں، دہرائی اور ہلکے روزانہ اہداف کے ساتھ۔", ha: "Haddace a saurinka tare da bita da ƙananan manufofin yau da kullum." },
  "An ayah, hadith or word of the scholars each day, ready to save, copy or share as a beautiful card.": { ar: "آية أو حديث أو قول للعلماء كل يوم، جاهز للحفظ أو النسخ أو المشاركة كبطاقة جميلة.", fr: "Un verset, un hadith ou une parole des savants chaque jour, à enregistrer, copier ou partager en belle carte.", ur: "ہر روز ایک آیت، حدیث یا علماء کا قول، محفوظ کرنے، کاپی کرنے یا خوبصورت کارڈ کے طور پر شیئر کرنے کے لیے۔", ha: "Aya, hadisi ko maganar malamai kowace rana, a shirye don ajiyewa, kwafa ko rabawa a matsayin kati mai kyau." },
  "Moderated chatrooms": { ar: "غرف محادثة مُشرف عليها", fr: "Salons modérés", ur: "نگرانی والے چیٹ روم", ha: "Dakunan hira masu kulawa" },
  "Topic rooms by age group, with sisters’ and brothers’ circles, kept text-only and respectful.": { ar: "غرف موضوعية حسب الفئة العمرية، مع حلقات للأخوات والإخوة، نصية فقط ومحترمة.", fr: "Des salons par thème et par âge, avec des cercles sœurs et frères, en texte uniquement et respectueux.", ur: "عمر کے لحاظ سے موضوعاتی کمرے، بہنوں اور بھائیوں کے حلقوں کے ساتھ، صرف تحریری اور باادب۔", ha: "Dakuna bisa jigo da rukunin shekaru, da da’irori na ’yan’uwa mata da maza, rubutu kaɗai kuma cikin girmamawa." },
  "Cards for every occasion": { ar: "بطاقات لكل مناسبة", fr: "Des cartes pour chaque occasion", ur: "ہر موقع کے لیے کارڈ", ha: "Katuna don kowane lokaci" },
  "Make Eid, Ramadan, Jumu’ah, nikah, new baby and condolence cards and share them on WhatsApp.": { ar: "اصنع بطاقات العيد ورمضان والجمعة والزواج والمولود والتعزية وشاركها على واتساب.", fr: "Créez des cartes d’Aïd, de Ramadan, de Joumou’a, de mariage, de naissance et de condoléances, et partagez-les sur WhatsApp.", ur: "عید، رمضان، جمعہ، نکاح، نومولود اور تعزیت کے کارڈ بنائیں اور واٹس ایپ پر شیئر کریں۔", ha: "Yi katunan Sallah, Ramadan, Juma’a, aure, sabon jariri da ta’aziyya, ka raba su a WhatsApp." },
  "Join your zone": { ar: "انضم إلى قسمك", fr: "Rejoignez votre espace", ur: "اپنے زون میں شامل ہوں", ha: "Shiga sashenka" },
  "Sign up free and choose your zone: Kids, Teens & Young Adults, or Adult. You only see what’s right for you.": { ar: "سجّل مجانًا واختر قسمك: الأطفال، أو اليافعون والشباب، أو الكبار. لا ترى إلا ما يناسبك.", fr: "Inscrivez-vous gratuitement et choisissez votre espace : Enfants, Ados et jeunes adultes, ou Adultes. Vous ne voyez que ce qui vous convient.", ur: "مفت سائن اپ کریں اور اپنا زون منتخب کریں: بچے، نوجوان، یا بالغ۔ آپ صرف وہی دیکھیں گے جو آپ کے لیے مناسب ہے۔", ha: "Yi rajista kyauta ka zaɓi sashenka: Yara, Matasa, ko Manya. Za ka ga abin da ya dace da kai kawai." },
  "Learn a little, daily": { ar: "تعلّم قليلًا كل يوم", fr: "Apprenez un peu chaque jour", ur: "روزانہ تھوڑا سیکھیں", ha: "Koya kaɗan kowace rana" },
  "A daily wisdom, a quick quiz, a few pages or an audio chapter. Ten focused minutes keeps your streak alive.": { ar: "حكمة يومية، أو اختبار سريع، أو بضع صفحات، أو فصل صوتي. عشر دقائق مركّزة تحافظ على سلسلتك.", fr: "Une sagesse du jour, un quiz rapide, quelques pages ou un chapitre audio. Dix minutes concentrées gardent votre série en vie.", ur: "روزانہ ایک حکمت، فوری کوئز، چند صفحات یا ایک آڈیو باب۔ دس توجہ والے منٹ آپ کا تسلسل برقرار رکھتے ہیں۔", ha: "Hikimar yau, gajeren gwaji, ’yan shafuka ko babin sauti. Mintuna goma na mayar da hankali suna kiyaye jerin kwanakinka." },
  "Grow with company": { ar: "انمُ مع الرفقة", fr: "Grandissez en bonne compagnie", ur: "اچھی صحبت میں بڑھیں", ha: "Girma tare da abokai" },
  "Reflect in moderated chatrooms, discuss books with other readers, and live it out in IlmWorld.": { ar: "تأمّل في غرف محادثة مُشرف عليها، وناقش الكتب مع القرّاء، وطبّق ذلك في IlmWorld.", fr: "Réfléchissez dans des salons modérés, discutez des livres avec d’autres lecteurs et vivez-le dans IlmWorld.", ur: "نگرانی والے چیٹ روم میں غور کریں، دوسرے قارئین سے کتابوں پر بات کریں، اور IlmWorld میں عمل کریں۔", ha: "Yi tunani a dakunan hira masu kulawa, tattauna littattafai da sauran masu karatu, ka aikata hakan a IlmWorld." },
  "Pray at the masjid": { ar: "صلِّ في المسجد", fr: "Priez à la mosquée", ur: "مسجد میں نماز پڑھیں", ha: "Yi sallah a masallaci" },
  "Rent & furnish a home": { ar: "استأجر بيتًا وأثّثه", fr: "Louez et meublez une maison", ur: "گھر کرائے پر لیں اور سجائیں", ha: "Yi hayar gida ka shirya shi" },
  "Run a market stall": { ar: "أدِر كشكًا في السوق", fr: "Tenez un étal au marché", ur: "بازار میں دکان چلائیں", ha: "Gudanar da rumfa a kasuwa" },
  "Race at the arena": { ar: "تسابق في الملعب", fr: "Faites la course à l’arène", ur: "میدان میں دوڑ لگائیں", ha: "Yi tsere a filin wasa" },
  "Hajj & Umrah": { ar: "الحج والعمرة", fr: "Hajj et Omra", ur: "حج اور عمرہ", ha: "Hajji da Umara" },
  "Lectures & quizzes": { ar: "محاضرات واختبارات", fr: "Conférences et quiz", ur: "لیکچرز اور کوئز", ha: "Laccoci da tambayoyi" },
  "Open": { ar: "افتح", fr: "Ouvrir", ur: "کھولیں", ha: "Buɗe" },
  "Try it now": { ar: "جرّبه الآن", fr: "Essayer maintenant", ur: "ابھی آزمائیں", ha: "Gwada yanzu" },
  "Daily checklist": { ar: "قائمة يومية", fr: "Liste quotidienne", ur: "روزانہ چیک لسٹ", ha: "Jerin ayyukan yau" },
  "Fasting, the five prayers, Tarawih, Qur’an, dua and sadaqah, with a streak.": { ar: "الصيام، والصلوات الخمس، والتراويح، والقرآن، والدعاء، والصدقة، مع سلسلة.", fr: "Le jeûne, les cinq prières, les Tarawih, le Coran, les douas et la sadaqa, avec une série.", ur: "روزہ، پانچ نمازیں، تراویح، قرآن، دعا اور صدقہ، تسلسل کے ساتھ۔", ha: "Azumi, salloli biyar, Tarawihi, Alƙur’ani, addu’a da sadaka, tare da jerin kwanaki." },
  "A lesson, a dua and a reminder each day, then the quiz.": { ar: "درس ودعاء وتذكير كل يوم، ثم الاختبار.", fr: "Une leçon, une doua et un rappel chaque jour, puis le quiz.", ur: "ہر روز ایک سبق، ایک دعا اور ایک یاد دہانی، پھر کوئز۔", ha: "Darasi, addu’a da tunatarwa kowace rana, sannan gwaji." },
  "Daily prize quiz": { ar: "مسابقة يومية بجوائز", fr: "Quiz quotidien à prix", ur: "روزانہ انعامی کوئز", ha: "Gasar kyauta ta kowace rana" },
  "First correct entries win. Results after Tarawih, with a live leaderboard.": { ar: "أول الإجابات الصحيحة تفوز. النتائج بعد التراويح، مع لوحة متصدرين مباشرة.", fr: "Les premières bonnes réponses gagnent. Résultats après les Tarawih, avec un classement en direct.", ur: "پہلے درست جوابات جیتتے ہیں۔ نتائج تراویح کے بعد، براہِ راست لیڈر بورڈ کے ساتھ۔", ha: "Amsoshi na farko masu daidai ne ke cin nasara. Sakamako bayan Tarawihi, da teburin gwaraza kai tsaye." },
  "Eid cards": { ar: "بطاقات العيد", fr: "Cartes de l’Aïd", ur: "عید کارڈ", ha: "Katunan Sallah" },
  "Make and share beautiful Eid cards with your family.": { ar: "اصنع بطاقات عيد جميلة وشاركها مع عائلتك.", fr: "Créez et partagez de belles cartes d’Aïd avec votre famille.", ur: "خوبصورت عید کارڈ بنائیں اور اپنے خاندان کے ساتھ شیئر کریں۔", ha: "Yi kyawawan katunan Sallah ka raba wa iyalinka." },
  "Age-appropriate": { ar: "مناسب للعمر", fr: "Adapté à l’âge", ur: "عمر کے مطابق", ha: "Ya dace da shekaru" },
  "Kids only see books, lessons and rooms meant for their age.": { ar: "لا يرى الأطفال إلا الكتب والدروس والغرف المناسبة لأعمارهم.", fr: "Les enfants ne voient que les livres, leçons et salons adaptés à leur âge.", ur: "بچے صرف اپنی عمر کی کتابیں، اسباق اور کمرے دیکھتے ہیں۔", ha: "Yara suna ganin littattafai, darussa da dakunan da suka dace da shekarunsu kawai." },
  "Moderated rooms": { ar: "غرف مُشرف عليها", fr: "Salons modérés", ur: "نگرانی والے کمرے", ha: "Dakuna masu kulawa" },
  "Kids rooms are run by our team, and anything can be reported.": { ar: "يدير فريقنا غرف الأطفال، ويمكن الإبلاغ عن أي شيء.", fr: "Les salons enfants sont gérés par notre équipe, et tout peut être signalé.", ur: "بچوں کے کمرے ہماری ٹیم چلاتی ہے، اور کسی بھی چیز کی اطلاع دی جا سکتی ہے۔", ha: "Ƙungiyarmu ce ke gudanar da dakunan yara, kuma ana iya kai rahoton komai." },
  "Learning that’s fun": { ar: "تعلّم ممتع", fr: "Apprendre en s’amusant", ur: "مزے دار سیکھنا", ha: "Koyo mai daɗi" },
  "Quizzes, streaks and points built for short attention spans.": { ar: "اختبارات وسلاسل ونقاط مصمّمة لفترات انتباه قصيرة.", fr: "Des quiz, des séries et des points pensés pour une attention courte.", ur: "مختصر توجہ کے لیے بنائے گئے کوئز، تسلسل اور پوائنٹس۔", ha: "Tambayoyi, jerin kwanaki da maki da aka tsara don ’yan mintuna na hankali." },
  "Progress you can see": { ar: "تقدّم يمكنك رؤيته", fr: "Des progrès visibles", ur: "نظر آنے والی پیش رفت", ha: "Ci gaba da za ka iya gani" },
  "Points, streaks and finished books show how they’re growing.": { ar: "النقاط والسلاسل والكتب المنتهية تُظهر كيف ينمون.", fr: "Points, séries et livres terminés montrent leur progression.", ur: "پوائنٹس، تسلسل اور ختم شدہ کتابیں ان کی ترقی دکھاتی ہیں۔", ha: "Maki, jerin kwanaki da littattafan da aka gama suna nuna yadda suke girma." },
  "Welcome back": { ar: "مرحبًا بعودتك", fr: "Bon retour", ur: "خوش آمدید", ha: "Barka da dawowa" },
  "Your streak, badges and Hifz plan are waiting where you left them.": { ar: "سلسلتك وشاراتك وخطة حفظك بانتظارك حيث تركتها.", fr: "Votre série, vos badges et votre plan de hifz vous attendent là où vous les avez laissés.", ur: "آپ کا تسلسل، بیجز اور حفظ کا منصوبہ وہیں منتظر ہیں جہاں آپ نے چھوڑا تھا۔", ha: "Jerin kwanakinka, lambobin yabo da tsarin haddarka suna jiranka inda ka bar su." },
  "New to IlmStation?": { ar: "جديد في IlmStation؟", fr: "Nouveau sur IlmStation ?", ur: "IlmStation پر نئے ہیں؟", ha: "Sabo a IlmStation?" },
  "A few small steps, then your first quest.": { ar: "خطوات قليلة، ثم مهمتك الأولى.", fr: "Quelques petites étapes, puis votre première quête.", ur: "چند چھوٹے قدم، پھر آپ کی پہلی مہم۔", ha: "’Yan ƙananan matakai, sannan aikinka na farko." },
  "Enter your email, or your username if a parent made your account.": { ar: "أدخل بريدك الإلكتروني، أو اسم المستخدم إن كان أحد والديك أنشأ حسابك.", fr: "Saisissez votre e-mail, ou votre nom d’utilisateur si un parent a créé votre compte.", ur: "اپنا ای میل درج کریں، یا یوزر نیم اگر والدین نے آپ کا اکاؤنٹ بنایا ہے۔", ha: "Shigar da imel ɗinka, ko sunan mai amfani idan iyaye ne suka buɗe maka asusu." },
  "Enter your password.": { ar: "أدخل كلمة المرور.", fr: "Saisissez votre mot de passe.", ur: "اپنا پاس ورڈ درج کریں۔", ha: "Shigar da kalmar sirrinka." },
  "Your password": { ar: "كلمة المرور", fr: "Votre mot de passe", ur: "آپ کا پاس ورڈ", ha: "Kalmar sirrinka" },
  "Logging in…": { ar: "جارٍ تسجيل الدخول…", fr: "Connexion…", ur: "لاگ ان ہو رہا ہے…", ha: "Ana shiga…" },
  "Show password": { ar: "إظهار كلمة المرور", fr: "Afficher le mot de passe", ur: "پاس ورڈ دکھائیں", ha: "Nuna kalmar sirri" },
  "Hide password": { ar: "إخفاء كلمة المرور", fr: "Masquer le mot de passe", ur: "پاس ورڈ چھپائیں", ha: "Ɓoye kalmar sirri" },
  "Choose a language": { ar: "اختر لغة", fr: "Choisissez une langue", ur: "زبان منتخب کریں", ha: "Zaɓi harshe" },
  "You can change this any time from the site header.": { ar: "يمكنك تغييرها في أي وقت من أعلى الموقع.", fr: "Vous pouvez la changer à tout moment depuis l’en-tête.", ur: "آپ اسے کسی بھی وقت سائٹ کے اوپر سے بدل سکتے ہیں۔", ha: "Za ka iya canza shi a kowane lokaci daga saman shafin." },
  "Tell us who you are and where to reach you.": { ar: "أخبرنا من أنت وكيف نتواصل معك.", fr: "Dites-nous qui vous êtes et comment vous joindre.", ur: "ہمیں بتائیں آپ کون ہیں اور آپ سے کیسے رابطہ کریں۔", ha: "Faɗa mana kai wane ne da yadda za mu same ka." },
  "Set a password": { ar: "عيّن كلمة مرور", fr: "Choisissez un mot de passe", ur: "پاس ورڈ بنائیں", ha: "Saita kalmar sirri" },
  "One strong password and you’re in.": { ar: "كلمة مرور قوية واحدة وتدخل.", fr: "Un mot de passe solide et c’est parti.", ur: "ایک مضبوط پاس ورڈ اور آپ اندر۔", ha: "Kalmar sirri ɗaya mai ƙarfi, sai ka shiga." },
  "A little about you": { ar: "قليل عنك", fr: "Un peu sur vous", ur: "آپ کے بارے میں تھوڑا", ha: "Kaɗan game da kai" },
  "This places you in the right learning zone.": { ar: "هذا يضعك في قسم التعلّم المناسب.", fr: "Cela vous place dans le bon espace d’apprentissage.", ur: "اس سے آپ درست زون میں آتے ہیں۔", ha: "Wannan zai sa ka a sashen koyo da ya dace." },
  "Your interests": { ar: "اهتماماتك", fr: "Vos centres d’intérêt", ur: "آپ کی دلچسپیاں", ha: "Abubuwan da kake so" },
  "Pick your favourite topics — choose at least 3.": { ar: "اختر مواضيعك المفضلة، 3 على الأقل.", fr: "Choisissez vos sujets préférés, au moins 3.", ur: "اپنے پسندیدہ موضوعات چنیں، کم از کم 3۔", ha: "Zaɓi batutuwan da kake so, aƙalla 3." },
  "Quick knowledge check": { ar: "اختبار معرفة سريع", fr: "Petit test de connaissances", ur: "فوری معلوماتی جانچ", ha: "Gajeren gwajin ilimi" },
  "Optional: 5 questions to set your starting level. No pressure.": { ar: "اختياري: 5 أسئلة لتحديد مستواك الأولي. بلا ضغط.", fr: "Facultatif : 5 questions pour fixer votre niveau de départ. Sans pression.", ur: "اختیاری: آپ کی ابتدائی سطح کے لیے 5 سوالات۔ کوئی دباؤ نہیں۔", ha: "Na zaɓi: tambayoyi 5 don sanin matakin farkonka. Babu matsi." },
  "Enter your full name.": { ar: "أدخل اسمك الكامل.", fr: "Saisissez votre nom complet.", ur: "اپنا پورا نام درج کریں۔", ha: "Shigar da cikakken sunanka." },
  "Enter a valid email, like name@example.com.": { ar: "أدخل بريدًا صحيحًا مثل name@example.com.", fr: "Saisissez un e-mail valide, comme name@example.com.", ur: "درست ای میل درج کریں، جیسے name@example.com۔", ha: "Shigar da imel ingantacce, kamar name@example.com." },
  "Username": { ar: "اسم المستخدم", fr: "Nom d’utilisateur", ur: "یوزر نیم", ha: "Sunan mai amfani" },
  "Create a password": { ar: "أنشئ كلمة مرور", fr: "Créez un mot de passe", ur: "پاس ورڈ بنائیں", ha: "Ƙirƙiri kalmar sirri" },
  "Confirm password": { ar: "تأكيد كلمة المرور", fr: "Confirmez le mot de passe", ur: "پاس ورڈ کی تصدیق کریں", ha: "Tabbatar da kalmar sirri" },
  "The passwords don’t match yet.": { ar: "كلمتا المرور غير متطابقتين بعد.", fr: "Les mots de passe ne correspondent pas encore.", ur: "پاس ورڈ ابھی میل نہیں کھاتے۔", ha: "Kalmomin sirrin ba su yi daidai ba tukuna." },
  "Age group": { ar: "الفئة العمرية", fr: "Tranche d’âge", ur: "عمر کا گروپ", ha: "Rukunin shekaru" },
  "Your age group": { ar: "فئتك العمرية", fr: "Votre tranche d’âge", ur: "آپ کی عمر کا گروپ", ha: "Rukunin shekarunka" },
  "Gender": { ar: "الجنس", fr: "Genre", ur: "جنس", ha: "Jinsi" },
  "Choose one to continue.": { ar: "اختر واحدًا للمتابعة.", fr: "Choisissez-en un pour continuer.", ur: "جاری رکھنے کے لیے ایک چنیں۔", ha: "Zaɓi ɗaya don ci gaba." },
  "Choose your age group to continue.": { ar: "اختر فئتك العمرية للمتابعة.", fr: "Choisissez votre tranche d’âge pour continuer.", ur: "جاری رکھنے کے لیے اپنی عمر کا گروپ چنیں۔", ha: "Zaɓi rukunin shekarunka don ci gaba." },
  "Under 13?": { ar: "أقل من 13 سنة؟", fr: "Moins de 13 ans ?", ur: "13 سال سے کم؟", ha: "Ƙasa da shekara 13?" },
  "Creating account…": { ar: "جارٍ إنشاء الحساب…", fr: "Création du compte…", ur: "اکاؤنٹ بن رہا ہے…", ha: "Ana buɗe asusu…" },
  "Kids Zone": { ar: "قسم الأطفال", fr: "Espace Enfants", ur: "بچوں کا زون", ha: "Sashen Yara" },
  "Teens & Young Adults Zone": { ar: "قسم اليافعين والشباب", fr: "Espace Ados et jeunes adultes", ur: "نوجوانوں کا زون", ha: "Sashen Matasa" },
  "Adult Zone": { ar: "قسم الكبار", fr: "Espace Adultes", ur: "بالغوں کا زون", ha: "Sashen Manya" },
  "Guided quests for teens and young adults — Qur’an, Seerah and everyday fiqh at a steady pace.": { ar: "مهام موجّهة لليافعين والشباب: القرآن والسيرة وفقه الحياة اليومية بخطى ثابتة.", fr: "Des quêtes guidées pour ados et jeunes adultes : Coran, sira et fiqh du quotidien, à un rythme régulier.", ur: "نوجوانوں کے لیے رہنمائی والی مہمات: قرآن، سیرت اور روزمرہ فقہ، مستحکم رفتار سے۔", ha: "Ayyuka masu jagora ga matasa: Alƙur’ani, Sira da fiƙhun yau da kullum a hankali." },
  "Deep dives into Islamic knowledge — Fiqh, Aqeedah, Seerah and more.": { ar: "تعمّق في العلوم الإسلامية: الفقه والعقيدة والسيرة وغيرها.", fr: "Approfondissez le savoir islamique : fiqh, aqida, sira et plus.", ur: "اسلامی علوم میں گہرائی: فقہ، عقیدہ، سیرت اور مزید۔", ha: "Zurfafa cikin ilimin Musulunci: Fiƙhu, Aƙida, Sira da sauransu." },
  "By creating an account, you agree to our": { ar: "بإنشاء حساب، فإنك توافق على", fr: "En créant un compte, vous acceptez nos", ur: "اکاؤنٹ بنا کر، آپ ہماری ان سے متفق ہیں:", ha: "Ta buɗe asusu, ka amince da" },
  "Log in instead": { ar: "سجّل الدخول بدلًا من ذلك", fr: "Se connecter plutôt", ur: "اس کے بجائے لاگ ان کریں", ha: "Shiga maimakon haka" },
  "An account with this email already exists.": { ar: "يوجد حساب بهذا البريد بالفعل.", fr: "Un compte existe déjà avec cet e-mail.", ur: "اس ای میل کے ساتھ اکاؤنٹ پہلے سے موجود ہے۔", ha: "Akwai asusu da wannan imel ɗin tuni." },
  "Go Premium": { ar: "اشترك في بريميوم", fr: "Passer à Premium", ur: "پریمیم لیں", ha: "Shiga Premium" },
  "Profile": { ar: "الملف الشخصي", fr: "Profil", ur: "پروفائل", ha: "Bayanan kai" },
  "Friends": { ar: "الأصدقاء", fr: "Amis", ur: "دوست", ha: "Abokai" },
  "Achievements": { ar: "الإنجازات", fr: "Réussites", ur: "کامیابیاں", ha: "Nasarori" },
  "Wallet": { ar: "المحفظة", fr: "Portefeuille", ur: "والٹ", ha: "Jaka" },
  "Use points": { ar: "استخدم النقاط", fr: "Utiliser les points", ur: "پوائنٹس استعمال کریں", ha: "Yi amfani da maki" },
  "Notifications": { ar: "الإشعارات", fr: "Notifications", ur: "اطلاعات", ha: "Sanarwa" },
  "Rewards": { ar: "المكافآت", fr: "Récompenses", ur: "انعامات", ha: "Lada" },
  "Streak": { ar: "السلسلة", fr: "Série", ur: "تسلسل", ha: "Jerin kwanaki" },
  "Badges": { ar: "الشارات", fr: "Badges", ur: "بیجز", ha: "Lambobin yabo" },
  "Points": { ar: "النقاط", fr: "Points", ur: "پوائنٹس", ha: "Maki" },
  "Balance": { ar: "الرصيد", fr: "Solde", ur: "بیلنس", ha: "Ma’auni" },
  "Test yourself": { ar: "اختبر نفسك", fr: "Testez-vous", ur: "خود کو آزمائیں", ha: "Gwada kanka" },
  "Choose a topic": { ar: "اختر موضوعًا", fr: "Choisissez un sujet", ur: "موضوع منتخب کریں", ha: "Zaɓi jigo" },
  "Play now": { ar: "العب الآن", fr: "Jouer maintenant", ur: "ابھی کھیلیں", ha: "Yi wasa yanzu" },
  "New": { ar: "جديد", fr: "Nouveau", ur: "نیا", ha: "Sabo" },
  "Start quiz": { ar: "ابدأ الاختبار", fr: "Commencer le quiz", ur: "کوئز شروع کریں", ha: "Fara gwaji" },
  "Next question": { ar: "السؤال التالي", fr: "Question suivante", ur: "اگلا سوال", ha: "Tambaya ta gaba" },
  "See results": { ar: "عرض النتائج", fr: "Voir les résultats", ur: "نتائج دیکھیں", ha: "Duba sakamako" },
  "Score": { ar: "النتيجة", fr: "Score", ur: "اسکور", ha: "Maki" },
  "XP earned": { ar: "النقاط المكتسبة", fr: "XP gagnés", ur: "حاصل کردہ XP", ha: "XP da aka samu" },
  "Accuracy": { ar: "الدقة", fr: "Précision", ur: "درستی", ha: "Daidaito" },
  "Play again": { ar: "العب مجددًا", fr: "Rejouer", ur: "دوبارہ کھیلیں", ha: "Sake wasa" },
  "Challenge a friend": { ar: "تحدَّ صديقًا", fr: "Défier un ami", ur: "دوست کو چیلنج کریں", ha: "Ƙalubalanci aboki" },
  "Fresh quizzes and interactive games from the IlmStation team.": { ar: "اختبارات جديدة وألعاب تفاعلية من فريق IlmStation.", fr: "De nouveaux quiz et jeux interactifs de l’équipe IlmStation.", ur: "IlmStation ٹیم کی طرف سے نئے کوئز اور انٹرایکٹو کھیل۔", ha: "Sababbin tambayoyi da wasanni daga ƙungiyar IlmStation." },
  "Aqeedah, Hadith, Seerah, Fiqh, Arabic, Qur’an and more. Short quizzes, XP for every right answer, and challenges with friends.": { ar: "العقيدة والحديث والسيرة والفقه والعربية والقرآن وغيرها. اختبارات قصيرة، ونقاط لكل إجابة صحيحة، وتحديات مع الأصدقاء.", fr: "Aqida, hadith, sira, fiqh, arabe, Coran et plus. De courts quiz, des XP pour chaque bonne réponse et des défis entre amis.", ur: "عقیدہ، حدیث، سیرت، فقہ، عربی، قرآن اور مزید۔ مختصر کوئز، ہر درست جواب پر XP، اور دوستوں سے مقابلے۔", ha: "Aƙida, Hadisi, Sira, Fiƙhu, Larabci, Alƙur’ani da sauransu. Gajerun tambayoyi, XP kan kowace amsa daidai, da ƙalubale da abokai." },
  "What would you like to do today?": { ar: "ماذا تريد أن تفعل اليوم؟", fr: "Que veux-tu faire aujourd’hui ?", ur: "آج آپ کیا کرنا چاہیں گے؟", ha: "Me kake so ka yi yau?" },
  "Fun quizzes · earn stars": { ar: "اختبارات ممتعة · اجمع النجوم", fr: "Quiz amusants · gagne des étoiles", ur: "مزے دار کوئز · ستارے جیتیں", ha: "Tambayoyi masu daɗi · samu taurari" },
  "Your lessons": { ar: "دروسك", fr: "Tes leçons", ur: "آپ کے اسباق", ha: "Darussanka" },
  "Games & quizzes": { ar: "ألعاب واختبارات", fr: "Jeux et quiz", ur: "کھیل اور کوئز", ha: "Wasanni da tambayoyi" },
  "Masha’Allah!": { ar: "ما شاء الله!", fr: "Masha’Allah !", ur: "ماشاءاللہ!", ha: "Masha’Allah!" },
  "Time’s up for today": { ar: "انتهى الوقت لهذا اليوم", fr: "Le temps est écoulé pour aujourd’hui", ur: "آج کا وقت ختم", ha: "Lokacin yau ya ƙare" },
  "Get Premium for more time": { ar: "اشترك في بريميوم لمزيد من الوقت", fr: "Passez à Premium pour plus de temps", ur: "مزید وقت کے لیے پریمیم لیں", ha: "Shiga Premium don ƙarin lokaci" },
  "Download card": { ar: "تنزيل البطاقة", fr: "Télécharger la carte", ur: "کارڈ ڈاؤن لوڈ کریں", ha: "Sauke kati" },
  "Read Surah Al-Kahf today": { ar: "اقرأ سورة الكهف اليوم", fr: "Lisez la sourate Al-Kahf aujourd’hui", ur: "آج سورۃ الکہف پڑھیں", ha: "Karanta Suratul Kahfi yau" },
  "Read Al-Kahf": { ar: "اقرأ الكهف", fr: "Lire Al-Kahf", ur: "الکہف پڑھیں", ha: "Karanta Kahfi" },
  "Browse the library": { ar: "تصفّح المكتبة", fr: "Parcourir la bibliothèque", ur: "لائبریری دیکھیں", ha: "Duba laburare" },
  "Saved": { ar: "تم الحفظ", fr: "Enregistré", ur: "محفوظ ہو گیا", ha: "An ajiye" },
  "Copied": { ar: "تم النسخ", fr: "Copié", ur: "کاپی ہو گیا", ha: "An kwafa" },
  "Log in to save wisdom.": { ar: "سجّل الدخول لحفظ الحكمة.", fr: "Connectez-vous pour enregistrer la sagesse.", ur: "حکمت محفوظ کرنے کے لیے لاگ ان کریں۔", ha: "Shiga don ajiye hikima." },
  "Reciter": { ar: "القارئ", fr: "Récitateur", ur: "قاری", ha: "Mai karatu" },
  "Calculation": { ar: "طريقة الحساب", fr: "Méthode de calcul", ur: "حساب کا طریقہ", ha: "Hanyar lissafi" },
  "You’re on the free plan": { ar: "أنت على الخطة المجانية", fr: "Vous êtes sur l’offre gratuite", ur: "آپ مفت پلان پر ہیں", ha: "Kana kan tsarin kyauta" },
  "Premium is active": { ar: "بريميوم مفعّل", fr: "Premium est actif", ur: "پریمیم فعال ہے", ha: "Premium yana aiki" },
  "Custom pricing": { ar: "تسعير مخصص", fr: "Tarif sur mesure", ur: "خصوصی قیمت", ha: "Farashi na musamman" },
  "Get it": { ar: "احصل عليه", fr: "L’obtenir", ur: "حاصل کریں", ha: "Samu" },
  "All time": { ar: "كل الأوقات", fr: "Depuis toujours", ur: "ہمیشہ", ha: "Duk lokaci" },
  "Among friends": { ar: "بين الأصدقاء", fr: "Entre amis", ur: "دوستوں میں", ha: "Tsakanin abokai" },
  "Global": { ar: "عالمي", fr: "Mondial", ur: "عالمی", ha: "Duniya" },
  "Find friends": { ar: "ابحث عن أصدقاء", fr: "Trouver des amis", ur: "دوست تلاش کریں", ha: "Nemo abokai" },
  "Requests": { ar: "الطلبات", fr: "Demandes", ur: "درخواستیں", ha: "Buƙatu" },
  "Learning record": { ar: "سجل التعلّم", fr: "Parcours d’apprentissage", ur: "سیکھنے کا ریکارڈ", ha: "Rikodin koyo" },
  "Your progress": { ar: "تقدّمك", fr: "Votre progression", ur: "آپ کی پیش رفت", ha: "Ci gabanka" },
  "Topic performance": { ar: "الأداء حسب الموضوع", fr: "Résultats par sujet", ur: "موضوع کے لحاظ سے کارکردگی", ha: "Yadda kake a kowane jigo" },
  "How to earn": { ar: "كيف تكسب", fr: "Comment gagner", ur: "کیسے کمائیں", ha: "Yadda ake samu" },
  "From new levels": { ar: "من المستويات الجديدة", fr: "Des nouveaux niveaux", ur: "نئے لیولز سے", ha: "Daga sababbin matakai" },
  "Ask IlmBot": { ar: "اسأل IlmBot", fr: "Demander à IlmBot", ur: "IlmBot سے پوچھیں", ha: "Tambayi IlmBot" },
  "Not a fatwa service": { ar: "ليست خدمة فتوى", fr: "Pas un service de fatwa", ur: "فتویٰ سروس نہیں", ha: "Ba sabis na fatawa ba" },
  "Ask a learning question…": { ar: "اطرح سؤالًا تعليميًا…", fr: "Posez une question…", ur: "سیکھنے کا سوال پوچھیں…", ha: "Yi tambayar koyo…" },
  "Open navigation": { ar: "فتح القائمة", fr: "Ouvrir le menu", ur: "مینو کھولیں", ha: "Buɗe menu" },
  "Toggle navigation": { ar: "القائمة", fr: "Menu", ur: "مینو", ha: "Menu" },
  "Arabic": { ar: "العربية", fr: "Arabe", ur: "عربی", ha: "Larabci" },
  "Aqeedah": { ar: "العقيدة", fr: "Aqida", ur: "عقیدہ", ha: "Aƙida" },
  "Hadith": { ar: "الحديث", fr: "Hadith", ur: "حدیث", ha: "Hadisi" },
  "Seerah": { ar: "السيرة", fr: "Sira", ur: "سیرت", ha: "Sira" },
  "Fiqh": { ar: "الفقه", fr: "Fiqh", ur: "فقہ", ha: "Fiƙhu" },
  "Tafsir": { ar: "التفسير", fr: "Tafsir", ur: "تفسیر", ha: "Tafsiri" },
  "Dua": { ar: "الدعاء", fr: "Douas", ur: "دعا", ha: "Addu’a" },
  "{n}% read": { ar: "قُرئ {n}%", fr: "{n}% lu", ur: "{n}% پڑھا گیا", ha: "An karanta {n}%" },
  "DAYS TO RAMADAN": { ar: "يومًا على رمضان", fr: "JOURS AVANT LE RAMADAN", ur: "دن رمضان تک", ha: "KWANAKI ZUWA RAMADAN" },
  "days to ramadan": { ar: "يومًا على رمضان", fr: "jours avant le Ramadan", ur: "دن رمضان تک", ha: "kwanaki zuwa Ramadan" },
  "Days to Ramadan!": { ar: "يومًا على رمضان!", fr: "jours avant le Ramadan !", ur: "دن رمضان تک!", ha: "Kwanaki zuwa Ramadan!" },
  "{n} days to Ramadan": { ar: "{n} يومًا على رمضان", fr: "{n} jours avant le Ramadan", ur: "رمضان تک {n} دن", ha: "Kwanaki {n} zuwa Ramadan" },
  "{n} days": { ar: "{n} يومًا", fr: "{n} jours", ur: "{n} دن", ha: "Kwanaki {n}" },
  "{n} XP": { ar: "{n} نقطة خبرة", fr: "{n} XP", ur: "{n} XP", ha: "XP {n}" },
  "{n}-day streak": { ar: "سلسلة {n} أيام", fr: "Série de {n} jours", ur: "{n} دن کا تسلسل", ha: "Jerin kwanaki {n}" },
  // prayer card, leaderboard
  "Change city": { ar: "تغيير المدينة", fr: "Changer de ville", ur: "شہر تبدیل کریں", ha: "Canza gari" },
  "Your country’s usual method (default)": { ar: "الطريقة المعتادة في بلدك (افتراضي)", fr: "Méthode habituelle de votre pays (par défaut)", ur: "آپ کے ملک کا معمول کا طریقہ (ڈیفالٹ)", ha: "Hanyar da aka saba a ƙasarka (asali)" },
  "Muslim World League": { ar: "رابطة العالم الإسلامي", fr: "Ligue islamique mondiale", ur: "مسلم ورلڈ لیگ", ha: "Ƙungiyar Musulmi ta Duniya" },
  "Egyptian General Authority": { ar: "الهيئة المصرية العامة للمساحة", fr: "Autorité générale égyptienne", ur: "مصری جنرل اتھارٹی", ha: "Hukumar Masar" },
  "Moonsighting Committee": { ar: "لجنة رؤية الهلال", fr: "Comité d’observation du croissant", ur: "رویتِ ہلال کمیٹی", ha: "Kwamitin ganin wata" },
  "Umm al-Qura, Makkah": { ar: "أم القرى، مكة", fr: "Umm al-Qura, La Mecque", ur: "ام القریٰ، مکہ", ha: "Ummul Qura, Makka" },
  "Auto": { ar: "تلقائي", fr: "Auto", ur: "خودکار", ha: "Kai tsaye" },
  "Adhan 🔔": { ar: "الأذان 🔔", fr: "Adhan 🔔", ur: "اذان 🔔", ha: "Kiran sallah 🔔" },
  "🔔 Adhan": { ar: "🔔 الأذان", fr: "🔔 Adhan", ur: "🔔 اذان", ha: "🔔 Kiran sallah" },
  "12h": { ar: "12 ساعة", fr: "12 h", ur: "12 گھنٹے", ha: "Awa 12" },
  "24h": { ar: "24 ساعة", fr: "24 h", ur: "24 گھنٹے", ha: "Awa 24" },
  "in": { ar: "بعد", fr: "dans", ur: "میں", ha: "nan da" },
  "{n}h {n}m": { ar: "{n} س {n} د", fr: "{n} h {n} min", ur: "{n} گھنٹے {n} منٹ", ha: "awa {n} minti {n}" },
  "in {n}h {n}m": { ar: "بعد {n} س {n} د", fr: "dans {n} h {n} min", ur: "{n} گھنٹے {n} منٹ میں", ha: "nan da awa {n} minti {n}" },
  "{n}m": { ar: "{n} د", fr: "{n} min", ur: "{n} منٹ", ha: "minti {n}" },
  "in {n}m": { ar: "بعد {n} د", fr: "dans {n} min", ur: "{n} منٹ میں", ha: "nan da minti {n}" },
  "{n}:{n} AM": { ar: "{n}:{n} ص", fr: "{n}:{n} AM", ur: "{n}:{n} صبح", ha: "{n}:{n} na safe" },
  "{n}:{n} PM": { ar: "{n}:{n} م", fr: "{n}:{n} PM", ur: "{n}:{n} شام", ha: "{n}:{n} na yamma" },
  "Today’s prayer times": { ar: "مواقيت الصلاة اليوم", fr: "Heures de prière du jour", ur: "آج کے اوقاتِ نماز", ha: "Lokutan sallar yau" },
  "Use my location": { ar: "استخدم موقعي", fr: "Utiliser ma position", ur: "میرا مقام استعمال کریں", ha: "Yi amfani da wurina" },
  "Search a city…": { ar: "ابحث عن مدينة…", fr: "Rechercher une ville…", ur: "شہر تلاش کریں…", ha: "Nemo gari…" },
  "TODAY": { ar: "اليوم", fr: "AUJOURD’HUI", ur: "آج", ha: "YAU" },
  "Newcomer": { ar: "مبتدئ", fr: "Débutant", ur: "نووارد", ha: "Sabon shiga" },
  "Seeker": { ar: "طالب", fr: "Chercheur", ur: "طالب", ha: "Mai nema" },
  "Learner": { ar: "متعلّم", fr: "Apprenant", ur: "متعلم", ha: "Ɗalibi" },
  "Student": { ar: "تلميذ", fr: "Étudiant", ur: "شاگرد", ha: "Ɗalibi" },
  "Scholar": { ar: "عالِم", fr: "Savant", ur: "عالم", ha: "Malami" },
  "Guardian": { ar: "حارس", fr: "Gardien", ur: "نگہبان", ha: "Mai tsaro" },
  "Explorer": { ar: "مستكشف", fr: "Explorateur", ur: "متلاشی", ha: "Mai bincike" },
  "Hafiz": { ar: "حافظ", fr: "Hafiz", ur: "حافظ", ha: "Hafizi" },
  "Teacher": { ar: "معلّم", fr: "Enseignant", ur: "استاد", ha: "Malami" },
  // website, signup, app

  // notifications
  "🌅 Daily Wisdom": { ar: "🌅 حكمة اليوم", fr: "🌅 Sagesse du jour", ur: "🌅 آج کی حکمت", ha: "🌅 Hikimar yau" },
  "🕌 Prayer times": { ar: "🕌 مواقيت الصلاة", fr: "🕌 Heures de prière", ur: "🕌 اوقاتِ نماز", ha: "🕌 Lokutan sallah" },
  "Daily tilawah": { ar: "التلاوة اليومية", fr: "Lecture quotidienne", ur: "روزانہ تلاوت", ha: "Tilawar yau da kullum" },
  "📖 Daily tilawah": { ar: "📖 التلاوة اليومية", fr: "📖 Lecture quotidienne", ur: "📖 روزانہ تلاوت", ha: "📖 Tilawar yau da kullum" },
  "Streak reminder": { ar: "تذكير السلسلة", fr: "Rappel de série", ur: "تسلسل کی یاد دہانی", ha: "Tunatarwar jerin kwanaki" },
  "🔥 Streak reminder": { ar: "🔥 تذكير السلسلة", fr: "🔥 Rappel de série", ur: "🔥 تسلسل کی یاد دہانی", ha: "🔥 Tunatarwar jerin kwanaki" },
  "Friday Al-Kahf": { ar: "الكهف يوم الجمعة", fr: "Al-Kahf du vendredi", ur: "جمعہ کو الکہف", ha: "Kahfi ranar Juma’a" },
  "📖 Friday Al-Kahf": { ar: "📖 الكهف يوم الجمعة", fr: "📖 Al-Kahf du vendredi", ur: "📖 جمعہ کو الکہف", ha: "📖 Kahfi ranar Juma’a" },
  "Ramadan prize quiz": { ar: "مسابقة رمضان", fr: "Quiz à prix du Ramadan", ur: "رمضان انعامی کوئز", ha: "Gasar kyaututtukan Ramadan" },
  "🏆 Ramadan prize quiz": { ar: "🏆 مسابقة رمضان", fr: "🏆 Quiz à prix du Ramadan", ur: "🏆 رمضان انعامی کوئز", ha: "🏆 Gasar kyaututtukan Ramadan" },
  "Every morning at {n}:{n}": { ar: "كل صباح الساعة {n}:{n}", fr: "Chaque matin à {n}:{n}", ur: "ہر صبح {n}:{n} بجے", ha: "Kowace safiya da {n}:{n}" },
  "At each of the five prayers": { ar: "عند كل صلاة من الصلوات الخمس", fr: "À chacune des cinq prières", ur: "پانچوں نمازوں کے وقت", ha: "A kowace sallah cikin biyar" },
  "At the time you choose below": { ar: "في الوقت الذي تختاره أدناه", fr: "À l’heure choisie ci-dessous", ur: "نیچے منتخب کردہ وقت پر", ha: "A lokacin da ka zaɓa a ƙasa" },
  "In the evening, if you haven't learned yet": { ar: "في المساء، إن لم تتعلّم بعد", fr: "Le soir, si vous n’avez pas encore appris", ur: "شام کو، اگر آپ نے ابھی تک نہیں سیکھا", ha: "Da yamma, idan baka yi karatu ba tukuna" },
  "Friday morning": { ar: "صباح الجمعة", fr: "Le vendredi matin", ur: "جمعہ کی صبح", ha: "Safiyar Juma’a" },
  "When each day's quiz opens": { ar: "عند فتح مسابقة كل يوم", fr: "À l’ouverture du quiz de chaque jour", ur: "جب ہر دن کا کوئز کھلے", ha: "Idan gasar kowace rana ta buɗe" },
  "Tilawah time": { ar: "وقت التلاوة", fr: "Heure de lecture", ur: "تلاوت کا وقت", ha: "Lokacin tilawa" },
  "Update device and location": { ar: "تحديث الجهاز والموقع", fr: "Mettre à jour l’appareil et la position", ur: "ڈیوائس اور مقام اپ ڈیٹ کریں", ha: "Sabunta na’ura da wuri" },
  "Notifications are on": { ar: "الإشعارات مفعّلة", fr: "Les notifications sont activées", ur: "اطلاعات آن ہیں", ha: "Sanarwa a kunne take" },
  "Notifications are off": { ar: "الإشعارات متوقفة", fr: "Les notifications sont désactivées", ur: "اطلاعات بند ہیں", ha: "Sanarwa a kashe take" },
  "Sun": { ar: "الأحد", fr: "Dim", ur: "اتوار", ha: "Lah" },
  "Mon": { ar: "الإثنين", fr: "Lun", ur: "پیر", ha: "Lit" },
  "Tue": { ar: "الثلاثاء", fr: "Mar", ur: "منگل", ha: "Tal" },
  "Wed": { ar: "الأربعاء", fr: "Mer", ur: "بدھ", ha: "Lar" },
  "Thu": { ar: "الخميس", fr: "Jeu", ur: "جمعرات", ha: "Alh" },
  "Fri": { ar: "الجمعة", fr: "Ven", ur: "جمعہ", ha: "Jum" },
  "Sat": { ar: "السبت", fr: "Sam", ur: "ہفتہ", ha: "Asa" },
};

/** Indonesian (id) and Filipino (tl). Merged into DICT. */
const EXTRA_ID_TL: Record<string, { id: string; tl: string }> = {
  "Today": { id: "Hari ini", tl: "Ngayon" },
  "Play": { id: "Main", tl: "Maglaro" },
  "Quests": { id: "Misi", tl: "Mga Misyon" },
  "Progress": { id: "Kemajuan", tl: "Progreso" },
  "You": { id: "Anda", tl: "Ikaw" },
  "Home": { id: "Beranda", tl: "Home" },
  "Study": { id: "Belajar", tl: "Mag-aral" },
  "Challenge": { id: "Tantangan", tl: "Hamon" },
  "Quran": { id: "Al-Qur’an", tl: "Qur’an" },
  "Qur’an": { id: "Al-Qur’an", tl: "Qur’an" },
  "Halaqah": { id: "Halaqah", tl: "Halaqah" },
  "Chatrooms": { id: "Ruang obrolan", tl: "Mga chatroom" },
  "Library": { id: "Perpustakaan", tl: "Aklatan" },
  "Settings": { id: "Pengaturan", tl: "Mga Setting" },
  "Family hub": { id: "Pusat keluarga", tl: "Family hub" },
  "Wallet & store": { id: "Dompet & toko", tl: "Wallet at tindahan" },
  "Practice": { id: "Latihan", tl: "Pagsasanay" },
  "Log out": { id: "Keluar", tl: "Mag-log out" },
  "Log in": { id: "Masuk", tl: "Mag-log in" },
  "Sign up": { id: "Daftar", tl: "Mag-sign up" },
  "Create account": { id: "Buat akun", tl: "Gumawa ng account" },
  "Create an account": { id: "Buat akun", tl: "Gumawa ng account" },
  "Get started": { id: "Mulai sekarang", tl: "Magsimula" },
  "Continue with Google": { id: "Lanjutkan dengan Google", tl: "Magpatuloy gamit ang Google" },
  "Forgot password?": { id: "Lupa kata sandi?", tl: "Nakalimutan ang password?" },
  "Email": { id: "Email", tl: "Email" },
  "Password": { id: "Kata sandi", tl: "Password" },
  "Open dashboard": { id: "Buka dasbor", tl: "Buksan ang dashboard" },
  "Save": { id: "Simpan", tl: "I-save" },
  "Cancel": { id: "Batal", tl: "Kanselahin" },
  "Close": { id: "Tutup", tl: "Isara" },
  "Done": { id: "Selesai", tl: "Tapos na" },
  "Continue": { id: "Lanjutkan", tl: "Magpatuloy" },
  "Back": { id: "Kembali", tl: "Bumalik" },
  "Next": { id: "Berikutnya", tl: "Susunod" },
  "Previous": { id: "Sebelumnya", tl: "Nakaraan" },
  "Go": { id: "Buka", tl: "Pumunta" },
  "Page": { id: "Halaman", tl: "Pahina" },
  "Start": { id: "Mulai", tl: "Simulan" },
  "Loading…": { id: "Memuat…", tl: "Naglo-load…" },
  "Try again": { id: "Coba lagi", tl: "Subukan muli" },
  "Search": { id: "Cari", tl: "Maghanap" },
  "Send": { id: "Kirim", tl: "Ipadala" },
  "Update": { id: "Perbarui", tl: "I-update" },
  "Install": { id: "Pasang", tl: "I-install" },
  "Not now": { id: "Nanti saja", tl: "Hindi muna" },
  "Coming soon": { id: "Segera hadir", tl: "Malapit na" },
  "Tap to play": { id: "Ketuk untuk bermain", tl: "I-tap para maglaro" },
  "Hifz": { id: "Hafalan", tl: "Pagsasaulo" },
  "Tilawah": { id: "Tilawah", tl: "Tilawah" },
  "Revision": { id: "Murajaah", tl: "Pagbabalik-aral" },
  "Listen": { id: "Dengarkan", tl: "Makinig" },
  "What would you like to do?": { id: "Apa yang ingin Anda lakukan?", tl: "Ano ang gusto mong gawin?" },
  "Memorise step by step": { id: "Hafalkan langkah demi langkah", tl: "Magsaulo nang paisa-isang hakbang" },
  "Read the mushaf page by page": { id: "Baca mushaf halaman demi halaman", tl: "Basahin ang mushaf pahina por pahina" },
  "Review what you’ve memorised": { id: "Ulangi hafalan Anda", tl: "Balikan ang iyong naisaulo" },
  "Listen to beautiful recitations": { id: "Dengarkan bacaan yang indah", tl: "Makinig sa magagandang pagbigkas" },
  "☰ Surahs": { id: "☰ Surah", tl: "☰ Mga Surah" },
  "Search a surah…": { id: "Cari surah…", tl: "Maghanap ng surah…" },
  "Or choose a surah:": { id: "Atau pilih surah:", tl: "O pumili ng surah:" },
  "Choose a surah": { id: "Pilih surah", tl: "Pumili ng surah" },
  "Start from the beginning": { id: "Mulai dari awal", tl: "Magsimula sa umpisa" },
  "Continue reading?": { id: "Lanjutkan membaca?", tl: "Ipagpatuloy ang pagbasa?" },
  "Continue listening?": { id: "Lanjutkan mendengarkan?", tl: "Ipagpatuloy ang pakikinig?" },
  "▶ Play": { id: "▶ Putar", tl: "▶ I-play" },
  "⏸ Pause": { id: "⏸ Jeda", tl: "⏸ I-pause" },
  "▶ Play from this verse": { id: "▶ Putar dari ayat ini", tl: "▶ I-play mula sa talatang ito" },
  "Loading the page…": { id: "Memuat halaman…", tl: "Naglo-load ang pahina…" },
  "Daily Wisdom": { id: "Hikmah harian", tl: "Karunungan ng araw" },
  "Prayer times": { id: "Waktu salat", tl: "Oras ng dasal" },
  "Fajr": { id: "Subuh", tl: "Fajr" },
  "Sunrise": { id: "Terbit", tl: "Pagsikat ng araw" },
  "Dhuhr": { id: "Zuhur", tl: "Dhuhr" },
  "Asr": { id: "Asar", tl: "Asr" },
  "Maghrib": { id: "Magrib", tl: "Maghrib" },
  "Isha": { id: "Isya", tl: "Isha" },
  "Copy": { id: "Salin", tl: "Kopyahin" },
  "Card": { id: "Kartu", tl: "Card" },
  "Games 🎮": { id: "Permainan 🎮", tl: "Mga Laro 🎮" },
  "Study 📚": { id: "Belajar 📚", tl: "Mag-aral 📚" },
  "Games": { id: "Permainan", tl: "Mga Laro" },
  "Quizzes": { id: "Kuis", tl: "Mga Pagsusulit" },
  "Puzzles": { id: "Teka-teki", tl: "Mga Palaisipan" },
  "Memory games": { id: "Permainan memori", tl: "Mga larong memorya" },
  "Pick something to learn!": { id: "Pilih sesuatu untuk dipelajari!", tl: "Pumili ng matututunan!" },
  "Pick a subject!": { id: "Pilih pelajaran!", tl: "Pumili ng aralin!" },
  "What do you want to play?": { id: "Mau main apa?", tl: "Ano ang gusto mong laruin?" },
  "Subjects": { id: "Pelajaran", tl: "Mga Aralin" },
  "New lessons are coming soon! 🌟": { id: "Pelajaran baru segera hadir! 🌟", tl: "Malapit na ang mga bagong aralin! 🌟" },
  "Your lessons": { id: "Pelajaran Anda", tl: "Iyong mga aralin" },
  "Games & quizzes": { id: "Permainan & kuis", tl: "Mga laro at pagsusulit" },
  "Time’s up for today": { id: "Waktu hari ini habis", tl: "Ubos na ang oras ngayong araw" },
  "What would you like to do today?": { id: "Apa yang ingin kamu lakukan hari ini?", tl: "Ano ang gusto mong gawin ngayon?" },
  "Fun quizzes · earn stars": { id: "Kuis seru · kumpulkan bintang", tl: "Masayang pagsusulit · mangolekta ng bituin" },
  "Level": { id: "Level", tl: "Antas" },
  "▶ Next": { id: "▶ Berikutnya", tl: "▶ Susunod" },
  "Premium": { id: "Premium", tl: "Premium" },
  "Free": { id: "Gratis", tl: "Libre" },
  "Monthly": { id: "Bulanan", tl: "Buwanan" },
  "Yearly": { id: "Tahunan", tl: "Taunan" },
  "Choose plan": { id: "Pilih paket", tl: "Pumili ng plano" },
  "Ask for a quote": { id: "Minta penawaran", tl: "Humingi ng presyo" },
  "Pay now": { id: "Bayar sekarang", tl: "Magbayad ngayon" },
  "Notifications": { id: "Notifikasi", tl: "Mga Abiso" },
  "🔔 Notifications": { id: "🔔 Notifikasi", tl: "🔔 Mga Abiso" },
  "Turn on notifications": { id: "Aktifkan notifikasi", tl: "I-on ang mga abiso" },
  "Send me a test": { id: "Kirim tes ke saya", tl: "Padalhan ako ng test" },
  "Delete my account": { id: "Hapus akun saya", tl: "Burahin ang aking account" },
  "Privacy Policy": { id: "Kebijakan Privasi", tl: "Patakaran sa Privacy" },
  "Terms of Use": { id: "Ketentuan Penggunaan", tl: "Mga Tuntunin ng Paggamit" },
  "Prize Rules": { id: "Aturan Hadiah", tl: "Mga Patakaran sa Premyo" },
  "Preferences & account": { id: "Preferensi & akun", tl: "Mga kagustuhan at account" },
  "Experience": { id: "Pengalaman", tl: "Karanasan" },
  "Saved automatically": { id: "Tersimpan otomatis", tl: "Awtomatikong nase-save" },
  "Language": { id: "Bahasa", tl: "Wika" },
  "Account": { id: "Akun", tl: "Account" },
  "Dark theme preview": { id: "Tema gelap", tl: "Madilim na tema" },
  "Language saved": { id: "Bahasa disimpan", tl: "Na-save ang wika" },
  "Your daily ledger": { id: "Catatan harian Anda", tl: "Iyong pang-araw-araw na tala" },
  "Quick quiz": { id: "Kuis cepat", tl: "Mabilis na pagsusulit" },
  "Quick Quiz": { id: "Kuis cepat", tl: "Mabilis na pagsusulit" },
  "days to Ramadan": { id: "hari menuju Ramadan", tl: "araw bago ang Ramadan" },
  "DAYS TO RAMADAN": { id: "HARI MENUJU RAMADAN", tl: "ARAW BAGO ANG RAMADAN" },
  "Prepare": { id: "Bersiap", tl: "Maghanda" },
  "Prepare your intention, Tarawih plan, and 30-day quest chain.": { id: "Siapkan niat, rencana tarawih, dan rangkaian misi 30 hari.", tl: "Ihanda ang iyong niyyah, plano sa Tarawih, at 30-araw na misyon." },
  "Pick up where you left off": { id: "Lanjutkan dari terakhir", tl: "Ituloy kung saan ka huminto" },
  "Continue reading": { id: "Lanjutkan membaca", tl: "Ipagpatuloy ang pagbasa" },
  "Continue in Library": { id: "Lanjutkan di perpustakaan", tl: "Ituloy sa aklatan" },
  "Assalamu-alaikum,": { id: "Assalamu’alaikum,", tl: "Assalamu alaikum," },
  "Play Modes": { id: "Mode bermain", tl: "Mga paraan ng paglalaro" },
  "Choose a practice": { id: "Pilih latihan", tl: "Pumili ng pagsasanay" },
  "Leaderboard": { id: "Papan peringkat", tl: "Leaderboard" },
  "Weekly": { id: "Mingguan", tl: "Lingguhan" },
  "View all": { id: "Lihat semua", tl: "Tingnan lahat" },
  "{n}% read": { id: "{n}% dibaca", tl: "{n}% nabasa" },
  "{n} XP": { id: "{n} XP", tl: "{n} XP" },
  "Change city": { id: "Ganti kota", tl: "Palitan ang lungsod" },
  "Calculation": { id: "Metode perhitungan", tl: "Paraan ng pagkalkula" },
  "Your country’s usual method (default)": { id: "Metode umum di negara Anda (bawaan)", tl: "Karaniwang paraan sa iyong bansa (default)" },
  "Download card": { id: "Unduh kartu", tl: "I-download ang card" },
  "Adhan": { id: "Azan", tl: "Adhan" },
  "in": { id: "dalam", tl: "sa loob ng" },
  "{n}h {n}m": { id: "{n} j {n} m", tl: "{n} oras {n} min" },
  "in {n}h {n}m": { id: "dalam {n} j {n} m", tl: "sa loob ng {n} oras {n} min" },
  "Newcomer": { id: "Pendatang baru", tl: "Baguhan" },
  "Daily tilawah": { id: "Tilawah harian", tl: "Araw-araw na tilawah" },
  "Streak reminder": { id: "Pengingat beruntun", tl: "Paalala sa streak" },
  "Friday Al-Kahf": { id: "Al-Kahf hari Jumat", tl: "Al-Kahf tuwing Biyernes" },
  "Ramadan prize quiz": { id: "Kuis berhadiah Ramadan", tl: "Ramadan na pagsusulit na may premyo" },
  "Every morning at {n}:{n}": { id: "Setiap pagi pukul {n}:{n}", tl: "Tuwing umaga sa {n}:{n}" },
  "At each of the five prayers": { id: "Di setiap salat lima waktu", tl: "Sa bawat isa sa limang dasal" },
  "At the time you choose below": { id: "Pada waktu yang Anda pilih di bawah", tl: "Sa oras na pipiliin mo sa ibaba" },
  "In the evening, if you haven't learned yet": { id: "Malam hari, jika Anda belum belajar", tl: "Sa gabi, kung hindi ka pa nag-aral" },
  "Friday morning": { id: "Jumat pagi", tl: "Biyernes ng umaga" },
  "When each day's quiz opens": { id: "Saat kuis harian dibuka", tl: "Kapag nagbukas ang pagsusulit ng araw" },
  "Tilawah time": { id: "Waktu tilawah", tl: "Oras ng tilawah" },
  "Sun": { id: "Min", tl: "Lin" },
  "Mon": { id: "Sen", tl: "Lun" },
  "Tue": { id: "Sel", tl: "Mar" },
  "Wed": { id: "Rab", tl: "Miy" },
  "Thu": { id: "Kam", tl: "Huw" },
  "Fri": { id: "Jum", tl: "Biy" },
  "Sat": { id: "Sab", tl: "Sab" },
  "Masha’Allah!": { id: "Masya Allah!", tl: "Masha’Allah!" },
  "Ramadan": { id: "Ramadan", tl: "Ramadan" },
  "Profile": { id: "Profil", tl: "Profile" },
  "Friends": { id: "Teman", tl: "Mga Kaibigan" },
  "Rewards": { id: "Hadiah", tl: "Mga Gantimpala" },
  "Streak": { id: "Beruntun", tl: "Streak" },
  "Points": { id: "Poin", tl: "Mga Puntos" },
  "Play again": { id: "Main lagi", tl: "Maglaro muli" },
  "Play now": { id: "Main sekarang", tl: "Maglaro ngayon" },
  "🌅 Daily Wisdom": { id: "🌅 Hikmah harian", tl: "🌅 Karunungan ng araw" },
  "🕌 Prayer times": { id: "🕌 Waktu salat", tl: "🕌 Oras ng dasal" },
  "📖 Daily tilawah": { id: "📖 Tilawah harian", tl: "📖 Araw-araw na tilawah" },
  "🔥 Streak reminder": { id: "🔥 Pengingat beruntun", tl: "🔥 Paalala sa streak" },
  "📖 Friday Al-Kahf": { id: "📖 Al-Kahf hari Jumat", tl: "📖 Al-Kahf tuwing Biyernes" },
  "🏆 Ramadan prize quiz": { id: "🏆 Kuis berhadiah Ramadan", tl: "🏆 Ramadan na pagsusulit na may premyo" },
};
for (const [k, v] of Object.entries(EXTRA_ID_TL)) DICT[k] = { ...(DICT[k] ?? {}), ...v };

const EXTRA_ID_TL2: Record<string, { id: string; tl: string }> = {
  "Seek · Learn · Grow": { id: "Cari · Belajar · Tumbuh", tl: "Maghanap · Matuto · Lumago" },
  "Knowledge pursued with purpose.": { id: "Ilmu yang dicari dengan tujuan.", tl: "Kaalamang hinahanap nang may layunin." },
  "About": { id: "Tentang", tl: "Tungkol" },
  "Sponsor a learner": { id: "Sponsori pelajar", tl: "I-sponsor ang isang mag-aaral" },
  "Dashboard": { id: "Dasbor", tl: "Dashboard" },
  "Privacy": { id: "Privasi", tl: "Privacy" },
  "Terms": { id: "Ketentuan", tl: "Mga Tuntunin" },
  "Prize rules": { id: "Aturan hadiah", tl: "Mga patakaran sa premyo" },
  "A living school for everyday Muslims": { id: "Sekolah hidup untuk Muslim sehari-hari", tl: "Isang buhay na paaralan para sa bawat Muslim" },
  "Seek knowledge.": { id: "Carilah ilmu.", tl: "Maghanap ng kaalaman." },
  "Grow together.": { id: "Tumbuh bersama.", tl: "Lumago nang sama-sama." },
  "Daily lessons, quizzes, a library with audio, moderated chatrooms and a 3D Muslim world, in one purposeful journey.": { id: "Pelajaran harian, kuis, perpustakaan dengan audio, ruang obrolan yang dimoderasi, dan dunia Muslim 3D, dalam satu perjalanan bermakna.", tl: "Araw-araw na aralin, pagsusulit, aklatan na may audio, mga moderated na chatroom at isang 3D na mundong Muslim, sa iisang makabuluhang paglalakbay." },
  "Start today’s quest": { id: "Mulai misi hari ini", tl: "Simulan ang misyon ngayon" },
  "Explore IlmWorld": { id: "Jelajahi IlmWorld", tl: "Galugarin ang IlmWorld" },
  "to start learning": { id: "untuk mulai belajar", tl: "para magsimulang matuto" },
  "3 zones": { id: "3 zona", tl: "3 zone" },
  "Kids · Teens · Adults": { id: "Anak · Remaja · Dewasa", tl: "Bata · Kabataan · Matanda" },
  "“My Lord, increase me in knowledge.”": { id: "“Ya Tuhanku, tambahkanlah ilmu kepadaku.”", tl: "“Panginoon ko, dagdagan Mo ang aking kaalaman.”" },
  "Qur’an 20:114": { id: "Al-Qur’an 20:114", tl: "Qur’an 20:114" },
  "Simple by design": { id: "Sederhana sejak awal", tl: "Simple sa disenyo" },
  "How IlmStation works": { id: "Cara kerja IlmStation", tl: "Paano gumagana ang IlmStation" },
  "New · 3D world": { id: "Baru · dunia 3D", tl: "Bago · 3D na mundo" },
  "IlmWorld: live a Muslim life, learn as you go.": { id: "IlmWorld: jalani kehidupan Muslim, belajar sambil berjalan.", tl: "IlmWorld: mamuhay bilang Muslim, matuto habang naglalakbay." },
  "Enter IlmWorld": { id: "Masuk IlmWorld", tl: "Pumasok sa IlmWorld" },
  "One companion, the whole journey": { id: "Satu teman untuk seluruh perjalanan", tl: "Isang kasama sa buong paglalakbay" },
  "Everything you need to keep going": { id: "Semua yang Anda perlukan untuk terus maju", tl: "Lahat ng kailangan mo para magpatuloy" },
  "Open the app": { id: "Buka aplikasi", tl: "Buksan ang app" },
  "Ramadan with IlmStation": { id: "Ramadan bersama IlmStation", tl: "Ramadan kasama ang IlmStation" },
  "Your best Ramadan, day by day.": { id: "Ramadan terbaik Anda, hari demi hari.", tl: "Ang iyong pinakamagandang Ramadan, araw-araw." },
  "Prepare for Ramadan": { id: "Bersiap untuk Ramadan", tl: "Maghanda para sa Ramadan" },
  "Sponsor a day’s prizes": { id: "Sponsori hadiah satu hari", tl: "I-sponsor ang premyo ng isang araw" },
  "Conversations with adab": { id: "Percakapan dengan adab", tl: "Usapang may adab" },
  "The circle stays open.": { id: "Lingkaran tetap terbuka.", tl: "Bukas ang bilog." },
  "Topic rooms for each age group, sisters’ and brothers’ circles, text-only and moderated by our team.": { id: "Ruang topik untuk setiap kelompok usia, lingkaran akhwat dan ikhwan, hanya teks dan dimoderasi tim kami.", tl: "Mga silid ayon sa paksa para sa bawat edad, bilog ng mga kapatid na babae at lalaki, teksto lamang at binabantayan ng aming koponan." },
  "Enter chatrooms": { id: "Masuk ruang obrolan", tl: "Pumasok sa mga chatroom" },
  "Rooms are opening soon.": { id: "Ruang akan segera dibuka.", tl: "Malapit nang magbukas ang mga silid." },
  "Kids & family": { id: "Anak & keluarga", tl: "Bata at pamilya" },
  "A safe, joyful journey for children.": { id: "Perjalanan yang aman dan menyenangkan untuk anak-anak.", tl: "Isang ligtas at masayang paglalakbay para sa mga bata." },
  "Sponsor a child": { id: "Sponsori anak", tl: "I-sponsor ang isang bata" },
  "Before you begin": { id: "Sebelum Anda mulai", tl: "Bago ka magsimula" },
  "Questions, answered.": { id: "Pertanyaan, terjawab.", tl: "Mga tanong, sinagot." },
  "Anything else? Write to us at": { id: "Ada yang lain? Tulis ke kami di", tl: "May iba pa? Sumulat sa amin sa" },
  "Your first lesson is one click away.": { id: "Pelajaran pertama Anda hanya satu klik.", tl: "Isang click na lang ang una mong aralin." },
  "No long setup, no pressure. Open the app, read today’s wisdom, take a quick quiz, and let the streak begin.": { id: "Tanpa pengaturan panjang, tanpa tekanan. Buka aplikasi, baca hikmah hari ini, ikuti kuis cepat, dan mulailah rangkaian harian Anda.", tl: "Walang mahabang setup, walang pressure. Buksan ang app, basahin ang karunungan ngayon, sumagot ng mabilis na pagsusulit, at simulan ang iyong streak." },
  "Is IlmStation free to use?": { id: "Apakah IlmStation gratis?", tl: "Libre ba ang IlmStation?" },
  "Do I need to know Arabic to start?": { id: "Apakah saya perlu bisa bahasa Arab untuk mulai?", tl: "Kailangan ko bang marunong ng Arabic para magsimula?" },
  "No. Everything has English, and the Arabic is there for when you’re ready.": { id: "Tidak. Semuanya ada terjemahannya, dan bahasa Arab tersedia saat Anda siap.", tl: "Hindi. May salin ang lahat, at nandiyan ang Arabic kapag handa ka na." },
  "What is IlmWorld?": { id: "Apa itu IlmWorld?", tl: "Ano ang IlmWorld?" },
  "How does the Ramadan prize quiz work?": { id: "Bagaimana cara kerja kuis berhadiah Ramadan?", tl: "Paano gumagana ang Ramadan na pagsusulit na may premyo?" },
  "Is it suitable for children?": { id: "Apakah cocok untuk anak-anak?", tl: "Angkop ba ito para sa mga bata?" },
  "Yes. IlmStation works fully online on your phone or computer.": { id: "Ya. IlmStation berjalan sepenuhnya online di ponsel atau komputer Anda.", tl: "Oo. Gumagana nang buo online ang IlmStation sa iyong phone o computer." },
  "How do children join IlmStation?": { id: "Bagaimana anak-anak bergabung dengan IlmStation?", tl: "Paano sumali ang mga bata sa IlmStation?" },
  "Is kids mode safe?": { id: "Apakah mode anak aman?", tl: "Ligtas ba ang kids mode?" },
  "Can my child play on another device?": { id: "Bisakah anak saya bermain di perangkat lain?", tl: "Puwede bang maglaro ang anak ko sa ibang device?" },
  "Quizzes & daily streaks": { id: "Kuis & rangkaian harian", tl: "Mga pagsusulit at araw-araw na streak" },
  "Short quizzes on Aqeedah, Hadith, Seerah, Fiqh, Arabic and more, with a streak that rewards showing up every day.": { id: "Kuis singkat tentang Akidah, Hadis, Sirah, Fikih, bahasa Arab, dan lainnya, dengan rangkaian yang menghargai kehadiran setiap hari.", tl: "Maiikling pagsusulit sa Aqeedah, Hadith, Seerah, Fiqh, Arabic at iba pa, may streak na nagbibigay-gantimpala sa araw-araw na pagsali." },
  "Library with audio": { id: "Perpustakaan dengan audio", tl: "Aklatan na may audio" },
  "Books and articles that remember your page, plus audiobooks and lecture series chapter by chapter.": { id: "Buku dan artikel yang mengingat halaman Anda, plus buku audio dan seri kajian bab demi bab.", tl: "Mga aklat at artikulong naaalala ang iyong pahina, pati mga audiobook at serye ng lektyur kabanata por kabanata." },
  "Memorise at your own pace with revision and gentle daily targets.": { id: "Hafalkan sesuai kecepatan Anda dengan murajaah dan target harian yang ringan.", tl: "Magsaulo sa sarili mong bilis na may pagbabalik-aral at magaang araw-araw na target." },
  "An ayah, hadith or word of the scholars each day, ready to save, copy or share as a beautiful card.": { id: "Satu ayat, hadis, atau perkataan ulama setiap hari, siap disimpan, disalin, atau dibagikan sebagai kartu indah.", tl: "Isang ayah, hadith o salita ng mga iskolar araw-araw, handang i-save, kopyahin o ibahagi bilang magandang card." },
  "Moderated chatrooms": { id: "Ruang obrolan termoderasi", tl: "Mga moderated na chatroom" },
  "Topic rooms by age group, with sisters’ and brothers’ circles, kept text-only and respectful.": { id: "Ruang topik per kelompok usia, dengan lingkaran akhwat dan ikhwan, hanya teks dan penuh hormat.", tl: "Mga silid ayon sa paksa at edad, may bilog ng mga kapatid na babae at lalaki, teksto lamang at magalang." },
  "Cards for every occasion": { id: "Kartu untuk setiap momen", tl: "Mga card para sa bawat okasyon" },
  "Make Eid, Ramadan, Jumu’ah, nikah, new baby and condolence cards and share them on WhatsApp.": { id: "Buat kartu Idul Fitri, Ramadan, Jumat, nikah, kelahiran, dan belasungkawa, lalu bagikan di WhatsApp.", tl: "Gumawa ng mga card para sa Eid, Ramadan, Jumu’ah, nikah, bagong sanggol at pakikiramay at ibahagi sa WhatsApp." },
  "Join your zone": { id: "Bergabung dengan zona Anda", tl: "Sumali sa iyong zone" },
  "Sign up free and choose your zone: Kids, Teens & Young Adults, or Adult. You only see what’s right for you.": { id: "Daftar gratis dan pilih zona Anda: Anak, Remaja & Dewasa Muda, atau Dewasa. Anda hanya melihat yang sesuai untuk Anda.", tl: "Mag-sign up nang libre at piliin ang iyong zone: Bata, Kabataan, o Matanda. Makikita mo lang ang angkop para sa iyo." },
  "Learn a little, daily": { id: "Belajar sedikit setiap hari", tl: "Matuto nang kaunti araw-araw" },
  "A daily wisdom, a quick quiz, a few pages or an audio chapter. Ten focused minutes keeps your streak alive.": { id: "Hikmah harian, kuis cepat, beberapa halaman, atau satu bab audio. Sepuluh menit fokus menjaga rangkaian Anda.", tl: "Isang karunungan, mabilis na pagsusulit, ilang pahina o isang audio na kabanata. Sampung minutong pokus ang nagpapanatili ng iyong streak." },
  "Grow with company": { id: "Tumbuh bersama teman", tl: "Lumago kasama ang iba" },
  "Reflect in moderated chatrooms, discuss books with other readers, and live it out in IlmWorld.": { id: "Renungkan di ruang obrolan termoderasi, diskusikan buku dengan pembaca lain, dan amalkan di IlmWorld.", tl: "Magnilay sa mga moderated na chatroom, pag-usapan ang mga aklat kasama ang ibang mambabasa, at isabuhay ito sa IlmWorld." },
  "Pray at the masjid": { id: "Salat di masjid", tl: "Magdasal sa masjid" },
  "Rent & furnish a home": { id: "Sewa & lengkapi rumah", tl: "Umupa at mag-ayos ng bahay" },
  "Run a market stall": { id: "Kelola lapak di pasar", tl: "Magpatakbo ng puwesto sa palengke" },
  "Race at the arena": { id: "Balapan di arena", tl: "Makipagkarera sa arena" },
  "Hajj & Umrah": { id: "Haji & Umrah", tl: "Hajj at Umrah" },
  "Lectures & quizzes": { id: "Kajian & kuis", tl: "Mga lektyur at pagsusulit" },
  "Open": { id: "Buka", tl: "Buksan" },
  "Try it now": { id: "Coba sekarang", tl: "Subukan ngayon" },
  "Daily checklist": { id: "Daftar harian", tl: "Araw-araw na checklist" },
  "Fasting, the five prayers, Tarawih, Qur’an, dua and sadaqah, with a streak.": { id: "Puasa, salat lima waktu, tarawih, Al-Qur’an, doa, dan sedekah, dengan rangkaian harian.", tl: "Pag-aayuno, limang dasal, Tarawih, Qur’an, dua at sadaqah, may streak." },
  "A lesson, a dua and a reminder each day, then the quiz.": { id: "Satu pelajaran, satu doa, dan satu pengingat setiap hari, lalu kuis.", tl: "Isang aralin, isang dua at isang paalala araw-araw, saka ang pagsusulit." },
  "Daily prize quiz": { id: "Kuis berhadiah harian", tl: "Araw-araw na pagsusulit na may premyo" },
  "First correct entries win. Results after Tarawih, with a live leaderboard.": { id: "Jawaban benar pertama menang. Hasil diumumkan setelah tarawih, dengan papan peringkat langsung.", tl: "Panalo ang mga unang tamang sagot. Resulta pagkatapos ng Tarawih, may live na leaderboard." },
  "Eid cards": { id: "Kartu Idul Fitri", tl: "Mga Eid card" },
  "Make and share beautiful Eid cards with your family.": { id: "Buat dan bagikan kartu Idul Fitri yang indah dengan keluarga.", tl: "Gumawa at magbahagi ng magagandang Eid card sa iyong pamilya." },
  "Age-appropriate": { id: "Sesuai usia", tl: "Angkop sa edad" },
  "Kids only see books, lessons and rooms meant for their age.": { id: "Anak-anak hanya melihat buku, pelajaran, dan ruang untuk usia mereka.", tl: "Ang mga bata ay nakakakita lang ng mga aklat, aralin at silid na para sa kanilang edad." },
  "Moderated rooms": { id: "Ruang termoderasi", tl: "Mga moderated na silid" },
  "Kids rooms are run by our team, and anything can be reported.": { id: "Ruang anak dikelola tim kami, dan apa pun bisa dilaporkan.", tl: "Ang mga silid ng bata ay pinapatakbo ng aming koponan, at puwedeng i-report ang anuman." },
  "Learning that’s fun": { id: "Belajar yang menyenangkan", tl: "Masayang pag-aaral" },
  "Quizzes, streaks and points built for short attention spans.": { id: "Kuis, rangkaian harian, dan poin untuk rentang perhatian yang singkat.", tl: "Mga pagsusulit, streak at puntos na ginawa para sa maikling atensyon." },
  "Progress you can see": { id: "Kemajuan yang terlihat", tl: "Progresong nakikita mo" },
  "Points, streaks and finished books show how they’re growing.": { id: "Poin, rangkaian harian, dan buku yang selesai menunjukkan perkembangan mereka.", tl: "Ipinapakita ng puntos, streak at natapos na aklat kung paano sila lumalago." },
  "Welcome back": { id: "Selamat datang kembali", tl: "Maligayang pagbabalik" },
  "Your streak, badges and Hifz plan are waiting where you left them.": { id: "Rangkaian, lencana, dan rencana hafalan Anda menunggu di tempat terakhir.", tl: "Naghihintay ang iyong streak, badge at Hifz plan kung saan mo iniwan." },
  "New to IlmStation?": { id: "Baru di IlmStation?", tl: "Bago sa IlmStation?" },
  "A few small steps, then your first quest.": { id: "Beberapa langkah kecil, lalu misi pertama Anda.", tl: "Ilang maliliit na hakbang, saka ang una mong misyon." },
  "Enter your email, or your username if a parent made your account.": { id: "Masukkan email, atau nama pengguna jika orang tua membuat akun Anda.", tl: "Ilagay ang email mo, o username kung magulang ang gumawa ng account mo." },
  "Enter your password.": { id: "Masukkan kata sandi.", tl: "Ilagay ang password mo." },
  "Your password": { id: "Kata sandi Anda", tl: "Iyong password" },
  "Logging in…": { id: "Sedang masuk…", tl: "Nagla-log in…" },
  "Show password": { id: "Tampilkan kata sandi", tl: "Ipakita ang password" },
  "Hide password": { id: "Sembunyikan kata sandi", tl: "Itago ang password" },
  "Choose a language": { id: "Pilih bahasa", tl: "Pumili ng wika" },
  "You can change this any time from the site header.": { id: "Anda bisa mengubahnya kapan saja dari bagian atas situs.", tl: "Puwede mo itong palitan anumang oras mula sa itaas ng site." },
  "Tell us who you are and where to reach you.": { id: "Beri tahu kami siapa Anda dan cara menghubungi Anda.", tl: "Sabihin kung sino ka at paano ka makokontak." },
  "Set a password": { id: "Buat kata sandi", tl: "Gumawa ng password" },
  "One strong password and you’re in.": { id: "Satu kata sandi yang kuat, dan Anda masuk.", tl: "Isang malakas na password at pasok ka na." },
  "A little about you": { id: "Sedikit tentang Anda", tl: "Kaunti tungkol sa iyo" },
  "This places you in the right learning zone.": { id: "Ini menempatkan Anda di zona belajar yang tepat.", tl: "Ilalagay ka nito sa tamang zone ng pag-aaral." },
  "Your interests": { id: "Minat Anda", tl: "Iyong mga interes" },
  "Pick your favourite topics — choose at least 3.": { id: "Pilih topik favorit Anda, minimal 3.", tl: "Piliin ang mga paborito mong paksa, hindi bababa sa 3." },
  "Quick knowledge check": { id: "Cek pengetahuan singkat", tl: "Mabilis na pagsusuri ng kaalaman" },
  "Optional: 5 questions to set your starting level. No pressure.": { id: "Opsional: 5 pertanyaan untuk menentukan level awal Anda. Tanpa tekanan.", tl: "Opsyonal: 5 tanong para malaman ang panimulang antas mo. Walang pressure." },
  "Enter your full name.": { id: "Masukkan nama lengkap.", tl: "Ilagay ang buong pangalan mo." },
  "Enter a valid email, like name@example.com.": { id: "Masukkan email yang valid, seperti name@example.com.", tl: "Maglagay ng tamang email, gaya ng name@example.com." },
  "Username": { id: "Nama pengguna", tl: "Username" },
  "Create a password": { id: "Buat kata sandi", tl: "Gumawa ng password" },
  "Confirm password": { id: "Konfirmasi kata sandi", tl: "Kumpirmahin ang password" },
  "The passwords don’t match yet.": { id: "Kata sandi belum cocok.", tl: "Hindi pa tugma ang mga password." },
  "Age group": { id: "Kelompok usia", tl: "Pangkat ng edad" },
  "Your age group": { id: "Kelompok usia Anda", tl: "Iyong pangkat ng edad" },
  "Gender": { id: "Jenis kelamin", tl: "Kasarian" },
  "Choose one to continue.": { id: "Pilih satu untuk melanjutkan.", tl: "Pumili ng isa para magpatuloy." },
  "Choose your age group to continue.": { id: "Pilih kelompok usia untuk melanjutkan.", tl: "Piliin ang pangkat ng edad para magpatuloy." },
  "Under 13?": { id: "Di bawah 13 tahun?", tl: "Wala pang 13?" },
  "Creating account…": { id: "Membuat akun…", tl: "Ginagawa ang account…" },
  "Kids Zone": { id: "Zona Anak", tl: "Kids Zone" },
  "Teens & Young Adults Zone": { id: "Zona Remaja & Dewasa Muda", tl: "Zone ng Kabataan" },
  "Adult Zone": { id: "Zona Dewasa", tl: "Zone ng Matatanda" },
  "Guided quests for teens and young adults — Qur’an, Seerah and everyday fiqh at a steady pace.": { id: "Misi terarah untuk remaja dan dewasa muda: Al-Qur’an, Sirah, dan fikih sehari-hari dengan langkah mantap.", tl: "Mga gabay na misyon para sa kabataan: Qur’an, Seerah at pang-araw-araw na fiqh sa tuloy-tuloy na bilis." },
  "Deep dives into Islamic knowledge — Fiqh, Aqeedah, Seerah and more.": { id: "Pendalaman ilmu Islam: Fikih, Akidah, Sirah, dan lainnya.", tl: "Malalim na pag-aaral ng Islam: Fiqh, Aqeedah, Seerah at iba pa." },
  "By creating an account, you agree to our": { id: "Dengan membuat akun, Anda menyetujui", tl: "Sa paggawa ng account, sumasang-ayon ka sa aming" },
  "Log in instead": { id: "Masuk saja", tl: "Mag-log in na lang" },
  "An account with this email already exists.": { id: "Akun dengan email ini sudah ada.", tl: "May account na gamit ang email na ito." },
  "Go Premium": { id: "Jadi Premium", tl: "Mag-Premium" },
  "Achievements": { id: "Pencapaian", tl: "Mga Nakamit" },
  "Wallet": { id: "Dompet", tl: "Wallet" },
  "Use points": { id: "Gunakan poin", tl: "Gamitin ang puntos" },
  "Badges": { id: "Lencana", tl: "Mga Badge" },
  "Balance": { id: "Saldo", tl: "Balanse" },
  "Test yourself": { id: "Uji dirimu", tl: "Subukin ang sarili" },
  "Choose a topic": { id: "Pilih topik", tl: "Pumili ng paksa" },
  "New": { id: "Baru", tl: "Bago" },
  "Start quiz": { id: "Mulai kuis", tl: "Simulan ang pagsusulit" },
  "Next question": { id: "Pertanyaan berikutnya", tl: "Susunod na tanong" },
  "See results": { id: "Lihat hasil", tl: "Tingnan ang resulta" },
  "Score": { id: "Skor", tl: "Iskor" },
  "XP earned": { id: "XP didapat", tl: "Nakuhang XP" },
  "Accuracy": { id: "Ketepatan", tl: "Katumpakan" },
  "Challenge a friend": { id: "Tantang teman", tl: "Hamunin ang kaibigan" },
  "Fresh quizzes and interactive games from the IlmStation team.": { id: "Kuis baru dan permainan interaktif dari tim IlmStation.", tl: "Bagong pagsusulit at interactive na laro mula sa IlmStation team." },
  "Aqeedah, Hadith, Seerah, Fiqh, Arabic, Qur’an and more. Short quizzes, XP for every right answer, and challenges with friends.": { id: "Akidah, Hadis, Sirah, Fikih, bahasa Arab, Al-Qur’an, dan lainnya. Kuis singkat, XP untuk setiap jawaban benar, dan tantangan bersama teman.", tl: "Aqeedah, Hadith, Seerah, Fiqh, Arabic, Qur’an at iba pa. Maiikling pagsusulit, XP sa bawat tamang sagot, at hamon kasama ang mga kaibigan." },
  "Read Surah Al-Kahf today": { id: "Baca Surah Al-Kahf hari ini", tl: "Basahin ang Surah Al-Kahf ngayon" },
  "Read Al-Kahf": { id: "Baca Al-Kahf", tl: "Basahin ang Al-Kahf" },
  "Browse the library": { id: "Jelajahi perpustakaan", tl: "Tingnan ang aklatan" },
  "Saved": { id: "Tersimpan", tl: "Na-save" },
  "Copied": { id: "Disalin", tl: "Nakopya" },
  "Log in to save wisdom.": { id: "Masuk untuk menyimpan hikmah.", tl: "Mag-log in para i-save ang karunungan." },
  "Reciter": { id: "Qari", tl: "Qari" },
  "You’re on the free plan": { id: "Anda menggunakan paket gratis", tl: "Nasa libreng plano ka" },
  "Premium is active": { id: "Premium aktif", tl: "Aktibo ang Premium" },
  "Custom pricing": { id: "Harga khusus", tl: "Espesyal na presyo" },
  "Get it": { id: "Dapatkan", tl: "Kunin" },
  "All time": { id: "Sepanjang waktu", tl: "Lahat ng panahon" },
  "Among friends": { id: "Di antara teman", tl: "Sa mga kaibigan" },
  "Global": { id: "Global", tl: "Global" },
  "Find friends": { id: "Cari teman", tl: "Maghanap ng kaibigan" },
  "Requests": { id: "Permintaan", tl: "Mga kahilingan" },
  "Learning record": { id: "Catatan belajar", tl: "Talaan ng pag-aaral" },
  "Your progress": { id: "Kemajuan Anda", tl: "Iyong progreso" },
  "Topic performance": { id: "Kinerja per topik", tl: "Resulta bawat paksa" },
  "How to earn": { id: "Cara mendapatkan", tl: "Paano kumita" },
  "From new levels": { id: "Dari level baru", tl: "Mula sa bagong antas" },
  "Ask IlmBot": { id: "Tanya IlmBot", tl: "Tanungin si IlmBot" },
  "Not a fatwa service": { id: "Bukan layanan fatwa", tl: "Hindi serbisyo ng fatwa" },
  "Ask a learning question…": { id: "Ajukan pertanyaan belajar…", tl: "Magtanong tungkol sa pag-aaral…" },
  "Open navigation": { id: "Buka menu", tl: "Buksan ang menu" },
  "Toggle navigation": { id: "Menu", tl: "Menu" },
  "Arabic": { id: "Bahasa Arab", tl: "Arabic" },
  "Aqeedah": { id: "Akidah", tl: "Aqeedah" },
  "Hadith": { id: "Hadis", tl: "Hadith" },
  "Seerah": { id: "Sirah", tl: "Seerah" },
  "Fiqh": { id: "Fikih", tl: "Fiqh" },
  "Tafsir": { id: "Tafsir", tl: "Tafsir" },
  "Dua": { id: "Doa", tl: "Dua" },
  "Events": { id: "Acara", tl: "Mga Kaganapan" },
  "Centres": { id: "Pusat", tl: "Mga Sentro" },
  "Sponsor": { id: "Sponsori", tl: "Mag-sponsor" },
  "Turn on": { id: "Aktifkan", tl: "I-on" },
  "📲 Install the app": { id: "📲 Pasang aplikasi", tl: "📲 I-install ang app" },
  "Install IlmStation": { id: "Pasang IlmStation", tl: "I-install ang IlmStation" },
  "🌍 Language": { id: "🌍 Bahasa", tl: "🌍 Wika" },
  "Next prayer": { id: "Salat berikutnya", tl: "Susunod na dasal" },
  "Download": { id: "Unduh", tl: "I-download" },
  "Share": { id: "Bagikan", tl: "Ibahagi" },
  "Cards": { id: "Kartu", tl: "Mga Card" },
  "Community": { id: "Komunitas", tl: "Komunidad" },
  "IlmBot": { id: "IlmBot", tl: "IlmBot" },
  "Assalamu alaikum": { id: "Assalamu’alaikum", tl: "Assalamu alaikum" },
  "Prepare your intention, Tarawih plan, and 30-day quest chain": { id: "Siapkan niat, rencana tarawih, dan rangkaian misi 30 hari", tl: "Ihanda ang iyong niyyah, plano sa Tarawih, at 30-araw na misyon" },
  "Hifz Drills": { id: "Latihan hafalan", tl: "Pagsasanay sa Hifz" },
  "Recite and review": { id: "Baca dan ulangi", tl: "Bigkasin at balikan" },
  "Tafsir Quiz": { id: "Kuis tafsir", tl: "Pagsusulit sa Tafsir" },
  "10 mixed questions": { id: "10 soal campuran", tl: "10 halo-halong tanong" },
  "Learn with family": { id: "Belajar bersama keluarga", tl: "Matuto kasama ang pamilya" },
  "Ask and explore": { id: "Tanya dan jelajahi", tl: "Magtanong at tumuklas" },
  "Invite friends to see the leaderboard.": { id: "Undang teman untuk melihat papan peringkat.", tl: "Mag-imbita ng kaibigan para makita ang leaderboard." },
  "Daily streak": { id: "Rangkaian harian", tl: "Araw-araw na streak" },
  "▶ Play adhan": { id: "▶ Putar azan", tl: "▶ I-play ang adhan" },
  "Stop": { id: "Berhenti", tl: "Ihinto" },
  "Turn off adhan": { id: "Matikan azan", tl: "I-off ang adhan" },
  "Couldn't load prayer times.": { id: "Gagal memuat waktu salat.", tl: "Hindi ma-load ang oras ng dasal." },
  "Continue listening": { id: "Lanjutkan mendengarkan", tl: "Ituloy ang pakikinig" },
  "Start reading": { id: "Mulai membaca", tl: "Simulan ang pagbasa" },
  "Start with a quick quiz": { id: "Mulai dengan kuis cepat", tl: "Magsimula sa mabilis na pagsusulit" },
  "Open a book from the library, or test yourself with a quick quiz.": { id: "Buka buku dari perpustakaan, atau uji diri dengan kuis cepat.", tl: "Magbukas ng aklat mula sa aklatan, o subukin ang sarili sa mabilis na pagsusulit." },
  "Jumu’ah Mubarak": { id: "Jumat Mubarak", tl: "Jumu’ah Mubarak" },
  "Surah Al-Kahf": { id: "Surah Al-Kahf", tl: "Surah Al-Kahf" },
  "Mushaf": { id: "Mushaf", tl: "Mushaf" },
  "With translation": { id: "Dengan terjemahan", tl: "May salin" },
  "110 ayat · read or listen": { id: "110 ayat · baca atau dengarkan", tl: "110 ayah · basahin o pakinggan" },
  "Couldn't load the surah. Check your connection and try again.": { id: "Gagal memuat surah. Periksa koneksi Anda dan coba lagi.", tl: "Hindi ma-load ang surah. Tingnan ang koneksyon at subukan muli." },
  "Read Surah Al-Kahf": { id: "Baca Surah Al-Kahf", tl: "Basahin ang Surah Al-Kahf" },
  "I’ve read Al-Kahf": { id: "Saya sudah membaca Al-Kahf", tl: "Nabasa ko na ang Al-Kahf" },
  "Quest reminders": { id: "Pengingat misi", tl: "Paalala sa misyon" },
  "Sound effects": { id: "Efek suara", tl: "Mga sound effect" },
  "Reduced motion": { id: "Kurangi gerakan", tl: "Bawasan ang galaw" },
  "Frontend demo": { id: "Demo", tl: "Demo" },
  "Replay onboarding": { id: "Ulangi pengenalan", tl: "Ulitin ang pagpapakilala" },
  "Privacy & accessibility": { id: "Privasi & aksesibilitas", tl: "Privacy at accessibility" },
  "Preview offline state": { id: "Pratinjau mode offline", tl: "Silipin ang offline mode" },
  "days to ramadan": { id: "hari menuju Ramadan", tl: "araw bago ang Ramadan" },
  "Days to Ramadan!": { id: "hari menuju Ramadan!", tl: "araw bago ang Ramadan!" },
  "{n} days to Ramadan": { id: "{n} hari menuju Ramadan", tl: "{n} araw bago ang Ramadan" },
  "{n} days": { id: "{n} hari", tl: "{n} araw" },
  "{n}-day streak": { id: "Rangkaian {n} hari", tl: "{n}-araw na streak" },
  "Muslim World League": { id: "Liga Muslim Dunia", tl: "Muslim World League" },
  "Egyptian General Authority": { id: "Otoritas Umum Mesir", tl: "Egyptian General Authority" },
  "Moonsighting Committee": { id: "Komite Rukyatul Hilal", tl: "Moonsighting Committee" },
  "Umm al-Qura, Makkah": { id: "Umm al-Qura, Makkah", tl: "Umm al-Qura, Makkah" },
  "Auto": { id: "Otomatis", tl: "Awtomatiko" },
  "Adhan 🔔": { id: "Azan 🔔", tl: "Adhan 🔔" },
  "🔔 Adhan": { id: "🔔 Azan", tl: "🔔 Adhan" },
  "12h": { id: "12 jam", tl: "12 oras" },
  "24h": { id: "24 jam", tl: "24 oras" },
  "{n}m": { id: "{n} m", tl: "{n} min" },
  "in {n}m": { id: "dalam {n} m", tl: "sa loob ng {n} min" },
  "Today’s prayer times": { id: "Waktu salat hari ini", tl: "Oras ng dasal ngayon" },
  "Use my location": { id: "Gunakan lokasi saya", tl: "Gamitin ang lokasyon ko" },
  "Search a city…": { id: "Cari kota…", tl: "Maghanap ng lungsod…" },
  "TODAY": { id: "HARI INI", tl: "NGAYON" },
  "Seeker": { id: "Pencari", tl: "Naghahanap" },
  "Learner": { id: "Pelajar", tl: "Mag-aaral" },
  "Student": { id: "Murid", tl: "Estudyante" },
  "Scholar": { id: "Cendekiawan", tl: "Iskolar" },
  "Guardian": { id: "Penjaga", tl: "Tagapag-ingat" },
  "Explorer": { id: "Penjelajah", tl: "Manlalakbay" },
  "Hafiz": { id: "Hafiz", tl: "Hafiz" },
  "Teacher": { id: "Guru", tl: "Guro" },
  "Update device and location": { id: "Perbarui perangkat dan lokasi", tl: "I-update ang device at lokasyon" },
  "Notifications are on": { id: "Notifikasi aktif", tl: "Naka-on ang mga abiso" },
  "Notifications are off": { id: "Notifikasi nonaktif", tl: "Naka-off ang mga abiso" },
};
for (const [k, v] of Object.entries(EXTRA_ID_TL2)) DICT[k] = { ...(DICT[k] ?? {}), ...v };

// login: adult / child
DICT["🧑 Teen & Adult"] = { ...(DICT["🧑 Teen & Adult"] ?? {}), ar: "🧑 يافع وبالغ", fr: "🧑 Ado et adulte", ur: "🧑 نوجوان اور بالغ", ha: "🧑 Matashi da babba", id: "🧑 Remaja & Dewasa", tl: "🧑 Kabataan at Matanda" };
DICT["🧒 Child"] = { ...(DICT["🧒 Child"] ?? {}), ar: "🧒 طفل", fr: "🧒 Enfant", ur: "🧒 بچہ", ha: "🧒 Yaro", id: "🧒 Anak", tl: "🧒 Bata" };
DICT["👋 Ask your parent for your username and password."] = { ...(DICT["👋 Ask your parent for your username and password."] ?? {}), ar: "👋 اطلب من والديك اسم المستخدم وكلمة المرور.", fr: "👋 Demande ton nom d’utilisateur et ton mot de passe à tes parents.", ur: "👋 اپنا یوزر نیم اور پاس ورڈ والدین سے پوچھیں۔", ha: "👋 Tambayi iyayenka sunan mai amfani da kalmar sirrinka.", id: "👋 Minta nama pengguna dan kata sandi kepada orang tuamu.", tl: "👋 Itanong sa magulang mo ang iyong username at password." };
DICT["Forgot it? Ask your parent."] = { ...(DICT["Forgot it? Ask your parent."] ?? {}), ar: "نسيتها؟ اسأل والديك.", fr: "Oublié ? Demande à tes parents.", ur: "بھول گئے؟ والدین سے پوچھیں۔", ha: "Ka manta? Tambayi iyayenka.", id: "Lupa? Tanya orang tuamu.", tl: "Nakalimutan? Itanong sa magulang mo." };
DICT["e.g. amina_10"] = { ...(DICT["e.g. amina_10"] ?? {}), ar: "مثال: amina_10", fr: "ex. amina_10", ur: "مثلاً amina_10", ha: "misali amina_10", id: "mis. amina_10", tl: "hal. amina_10" };
DICT["Email address"] = { ...(DICT["Email address"] ?? {}), ar: "البريد الإلكتروني", fr: "Adresse e-mail", ur: "ای میل ایڈریس", ha: "Adireshin imel", id: "Alamat email", tl: "Email address" };
DICT["Log in to IlmStation"] = { ...(DICT["Log in to IlmStation"] ?? {}), ar: "سجّل الدخول إلى IlmStation", fr: "Se connecter à IlmStation", ur: "IlmStation میں لاگ ان کریں", ha: "Shiga IlmStation", id: "Masuk ke IlmStation", tl: "Mag-log in sa IlmStation" };
DICT["Pick up today’s quest where you left it."] = { ...(DICT["Pick up today’s quest where you left it."] ?? {}), ar: "تابع مهمة اليوم من حيث توقفت.", fr: "Reprenez la quête du jour là où vous l’avez laissée.", ur: "آج کی مہم وہیں سے جاری رکھیں جہاں چھوڑی تھی۔", ha: "Ci gaba da aikin yau daga inda ka tsaya.", id: "Lanjutkan misi hari ini dari tempat terakhir.", tl: "Ituloy ang misyon ngayon kung saan ka huminto." };
DICT["Seek · Learn · Grow"] = { ...(DICT["Seek · Learn · Grow"] ?? {}), ar: "اطلب · تعلّم · انمُ", fr: "Chercher · Apprendre · Grandir", ur: "تلاش · سیکھیں · بڑھیں", ha: "Nema · Koyo · Girma", id: "Cari · Belajar · Tumbuh", tl: "Maghanap · Matuto · Lumago" };
DICT["OR"] = { ...(DICT["OR"] ?? {}), ar: "أو", fr: "OU", ur: "یا", ha: "KO", id: "ATAU", tl: "O" };
DICT["Ta-Ha 20:114"] = { ...(DICT["Ta-Ha 20:114"] ?? {}), ar: "طه ٢٠:١١٤", fr: "Ta-Ha 20:114", ur: "طٰہٰ 20:114", ha: "Ta-Ha 20:114", id: "Taha 20:114", tl: "Ta-Ha 20:114" };

DICT["Teen & Adult"] = { ...(DICT["Teen & Adult"] ?? {}), ar: "يافع وبالغ", fr: "Ado et adulte", ur: "نوجوان اور بالغ", ha: "Matashi da babba", id: "Remaja & Dewasa", tl: "Kabataan at Matanda" };
DICT["Child"] = { ...(DICT["Child"] ?? {}), ar: "طفل", fr: "Enfant", ur: "بچہ", ha: "Yaro", id: "Anak", tl: "Bata" };
DICT["Log in with Google or your email"] = { ...(DICT["Log in with Google or your email"] ?? {}), ar: "سجّل الدخول عبر Google أو بريدك", fr: "Connectez-vous avec Google ou votre e-mail", ur: "Google یا اپنے ای میل سے لاگ ان کریں", ha: "Shiga da Google ko imel ɗinka", id: "Masuk dengan Google atau email Anda", tl: "Mag-log in gamit ang Google o email mo" };
DICT["Log in with the username your parent gave you"] = { ...(DICT["Log in with the username your parent gave you"] ?? {}), ar: "سجّل الدخول باسم المستخدم الذي أعطاك إياه والداك", fr: "Connecte-toi avec le nom d’utilisateur donné par tes parents", ur: "والدین کے دیے گئے یوزر نیم سے لاگ ان کریں", ha: "Shiga da sunan mai amfani da iyayenka suka ba ka", id: "Masuk dengan nama pengguna dari orang tuamu", tl: "Mag-log in gamit ang username na ibinigay ng magulang mo" };
DICT["Change"] = { ...(DICT["Change"] ?? {}), ar: "تغيير", fr: "Changer", ur: "تبدیل کریں", ha: "Canza", id: "Ubah", tl: "Palitan" };
DICT["🧑 Teen & Adult"] = { ...(DICT["🧑 Teen & Adult"] ?? {}), ar: "🧑 يافع وبالغ", fr: "🧑 Ado et adulte", ur: "🧑 نوجوان اور بالغ", ha: "🧑 Matashi da babba", id: "🧑 Remaja & Dewasa", tl: "🧑 Kabataan at Matanda" };
DICT["New to IlmStation?"] = { ...(DICT["New to IlmStation?"] ?? {}), ar: "جديد في IlmStation؟", fr: "Nouveau sur IlmStation ?", ur: "IlmStation پر نئے ہیں؟", ha: "Sabo a IlmStation?", id: "Baru di IlmStation?", tl: "Bago sa IlmStation?" };

// You page
DICT["Your account"] = { ...(DICT["Your account"] ?? {}), ar: "حسابك", fr: "Votre compte", ur: "آپ کا اکاؤنٹ", ha: "Asusunka", id: "Akun Anda", tl: "Iyong account" };
DICT["Me"] = { ...(DICT["Me"] ?? {}), ar: "أنا", fr: "Moi", ur: "میں", ha: "Ni", id: "Saya", tl: "Ako" };
DICT["Your profile"] = { ...(DICT["Your profile"] ?? {}), ar: "ملفك الشخصي", fr: "Votre profil", ur: "آپ کا پروفائل", ha: "Bayananka", id: "Profil Anda", tl: "Iyong profile" };
DICT["Free plan"] = { ...(DICT["Free plan"] ?? {}), ar: "الخطة المجانية", fr: "Offre gratuite", ur: "مفت پلان", ha: "Tsarin kyauta", id: "Paket gratis", tl: "Libreng plano" };
DICT["My progress"] = { ...(DICT["My progress"] ?? {}), ar: "تقدّمي", fr: "Mes progrès", ur: "میری پیش رفت", ha: "Ci gabana", id: "Kemajuanku", tl: "Aking progreso" };
DICT["Stars, levels and streak"] = { ...(DICT["Stars, levels and streak"] ?? {}), ar: "النجوم والمستويات والسلسلة", fr: "Étoiles, niveaux et série", ur: "ستارے، لیول اور تسلسل", ha: "Taurari, matakai da jerin kwanaki", id: "Bintang, level, dan rangkaian", tl: "Mga bituin, antas at streak" };
DICT["My badges"] = { ...(DICT["My badges"] ?? {}), ar: "شاراتي", fr: "Mes badges", ur: "میرے بیجز", ha: "Lambobin yabona", id: "Lencanaku", tl: "Aking mga badge" };
DICT["Everything you’ve earned"] = { ...(DICT["Everything you’ve earned"] ?? {}), ar: "كل ما حصلت عليه", fr: "Tout ce que vous avez gagné", ur: "جو کچھ آپ نے حاصل کیا", ha: "Duk abin da ka samu", id: "Semua yang kamu raih", tl: "Lahat ng nakuha mo" };
DICT["My lessons"] = { ...(DICT["My lessons"] ?? {}), ar: "دروسي", fr: "Mes leçons", ur: "میرے اسباق", ha: "Darussana", id: "Pelajaranku", tl: "Aking mga aralin" };
DICT["Keep learning"] = { ...(DICT["Keep learning"] ?? {}), ar: "واصل التعلّم", fr: "Continue d’apprendre", ur: "سیکھتے رہیں", ha: "Ci gaba da koyo", id: "Terus belajar", tl: "Patuloy na matuto" };
DICT["Language and more"] = { ...(DICT["Language and more"] ?? {}), ar: "اللغة والمزيد", fr: "Langue et plus", ur: "زبان اور مزید", ha: "Harshe da sauransu", id: "Bahasa dan lainnya", tl: "Wika at iba pa" };
DICT["Your learning record"] = { ...(DICT["Your learning record"] ?? {}), ar: "سجل تعلّمك", fr: "Votre parcours", ur: "آپ کا سیکھنے کا ریکارڈ", ha: "Rikodin koyonka", id: "Catatan belajarmu", tl: "Iyong talaan ng pag-aaral" };
DICT["Daily and weekly goals"] = { ...(DICT["Daily and weekly goals"] ?? {}), ar: "أهداف يومية وأسبوعية", fr: "Objectifs quotidiens et hebdomadaires", ur: "روزانہ اور ہفتہ وار اہداف", ha: "Manufofin yau da mako", id: "Target harian dan mingguan", tl: "Araw-araw at lingguhang layunin" };
DICT["Wallet & points"] = { ...(DICT["Wallet & points"] ?? {}), ar: "المحفظة والنقاط", fr: "Portefeuille et points", ur: "والٹ اور پوائنٹس", ha: "Jaka da maki", id: "Dompet & poin", tl: "Wallet at puntos" };
DICT["Friends & challenges"] = { ...(DICT["Friends & challenges"] ?? {}), ar: "الأصدقاء والتحديات", fr: "Amis et défis", ur: "دوست اور مقابلے", ha: "Abokai da ƙalubale", id: "Teman & tantangan", tl: "Mga kaibigan at hamon" };
DICT["Your circle"] = { ...(DICT["Your circle"] ?? {}), ar: "دائرتك", fr: "Votre cercle", ur: "آپ کا حلقہ", ha: "Da’irarka", id: "Lingkaranmu", tl: "Iyong bilog" };
DICT["Children’s accounts and family plan"] = { ...(DICT["Children’s accounts and family plan"] ?? {}), ar: "حسابات الأطفال وخطة العائلة", fr: "Comptes enfants et offre famille", ur: "بچوں کے اکاؤنٹس اور فیملی پلان", ha: "Asusun yara da tsarin iyali", id: "Akun anak dan paket keluarga", tl: "Mga account ng bata at family plan" };
DICT["Your plan"] = { ...(DICT["Your plan"] ?? {}), ar: "خطتك", fr: "Votre offre", ur: "آپ کا پلان", ha: "Tsarinka", id: "Paketmu", tl: "Iyong plano" };
DICT["See plans"] = { ...(DICT["See plans"] ?? {}), ar: "عرض الخطط", fr: "Voir les offres", ur: "پلان دیکھیں", ha: "Duba tsare-tsare", id: "Lihat paket", tl: "Tingnan ang mga plano" };
DICT["Invite friends"] = { ...(DICT["Invite friends"] ?? {}), ar: "ادعُ أصدقاءك", fr: "Inviter des amis", ur: "دوستوں کو مدعو کریں", ha: "Gayyaci abokai", id: "Undang teman", tl: "Mag-imbita ng kaibigan" };
DICT["Share IlmStation"] = { ...(DICT["Share IlmStation"] ?? {}), ar: "شارك IlmStation", fr: "Partager IlmStation", ur: "IlmStation شیئر کریں", ha: "Raba IlmStation", id: "Bagikan IlmStation", tl: "Ibahagi ang IlmStation" };
DICT["⚙️ Settings"] = { ...(DICT["⚙️ Settings"] ?? {}), ar: "⚙️ الإعدادات", fr: "⚙️ Paramètres", ur: "⚙️ ترتیبات", ha: "⚙️ Saituna", id: "⚙️ Pengaturan", tl: "⚙️ Mga Setting" };
DICT["❓ Help & contact"] = { ...(DICT["❓ Help & contact"] ?? {}), ar: "❓ المساعدة والتواصل", fr: "❓ Aide et contact", ur: "❓ مدد اور رابطہ", ha: "❓ Taimako da tuntuɓa", id: "❓ Bantuan & kontak", tl: "❓ Tulong at contact" };
DICT["📄 Privacy Policy"] = { ...(DICT["📄 Privacy Policy"] ?? {}), ar: "📄 سياسة الخصوصية", fr: "📄 Politique de confidentialité", ur: "📄 رازداری کی پالیسی", ha: "📄 Manufar sirri", id: "📄 Kebijakan Privasi", tl: "📄 Patakaran sa Privacy" };
DICT["📄 Terms of Use"] = { ...(DICT["📄 Terms of Use"] ?? {}), ar: "📄 شروط الاستخدام", fr: "📄 Conditions d’utilisation", ur: "📄 استعمال کی شرائط", ha: "📄 Sharuɗɗan amfani", id: "📄 Ketentuan Penggunaan", tl: "📄 Mga Tuntunin ng Paggamit" };
DICT["🚪 Log out"] = { ...(DICT["🚪 Log out"] ?? {}), ar: "🚪 تسجيل الخروج", fr: "🚪 Se déconnecter", ur: "🚪 لاگ آؤٹ", ha: "🚪 Fita", id: "🚪 Keluar", tl: "🚪 Mag-log out" };
DICT["Link copied"] = { ...(DICT["Link copied"] ?? {}), ar: "تم نسخ الرابط", fr: "Lien copié", ur: "لنک کاپی ہو گیا", ha: "An kwafa hanyar", id: "Tautan disalin", tl: "Nakopya ang link" };
DICT["Logged out"] = { ...(DICT["Logged out"] ?? {}), ar: "تم تسجيل الخروج", fr: "Déconnecté", ur: "لاگ آؤٹ ہو گئے", ha: "An fita", id: "Berhasil keluar", tl: "Naka-log out" };
DICT["Level {n}"] = { ...(DICT["Level {n}"] ?? {}), ar: "المستوى {n}", fr: "Niveau {n}", ur: "لیول {n}", ha: "Mataki {n}", id: "Level {n}", tl: "Antas {n}" };

DICT["Help & contact"] = { ...(DICT["Help & contact"] ?? {}), ar: "المساعدة والتواصل", fr: "Aide et contact", ur: "مدد اور رابطہ", ha: "Taimako da tuntuɓa", id: "Bantuan & kontak", tl: "Tulong at contact" };
DICT["Free trial"] = { ...(DICT["Free trial"] ?? {}), ar: "تجربة مجانية", fr: "Essai gratuit", ur: "مفت آزمائش", ha: "Gwaji kyauta", id: "Uji coba gratis", tl: "Libreng trial" };

// Quest Map and Family Halaqah
DICT["Curriculum journey"] = { ...(DICT["Curriculum journey"] ?? {}), ar: "رحلة المنهج", fr: "Parcours d’apprentissage", ur: "نصاب کا سفر", ha: "Tafiyar manhaja", id: "Perjalanan kurikulum", tl: "Paglalakbay sa kurikulum" };
DICT["Quest Map"] = { ...(DICT["Quest Map"] ?? {}), ar: "خريطة المهام", fr: "Carte des quêtes", ur: "مہمات کا نقشہ", ha: "Taswirar ayyuka", id: "Peta misi", tl: "Mapa ng misyon" };
DICT["← Map"] = { ...(DICT["← Map"] ?? {}), ar: "← الخريطة", fr: "← Carte", ur: "← نقشہ", ha: "← Taswira", id: "← Peta", tl: "← Mapa" };
DICT["{n} lessons · {n}%"] = { ...(DICT["{n} lessons · {n}%"] ?? {}), ar: "{n} دروس · {n}%", fr: "{n} leçons · {n}%", ur: "{n} اسباق · {n}%", ha: "Darussa {n} · {n}%", id: "{n} pelajaran · {n}%", tl: "{n} aralin · {n}%" };
DICT["This lesson is Premium."] = { ...(DICT["This lesson is Premium."] ?? {}), ar: "هذا الدرس ضمن بريميوم.", fr: "Cette leçon est Premium.", ur: "یہ سبق پریمیم ہے۔", ha: "Wannan darasi na Premium ne.", id: "Pelajaran ini Premium.", tl: "Premium ang araling ito." };
DICT["Family learning"] = { ...(DICT["Family learning"] ?? {}), ar: "التعلّم العائلي", fr: "Apprendre en famille", ur: "خاندانی تعلیم", ha: "Koyon iyali", id: "Belajar bersama keluarga", tl: "Pag-aaral ng pamilya" };
DICT["Family Halaqah"] = { ...(DICT["Family Halaqah"] ?? {}), ar: "حلقة العائلة", fr: "Halaqa familiale", ur: "فیملی حلقہ", ha: "Halakar iyali", id: "Halaqah keluarga", tl: "Family Halaqah" };
DICT["Host"] = { ...(DICT["Host"] ?? {}), ar: "المضيف", fr: "Hôte", ur: "میزبان", ha: "Mai masauki", id: "Tuan rumah", tl: "Host" };
DICT["Guest"] = { ...(DICT["Guest"] ?? {}), ar: "ضيف", fr: "Invité", ur: "مہمان", ha: "Baƙo", id: "Tamu", tl: "Bisita" };
DICT["Create a room"] = { ...(DICT["Create a room"] ?? {}), ar: "أنشئ غرفة", fr: "Créer une salle", ur: "کمرہ بنائیں", ha: "Ƙirƙiri ɗaki", id: "Buat ruang", tl: "Gumawa ng room" };
DICT["Join a room"] = { ...(DICT["Join a room"] ?? {}), ar: "انضم إلى غرفة", fr: "Rejoindre une salle", ur: "کمرے میں شامل ہوں", ha: "Shiga ɗaki", id: "Gabung ke ruang", tl: "Sumali sa room" };
DICT["Topic"] = { ...(DICT["Topic"] ?? {}), ar: "الموضوع", fr: "Sujet", ur: "موضوع", ha: "Jigo", id: "Topik", tl: "Paksa" };
DICT["Questions"] = { ...(DICT["Questions"] ?? {}), ar: "الأسئلة", fr: "Questions", ur: "سوالات", ha: "Tambayoyi", id: "Pertanyaan", tl: "Mga tanong" };
DICT["Time per question"] = { ...(DICT["Time per question"] ?? {}), ar: "الوقت لكل سؤال", fr: "Temps par question", ur: "ہر سوال کا وقت", ha: "Lokaci kowace tambaya", id: "Waktu per pertanyaan", tl: "Oras bawat tanong" };
DICT["Ask the host for the room code."] = { ...(DICT["Ask the host for the room code."] ?? {}), ar: "اطلب رمز الغرفة من المضيف.", fr: "Demandez le code de la salle à l’hôte.", ur: "میزبان سے کمرے کا کوڈ پوچھیں۔", ha: "Tambayi mai masauki lambar ɗakin.", id: "Minta kode ruang ke tuan rumah.", tl: "Hingin sa host ang code ng room." };
DICT["Join"] = { ...(DICT["Join"] ?? {}), ar: "انضم", fr: "Rejoindre", ur: "شامل ہوں", ha: "Shiga", id: "Gabung", tl: "Sumali" };
DICT["Room code"] = { ...(DICT["Room code"] ?? {}), ar: "رمز الغرفة", fr: "Code de la salle", ur: "کمرے کا کوڈ", ha: "Lambar ɗaki", id: "Kode ruang", tl: "Code ng room" };
DICT["Copy code"] = { ...(DICT["Copy code"] ?? {}), ar: "نسخ الرمز", fr: "Copier le code", ur: "کوڈ کاپی کریں", ha: "Kwafi lamba", id: "Salin kode", tl: "Kopyahin ang code" };
DICT["In the room ("] = { ...(DICT["In the room ("] ?? {}), ar: "في الغرفة (", fr: "Dans la salle (", ur: "کمرے میں (", ha: "A cikin ɗaki (", id: "Di ruang (", tl: "Nasa room (" };
DICT["Waiting for the host to start…"] = { ...(DICT["Waiting for the host to start…"] ?? {}), ar: "بانتظار أن يبدأ المضيف…", fr: "En attente du lancement par l’hôte…", ur: "میزبان کے شروع کرنے کا انتظار…", ha: "Ana jiran mai masauki ya fara…", id: "Menunggu tuan rumah memulai…", tl: "Hinihintay ang host na magsimula…" };
DICT["Leave"] = { ...(DICT["Leave"] ?? {}), ar: "مغادرة", fr: "Quitter", ur: "چھوڑیں", ha: "Fita", id: "Keluar", tl: "Umalis" };
DICT["Family results"] = { ...(DICT["Family results"] ?? {}), ar: "نتائج العائلة", fr: "Résultats de la famille", ur: "خاندان کے نتائج", ha: "Sakamakon iyali", id: "Hasil keluarga", tl: "Resulta ng pamilya" };
DICT["Question {n} / {n}"] = { ...(DICT["Question {n} / {n}"] ?? {}), ar: "السؤال {n} / {n}", fr: "Question {n} / {n}", ur: "سوال {n} / {n}", ha: "Tambaya {n} / {n}", id: "Pertanyaan {n} / {n}", tl: "Tanong {n} / {n}" };
DICT["{n}s"] = { ...(DICT["{n}s"] ?? {}), ar: "{n} ث", fr: "{n} s", ur: "{n} سیکنڈ", ha: "daƙiƙa {n}", id: "{n} dtk", tl: "{n}s" };
DICT["Locked in. Waiting for the others… ({n}/{n})"] = { ...(DICT["Locked in. Waiting for the others… ({n}/{n})"] ?? {}), ar: "تم التثبيت. بانتظار الآخرين… ({n}/{n})", fr: "Réponse enregistrée. En attente des autres… ({n}/{n})", ur: "جواب محفوظ۔ دوسروں کا انتظار… ({n}/{n})", ha: "An kulle. Ana jiran sauran… ({n}/{n})", id: "Terkunci. Menunggu yang lain… ({n}/{n})", tl: "Naka-lock na. Hinihintay ang iba… ({n}/{n})" };
DICT["Reveal now"] = { ...(DICT["Reveal now"] ?? {}), ar: "اكشف الآن", fr: "Révéler maintenant", ur: "ابھی ظاہر کریں", ha: "Bayyana yanzu", id: "Tampilkan sekarang", tl: "Ipakita na" };
DICT["Got it right:"] = { ...(DICT["Got it right:"] ?? {}), ar: "أجاب بشكل صحيح:", fr: "Bonne réponse :", ur: "درست جواب:", ha: "Sun samu daidai:", id: "Jawaban benar:", tl: "Tama ang sagot:" };
DICT["nobody this time"] = { ...(DICT["nobody this time"] ?? {}), ar: "لا أحد هذه المرة", fr: "personne cette fois", ur: "اس بار کوئی نہیں", ha: "babu kowa a wannan karon", id: "tidak ada kali ini", tl: "walang nakatama ngayon" };
DICT["The host will start the next question."] = { ...(DICT["The host will start the next question."] ?? {}), ar: "سيبدأ المضيف السؤال التالي.", fr: "L’hôte lancera la question suivante.", ur: "میزبان اگلا سوال شروع کرے گا۔", ha: "Mai masauki zai fara tambaya ta gaba.", id: "Tuan rumah akan memulai pertanyaan berikutnya.", tl: "Sisimulan ng host ang susunod na tanong." };
DICT["Log in first."] = { ...(DICT["Log in first."] ?? {}), ar: "سجّل الدخول أولًا.", fr: "Connectez-vous d’abord.", ur: "پہلے لاگ ان کریں۔", ha: "Fara shiga tukuna.", id: "Masuk dulu.", tl: "Mag-log in muna." };
DICT["Enter the room code."] = { ...(DICT["Enter the room code."] ?? {}), ar: "أدخل رمز الغرفة.", fr: "Saisissez le code de la salle.", ur: "کمرے کا کوڈ درج کریں۔", ha: "Shigar da lambar ɗaki.", id: "Masukkan kode ruang.", tl: "Ilagay ang code ng room." };
DICT["No room with that code."] = { ...(DICT["No room with that code."] ?? {}), ar: "لا توجد غرفة بهذا الرمز.", fr: "Aucune salle avec ce code.", ur: "اس کوڈ کا کوئی کمرہ نہیں۔", ha: "Babu ɗaki da wannan lambar.", id: "Tidak ada ruang dengan kode itu.", tl: "Walang room na may code na iyan." };
DICT["This game has already started."] = { ...(DICT["This game has already started."] ?? {}), ar: "بدأت هذه اللعبة بالفعل.", fr: "Cette partie a déjà commencé.", ur: "یہ کھیل پہلے ہی شروع ہو چکا ہے۔", ha: "Wannan wasan ya riga ya fara.", id: "Permainan ini sudah dimulai.", tl: "Nagsimula na ang larong ito." };
DICT["Couldn't join. Check the code."] = { ...(DICT["Couldn't join. Check the code."] ?? {}), ar: "تعذّر الانضمام. تحقق من الرمز.", fr: "Impossible de rejoindre. Vérifiez le code.", ur: "شامل نہیں ہو سکے۔ کوڈ چیک کریں۔", ha: "An kasa shiga. Duba lambar.", id: "Gagal bergabung. Periksa kodenya.", tl: "Hindi makasali. Tingnan ang code." };
DICT["Couldn't create the room. Try again."] = { ...(DICT["Couldn't create the room. Try again."] ?? {}), ar: "تعذّر إنشاء الغرفة. حاول مرة أخرى.", fr: "Impossible de créer la salle. Réessayez.", ur: "کمرہ نہیں بن سکا۔ دوبارہ کوشش کریں۔", ha: "An kasa ƙirƙirar ɗakin. Sake gwadawa.", id: "Gagal membuat ruang. Coba lagi.", tl: "Hindi magawa ang room. Subukan muli." };
DICT["The room has closed."] = { ...(DICT["The room has closed."] ?? {}), ar: "أُغلقت الغرفة.", fr: "La salle est fermée.", ur: "کمرہ بند ہو گیا۔", ha: "An rufe ɗakin.", id: "Ruang telah ditutup.", tl: "Sarado na ang room." };
DICT["You’ve hosted today’s free games. Go Premium to host without limits, or join someone else’s room."] = { ...(DICT["You’ve hosted today’s free games. Go Premium to host without limits, or join someone else’s room."] ?? {}), ar: "لقد استضفت ألعاب اليوم المجانية. اشترك في بريميوم للاستضافة بلا حدود، أو انضم إلى غرفة شخص آخر.", fr: "Vous avez organisé les parties gratuites du jour. Passez à Premium pour organiser sans limite, ou rejoignez la salle de quelqu’un d’autre.", ur: "آپ آج کے مفت کھیلوں کی میزبانی کر چکے ہیں۔ بلا حد میزبانی کے لیے پریمیم لیں، یا کسی اور کے کمرے میں شامل ہوں۔", ha: "Ka gama wasannin kyauta na yau. Shiga Premium don masauki ba iyaka, ko ka shiga ɗakin wani.", id: "Anda sudah memandu permainan gratis hari ini. Jadi Premium untuk memandu tanpa batas, atau gabung ke ruang orang lain.", tl: "Nagamit mo na ang libreng laro ngayon. Mag-Premium para mag-host nang walang limitasyon, o sumali sa room ng iba." };
DICT["This topic is Premium. Premium hosts can play it with the whole family."] = { ...(DICT["This topic is Premium. Premium hosts can play it with the whole family."] ?? {}), ar: "هذا الموضوع ضمن بريميوم. يستطيع مضيفو بريميوم لعبه مع العائلة كلها.", fr: "Ce sujet est Premium. Les hôtes Premium peuvent y jouer avec toute la famille.", ur: "یہ موضوع پریمیم ہے۔ پریمیم میزبان اسے پورے خاندان کے ساتھ کھیل سکتے ہیں۔", ha: "Wannan jigon na Premium ne. Masu masaukin Premium za su iya buga shi da dukan iyali.", id: "Topik ini Premium. Tuan rumah Premium bisa memainkannya bersama seluruh keluarga.", tl: "Premium ang paksang ito. Puwede itong laruin ng Premium host kasama ang buong pamilya." };
DICT["Choose a free topic, or go Premium."] = { ...(DICT["Choose a free topic, or go Premium."] ?? {}), ar: "اختر موضوعًا مجانيًا، أو اشترك في بريميوم.", fr: "Choisissez un sujet gratuit, ou passez à Premium.", ur: "مفت موضوع چنیں، یا پریمیم لیں۔", ha: "Zaɓi jigo na kyauta, ko ka shiga Premium.", id: "Pilih topik gratis, atau jadi Premium.", tl: "Pumili ng libreng paksa, o mag-Premium." };
DICT["Share"] = { ...(DICT["Share"] ?? {}), ar: "مشاركة", fr: "Partager", ur: "شیئر کریں", ha: "Raba", id: "Bagikan", tl: "Ibahagi" };
DICT["Copied"] = { ...(DICT["Copied"] ?? {}), ar: "تم النسخ", fr: "Copié", ur: "کاپی ہو گیا", ha: "An kwafa", id: "Disalin", tl: "Nakopya" };
DICT["Start"] = { ...(DICT["Start"] ?? {}), ar: "ابدأ", fr: "Commencer", ur: "شروع کریں", ha: "Fara", id: "Mulai", tl: "Simulan" };
DICT["Next question"] = { ...(DICT["Next question"] ?? {}), ar: "السؤال التالي", fr: "Question suivante", ur: "اگلا سوال", ha: "Tambaya ta gaba", id: "Pertanyaan berikutnya", tl: "Susunod na tanong" };
DICT["See results"] = { ...(DICT["See results"] ?? {}), ar: "عرض النتائج", fr: "Voir les résultats", ur: "نتائج دیکھیں", ha: "Duba sakamako", id: "Lihat hasil", tl: "Tingnan ang resulta" };
DICT["Play again"] = { ...(DICT["Play again"] ?? {}), ar: "العب مجددًا", fr: "Rejouer", ur: "دوبارہ کھیلیں", ha: "Sake wasa", id: "Main lagi", tl: "Maglaro muli" };
DICT["Qur’an"] = { ...(DICT["Qur’an"] ?? {}), ar: "القرآن", fr: "Coran", ur: "قرآن", ha: "Alƙur’ani", id: "Al-Qur’an", tl: "Qur’an" };

DICT["✨ A new version of IlmStation is ready."] = { ...(DICT["✨ A new version of IlmStation is ready."] ?? {}), ar: "✨ إصدار جديد من IlmStation جاهز.", fr: "✨ Une nouvelle version d’IlmStation est prête.", ur: "✨ IlmStation کا نیا ورژن تیار ہے۔", ha: "✨ Sabon sigar IlmStation ta shirya.", id: "✨ Versi baru IlmStation sudah siap.", tl: "✨ Handa na ang bagong bersyon ng IlmStation." };
DICT["A new version of IlmStation is ready."] = { ...(DICT["A new version of IlmStation is ready."] ?? {}), ar: "إصدار جديد من IlmStation جاهز.", fr: "Une nouvelle version d’IlmStation est prête.", ur: "IlmStation کا نیا ورژن تیار ہے۔", ha: "Sabon sigar IlmStation ta shirya.", id: "Versi baru IlmStation sudah siap.", tl: "Handa na ang bagong bersyon ng IlmStation." };
DICT["Growth"] = { ...(DICT["Growth"] ?? {}), ar: "النمو", fr: "Évolution", ur: "ترقی", ha: "Girma", id: "Pertumbuhan", tl: "Paglago" };
DICT["Your learning record"] = { ...(DICT["Your learning record"] ?? {}), ar: "سجل تعلّمك", fr: "Votre parcours", ur: "آپ کا سیکھنے کا ریکارڈ", ha: "Rikodin koyonka", id: "Catatan belajarmu", tl: "Iyong talaan ng pag-aaral" };

DICT["{n} XP"] = { ...(DICT["{n} XP"] ?? {}), ar: "{n} نقطة", ur: "{n} XP" };

// Hifz page
DICT["IlmStation / Memorisation"] = { ...(DICT["IlmStation / Memorisation"] ?? {}), ar: "IlmStation / الحفظ", fr: "IlmStation / Mémorisation", ur: "IlmStation / حفظ", ha: "IlmStation / Haddar", id: "IlmStation / Hafalan", tl: "IlmStation / Pagsasaulo" };
DICT["Hifz workspace"] = { ...(DICT["Hifz workspace"] ?? {}), ar: "مساحة الحفظ", fr: "Espace de mémorisation", ur: "حفظ کی جگہ", ha: "Wurin haddar", id: "Ruang hafalan", tl: "Lugar ng pagsasaulo" };
DICT["Browser not supported"] = { ...(DICT["Browser not supported"] ?? {}), ar: "المتصفح غير مدعوم", fr: "Navigateur non pris en charge", ur: "براؤزر سپورٹ نہیں", ha: "Ba a goyon bayan wannan burauza", id: "Browser tidak didukung", tl: "Hindi suportado ang browser" };
DICT["Please open IlmStation in Chrome or Edge"] = { ...(DICT["Please open IlmStation in Chrome or Edge"] ?? {}), ar: "يُرجى فتح IlmStation في Chrome أو Edge", fr: "Veuillez ouvrir IlmStation dans Chrome ou Edge", ur: "براہِ کرم IlmStation کو Chrome یا Edge میں کھولیں", ha: "Da fatan ka buɗe IlmStation a Chrome ko Edge", id: "Silakan buka IlmStation di Chrome atau Edge", tl: "Pakibuksan ang IlmStation sa Chrome o Edge" };
DICT["Hifz listens to your recitation and checks it word by word, and that only works in Chrome or Edge on a laptop or an Android phone. iPhones and iPads are not supported yet."] = { ...(DICT["Hifz listens to your recitation and checks it word by word, and that only works in Chrome or Edge on a laptop or an Android phone. iPhones and iPads are not supported yet."] ?? {}), ar: "يستمع الحفظ إلى تلاوتك ويتحقق منها كلمة كلمة، ولا يعمل ذلك إلا في Chrome أو Edge على حاسوب أو هاتف أندرويد. أجهزة iPhone وiPad غير مدعومة بعد.", fr: "Le hifz écoute votre récitation et la vérifie mot par mot, ce qui ne fonctionne que dans Chrome ou Edge sur ordinateur ou téléphone Android. Les iPhone et iPad ne sont pas encore pris en charge.", ur: "حفظ آپ کی تلاوت سن کر لفظ بہ لفظ جانچتا ہے، اور یہ صرف لیپ ٹاپ یا اینڈرائیڈ فون پر Chrome یا Edge میں کام کرتا ہے۔ آئی فون اور آئی پیڈ ابھی سپورٹ نہیں۔", ha: "Haddar yana sauraron karatunka yana duba shi kalma-kalma, kuma hakan yana aiki ne kawai a Chrome ko Edge a kwamfuta ko wayar Android. Ba a goyon bayan iPhone da iPad tukuna.", id: "Hafalan mendengarkan bacaan Anda dan memeriksanya kata demi kata, dan itu hanya berfungsi di Chrome atau Edge pada laptop atau ponsel Android. iPhone dan iPad belum didukung.", tl: "Pinakikinggan ng Hifz ang iyong pagbigkas at sinusuri ito bawat salita, at gumagana lang ito sa Chrome o Edge sa laptop o Android phone. Hindi pa suportado ang iPhone at iPad." };
DICT["Memorised"] = { ...(DICT["Memorised"] ?? {}), ar: "المحفوظ", fr: "Mémorisé", ur: "حفظ شدہ", ha: "An haddace", id: "Dihafal", tl: "Naisaulo" };
DICT["Today's goal"] = { ...(DICT["Today's goal"] ?? {}), ar: "هدف اليوم", fr: "Objectif du jour", ur: "آج کا ہدف", ha: "Manufar yau", id: "Target hari ini", tl: "Layunin ngayon" };
DICT["Next session"] = { ...(DICT["Next session"] ?? {}), ar: "الجلسة القادمة", fr: "Prochaine séance", ur: "اگلا سیشن", ha: "Zama ta gaba", id: "Sesi berikutnya", tl: "Susunod na session" };
DICT["Tomorrow at"] = { ...(DICT["Tomorrow at"] ?? {}), ar: "غدًا الساعة", fr: "Demain à", ur: "کل", ha: "Gobe da", id: "Besok pukul", tl: "Bukas ng" };
DICT["Set your plan"] = { ...(DICT["Set your plan"] ?? {}), ar: "ضع خطتك", fr: "Définir votre plan", ur: "اپنا منصوبہ بنائیں", ha: "Saita tsarinka", id: "Atur rencanamu", tl: "Itakda ang plano mo" };
DICT["Start a streak today"] = { ...(DICT["Start a streak today"] ?? {}), ar: "ابدأ سلسلتك اليوم", fr: "Commencez une série aujourd’hui", ur: "آج تسلسل شروع کریں", ha: "Fara jerin kwanaki yau", id: "Mulai rangkaian hari ini", tl: "Magsimula ng streak ngayon" };
DICT["{n}.{n}% of the Qur'an"] = { ...(DICT["{n}.{n}% of the Qur'an"] ?? {}), ar: "{n}.{n}% من القرآن", fr: "{n},{n} % du Coran", ur: "قرآن کا {n}.{n}%", ha: "{n}.{n}% na Alƙur’ani", id: "{n},{n}% dari Al-Qur’an", tl: "{n}.{n}% ng Qur’an" };
DICT["Listening…"] = { ...(DICT["Listening…"] ?? {}), ar: "جارٍ الاستماع…", fr: "Écoute…", ur: "سن رہا ہے…", ha: "Ana saurare…", id: "Mendengarkan…", tl: "Nakikinig…" };
DICT["Listening..."] = { ...(DICT["Listening..."] ?? {}), ar: "جارٍ الاستماع…", fr: "Écoute…", ur: "سن رہا ہے…", ha: "Ana saurare…", id: "Mendengarkan…", tl: "Nakikinig…" };
DICT["Recite aloud"] = { ...(DICT["Recite aloud"] ?? {}), ar: "اقرأ بصوت مسموع", fr: "Récitez à voix haute", ur: "بلند آواز سے پڑھیں", ha: "Karanta da babbar murya", id: "Bacalah dengan suara", tl: "Bigkasin nang malakas" };
DICT["Recite from memory"] = { ...(DICT["Recite from memory"] ?? {}), ar: "اقرأ من حفظك", fr: "Récitez de mémoire", ur: "زبانی پڑھیں", ha: "Karanta daga haddace", id: "Baca dari hafalan", tl: "Bigkasin mula sa memorya" };
DICT["{n} words to fix, in red"] = { ...(DICT["{n} words to fix, in red"] ?? {}), ar: "{n} كلمات تحتاج تصحيحًا، باللون الأحمر", fr: "{n} mots à corriger, en rouge", ur: "{n} الفاظ درست کرنے ہیں، سرخ میں", ha: "Kalmomi {n} da za a gyara, cikin ja", id: "{n} kata perlu diperbaiki, berwarna merah", tl: "{n} salitang aayusin, nasa pula" };
DICT["Next verse"] = { ...(DICT["Next verse"] ?? {}), ar: "الآية التالية", fr: "Verset suivant", ur: "اگلی آیت", ha: "Aya ta gaba", id: "Ayat berikutnya", tl: "Susunod na talata" };

// Hifz page
DICT["IlmStation / Memorisation"] = { ...(DICT["IlmStation / Memorisation"] ?? {}), ar: "IlmStation / الحفظ", fr: "IlmStation / Mémorisation", ur: "IlmStation / حفظ", ha: "IlmStation / Haddar", id: "IlmStation / Hafalan", tl: "IlmStation / Pagsasaulo" };
DICT["Hifz workspace"] = { ...(DICT["Hifz workspace"] ?? {}), ar: "مساحة الحفظ", fr: "Espace de mémorisation", ur: "حفظ کی جگہ", ha: "Wurin haddar", id: "Ruang hafalan", tl: "Lugar ng pagsasaulo" };
DICT["Browser not supported"] = { ...(DICT["Browser not supported"] ?? {}), ar: "المتصفح غير مدعوم", fr: "Navigateur non pris en charge", ur: "براؤزر سپورٹ نہیں", ha: "Ba a goyon bayan wannan burauza", id: "Browser tidak didukung", tl: "Hindi suportado ang browser" };
DICT["Please open IlmStation in Chrome or Edge"] = { ...(DICT["Please open IlmStation in Chrome or Edge"] ?? {}), ar: "يُرجى فتح IlmStation في Chrome أو Edge", fr: "Veuillez ouvrir IlmStation dans Chrome ou Edge", ur: "براہِ کرم IlmStation کو Chrome یا Edge میں کھولیں", ha: "Da fatan ka buɗe IlmStation a Chrome ko Edge", id: "Silakan buka IlmStation di Chrome atau Edge", tl: "Pakibuksan ang IlmStation sa Chrome o Edge" };
DICT["Hifz listens to your recitation and checks it word by word, and that only works in Chrome or Edge on a laptop or an Android phone. iPhones and iPads are not supported yet."] = { ...(DICT["Hifz listens to your recitation and checks it word by word, and that only works in Chrome or Edge on a laptop or an Android phone. iPhones and iPads are not supported yet."] ?? {}), ar: "يستمع الحفظ إلى تلاوتك ويتحقق منها كلمة كلمة، ولا يعمل ذلك إلا في Chrome أو Edge على حاسوب أو هاتف أندرويد. أجهزة iPhone وiPad غير مدعومة بعد.", fr: "Le hifz écoute votre récitation et la vérifie mot par mot, ce qui ne fonctionne que dans Chrome ou Edge sur ordinateur ou téléphone Android. Les iPhone et iPad ne sont pas encore pris en charge.", ur: "حفظ آپ کی تلاوت سن کر لفظ بہ لفظ جانچتا ہے، اور یہ صرف لیپ ٹاپ یا اینڈرائیڈ فون پر Chrome یا Edge میں کام کرتا ہے۔ آئی فون اور آئی پیڈ ابھی سپورٹ نہیں۔", ha: "Haddar yana sauraron karatunka yana duba shi kalma-kalma, kuma hakan yana aiki ne kawai a Chrome ko Edge a kwamfuta ko wayar Android. Ba a goyon bayan iPhone da iPad tukuna.", id: "Hafalan mendengarkan bacaan Anda dan memeriksanya kata demi kata, dan itu hanya berfungsi di Chrome atau Edge pada laptop atau ponsel Android. iPhone dan iPad belum didukung.", tl: "Pinakikinggan ng Hifz ang iyong pagbigkas at sinusuri ito bawat salita, at gumagana lang ito sa Chrome o Edge sa laptop o Android phone. Hindi pa suportado ang iPhone at iPad." };
DICT["Memorised"] = { ...(DICT["Memorised"] ?? {}), ar: "المحفوظ", fr: "Mémorisé", ur: "حفظ شدہ", ha: "An haddace", id: "Dihafal", tl: "Naisaulo" };
DICT["Today's goal"] = { ...(DICT["Today's goal"] ?? {}), ar: "هدف اليوم", fr: "Objectif du jour", ur: "آج کا ہدف", ha: "Manufar yau", id: "Target hari ini", tl: "Layunin ngayon" };
DICT["Next session"] = { ...(DICT["Next session"] ?? {}), ar: "الجلسة القادمة", fr: "Prochaine séance", ur: "اگلا سیشن", ha: "Zama ta gaba", id: "Sesi berikutnya", tl: "Susunod na session" };
DICT["Tomorrow at"] = { ...(DICT["Tomorrow at"] ?? {}), ar: "غدًا الساعة", fr: "Demain à", ur: "کل", ha: "Gobe da", id: "Besok pukul", tl: "Bukas ng" };
DICT["Set your plan"] = { ...(DICT["Set your plan"] ?? {}), ar: "ضع خطتك", fr: "Définir votre plan", ur: "اپنا منصوبہ بنائیں", ha: "Saita tsarinka", id: "Atur rencanamu", tl: "Itakda ang plano mo" };
DICT["Start a streak today"] = { ...(DICT["Start a streak today"] ?? {}), ar: "ابدأ سلسلتك اليوم", fr: "Commencez une série aujourd’hui", ur: "آج تسلسل شروع کریں", ha: "Fara jerin kwanaki yau", id: "Mulai rangkaian hari ini", tl: "Magsimula ng streak ngayon" };
DICT["{n}.{n}% of the Qur'an"] = { ...(DICT["{n}.{n}% of the Qur'an"] ?? {}), ar: "{n}.{n}% من القرآن", fr: "{n},{n} % du Coran", ur: "قرآن کا {n}.{n}%", ha: "{n}.{n}% na Alƙur’ani", id: "{n},{n}% dari Al-Qur’an", tl: "{n}.{n}% ng Qur’an" };
DICT["Listening…"] = { ...(DICT["Listening…"] ?? {}), ar: "جارٍ الاستماع…", fr: "Écoute…", ur: "سن رہا ہے…", ha: "Ana saurare…", id: "Mendengarkan…", tl: "Nakikinig…" };
DICT["Listening..."] = { ...(DICT["Listening..."] ?? {}), ar: "جارٍ الاستماع…", fr: "Écoute…", ur: "سن رہا ہے…", ha: "Ana saurare…", id: "Mendengarkan…", tl: "Nakikinig…" };
DICT["Recite aloud"] = { ...(DICT["Recite aloud"] ?? {}), ar: "اقرأ بصوت مسموع", fr: "Récitez à voix haute", ur: "بلند آواز سے پڑھیں", ha: "Karanta da babbar murya", id: "Bacalah dengan suara", tl: "Bigkasin nang malakas" };
DICT["Recite from memory"] = { ...(DICT["Recite from memory"] ?? {}), ar: "اقرأ من حفظك", fr: "Récitez de mémoire", ur: "زبانی پڑھیں", ha: "Karanta daga haddace", id: "Baca dari hafalan", tl: "Bigkasin mula sa memorya" };
DICT["{n} words to fix, in red"] = { ...(DICT["{n} words to fix, in red"] ?? {}), ar: "{n} كلمات تحتاج تصحيحًا، باللون الأحمر", fr: "{n} mots à corriger, en rouge", ur: "{n} الفاظ درست کرنے ہیں، سرخ میں", ha: "Kalmomi {n} da za a gyara, cikin ja", id: "{n} kata perlu diperbaiki, berwarna merah", tl: "{n} salitang aayusin, nasa pula" };
DICT["Next verse"] = { ...(DICT["Next verse"] ?? {}), ar: "الآية التالية", fr: "Verset suivant", ur: "اگلی آیت", ha: "Aya ta gaba", id: "Ayat berikutnya", tl: "Susunod na talata" };

DICT["Hifz listens to your recitation and checks it word by word. Use Chrome or Edge on a computer or Android phone, or Safari on iPhone with Siri & Dictation turned on (Settings → Siri)."] = { ar: "يستمع الحفظ إلى تلاوتك ويتحقق منها كلمة كلمة. استخدم Chrome أو Edge على حاسوب أو هاتف أندرويد، أو Safari على iPhone مع تفعيل Siri والإملاء (الإعدادات ← Siri).", fr: "Le hifz écoute votre récitation et la vérifie mot par mot. Utilisez Chrome ou Edge sur ordinateur ou Android, ou Safari sur iPhone avec Siri et Dictée activés (Réglages → Siri).", ur: "حفظ آپ کی تلاوت سن کر لفظ بہ لفظ جانچتا ہے۔ کمپیوٹر یا اینڈرائیڈ پر Chrome یا Edge استعمال کریں، یا آئی فون پر Safari، Siri اور ڈکٹیشن آن کر کے (Settings → Siri)۔", ha: "Haddar yana sauraron karatunka yana duba shi kalma-kalma. Yi amfani da Chrome ko Edge a kwamfuta ko Android, ko Safari a iPhone tare da kunna Siri da Dictation (Settings → Siri).", id: "Hafalan mendengarkan bacaan Anda dan memeriksanya kata demi kata. Gunakan Chrome atau Edge di komputer atau Android, atau Safari di iPhone dengan Siri & Dikte aktif (Pengaturan → Siri).", tl: "Pinakikinggan ng Hifz ang pagbigkas mo at sinusuri bawat salita. Gamitin ang Chrome o Edge sa computer o Android, o Safari sa iPhone na naka-on ang Siri at Dictation (Settings → Siri)." };

DICT["Check the red words, then continue."] = { ar: "راجع الكلمات الحمراء ثم تابع.", fr: "Vérifiez les mots en rouge, puis continuez.", ur: "سرخ الفاظ دیکھیں، پھر جاری رکھیں۔", ha: "Duba kalmomin ja, sannan ka ci gaba.", id: "Periksa kata yang merah, lalu lanjutkan.", tl: "Tingnan ang mga pulang salita, saka magpatuloy." };

DICT["My Hifz portion"] = { ...(DICT["My Hifz portion"] ?? {}), ar: "حصتي من الحفظ", fr: "Ma partie de hifz", ur: "میرا حفظ کا حصہ", ha: "Rabona na haddar", id: "Bagian hafalanku", tl: "Aking bahagi sa Hifz" };
DICT["Review what you’ve memorised in the app"] = { ...(DICT["Review what you’ve memorised in the app"] ?? {}), ar: "راجع ما حفظته في التطبيق", fr: "Révisez ce que vous avez mémorisé dans l’app", ur: "ایپ میں حفظ کیا ہوا دہرائیں", ha: "Yi bitar abin da ka haddace a manhajar", id: "Ulangi hafalanmu di aplikasi", tl: "Balikan ang naisaulo mo sa app" };
DICT["Any part of the Qur’an"] = { ...(DICT["Any part of the Qur’an"] ?? {}), ar: "أي جزء من القرآن", fr: "N’importe quelle partie du Coran", ur: "قرآن کا کوئی بھی حصہ", ha: "Kowane sashe na Alƙur’ani", id: "Bagian mana pun dari Al-Qur’an", tl: "Anumang bahagi ng Qur’an" };
DICT["Choose a surah and verses to revise from memory"] = { ...(DICT["Choose a surah and verses to revise from memory"] ?? {}), ar: "اختر سورة وآيات لمراجعتها من حفظك", fr: "Choisissez une sourate et des versets à réviser de mémoire", ur: "زبانی دہرانے کے لیے سورت اور آیات چنیں", ha: "Zaɓi sura da ayoyi don bita daga haddace", id: "Pilih surah dan ayat untuk diulang dari hafalan", tl: "Pumili ng surah at mga talata na babalikan mula sa memorya" };
DICT["Free revision"] = { ...(DICT["Free revision"] ?? {}), ar: "مراجعة حرة", fr: "Révision libre", ur: "آزاد دہرائی", ha: "Bita kyauta", id: "Murajaah bebas", tl: "Malayang pagbabalik-aral" };
DICT["Surah"] = { ...(DICT["Surah"] ?? {}), ar: "السورة", fr: "Sourate", ur: "سورت", ha: "Sura", id: "Surah", tl: "Surah" };
DICT["From verse"] = { ...(DICT["From verse"] ?? {}), ar: "من الآية", fr: "Du verset", ur: "آیت سے", ha: "Daga aya", id: "Dari ayat", tl: "Mula sa talata" };
DICT["To verse"] = { ...(DICT["To verse"] ?? {}), ar: "إلى الآية", fr: "Au verset", ur: "آیت تک", ha: "Zuwa aya", id: "Sampai ayat", tl: "Hanggang talata" };
DICT["Recite this verse from memory…"] = { ...(DICT["Recite this verse from memory…"] ?? {}), ar: "اقرأ هذه الآية من حفظك…", fr: "Récitez ce verset de mémoire…", ur: "یہ آیت زبانی پڑھیں…", ha: "Karanta wannan aya daga haddace…", id: "Bacalah ayat ini dari hafalan…", tl: "Bigkasin ang talatang ito mula sa memorya…" };
DICT["Not quite. Say it again."] = { ...(DICT["Not quite. Say it again."] ?? {}), ar: "ليس تمامًا. أعدها.", fr: "Pas tout à fait. Répétez.", ur: "بالکل نہیں۔ دوبارہ پڑھیں۔", ha: "Ba daidai ba. Sake karantawa.", id: "Belum tepat. Ulangi.", tl: "Hindi pa. Ulitin." };
DICT["Listen again"] = { ...(DICT["Listen again"] ?? {}), ar: "استمع مجددًا", fr: "Réécouter", ur: "دوبارہ سنیں", ha: "Sake saurare", id: "Dengarkan lagi", tl: "Makinig muli" };
DICT["Again"] = { ...(DICT["Again"] ?? {}), ar: "مرة أخرى", fr: "Encore", ur: "دوبارہ", ha: "Kuma", id: "Lagi", tl: "Muli" };
DICT["Choose another part"] = { ...(DICT["Choose another part"] ?? {}), ar: "اختر جزءًا آخر", fr: "Choisir une autre partie", ur: "کوئی اور حصہ چنیں", ha: "Zaɓi wani sashe", id: "Pilih bagian lain", tl: "Pumili ng ibang bahagi" };
DICT["Stop"] = { ...(DICT["Stop"] ?? {}), ar: "إيقاف", fr: "Arrêter", ur: "روکیں", ha: "Tsaya", id: "Berhenti", tl: "Ihinto" };
DICT["Try again"] = { ...(DICT["Try again"] ?? {}), ar: "حاول مرة أخرى", fr: "Réessayer", ur: "دوبارہ کوشش کریں", ha: "Sake gwadawa", id: "Coba lagi", tl: "Subukan muli" };

DICT["Show page"] = { ...(DICT["Show page"] ?? {}), ar: "إظهار الصفحة", fr: "Afficher la page", ur: "صفحہ دکھائیں", ha: "Nuna shafi", id: "Tampilkan halaman", tl: "Ipakita ang pahina" };
DICT["Hide page"] = { ...(DICT["Hide page"] ?? {}), ar: "إخفاء الصفحة", fr: "Masquer la page", ur: "صفحہ چھپائیں", ha: "Ɓoye shafi", id: "Sembunyikan halaman", tl: "Itago ang pahina" };
DICT["🎙️ Recite"] = { ...(DICT["🎙️ Recite"] ?? {}), ar: "🎙️ اقرأ", fr: "🎙️ Réciter", ur: "🎙️ پڑھیں", ha: "🎙️ Karanta", id: "🎙️ Baca", tl: "🎙️ Bigkasin" };
DICT["🔒 Recite"] = { ...(DICT["🔒 Recite"] ?? {}), ar: "🔒 اقرأ", fr: "🔒 Réciter", ur: "🔒 پڑھیں", ha: "🔒 Karanta", id: "🔒 Baca", tl: "🔒 Bigkasin" };
DICT["■ Stop"] = { ...(DICT["■ Stop"] ?? {}), ar: "■ إيقاف", fr: "■ Arrêter", ur: "■ روکیں", ha: "■ Tsaya", id: "■ Berhenti", tl: "■ Ihinto" };
DICT["Voice correction is Premium. Go Premium to revise by reciting."] = { ...(DICT["Voice correction is Premium. Go Premium to revise by reciting."] ?? {}), ar: "التصحيح الصوتي ضمن بريميوم. اشترك لتراجع بالتلاوة.", fr: "La correction vocale est Premium. Passez à Premium pour réviser en récitant.", ur: "آواز سے درستگی پریمیم ہے۔ تلاوت کر کے دہرانے کے لیے پریمیم لیں۔", ha: "Gyaran murya na Premium ne. Shiga Premium don yin bita da karatu.", id: "Koreksi suara adalah Premium. Jadi Premium untuk murajaah dengan membaca.", tl: "Premium ang pagwawasto gamit ang boses. Mag-Premium para magbalik-aral sa pagbigkas." };
DICT["Check the red words, then recite the verse again."] = { ...(DICT["Check the red words, then recite the verse again."] ?? {}), ar: "راجع الكلمات الحمراء ثم اقرأ الآية مجددًا.", fr: "Vérifiez les mots en rouge, puis récitez le verset à nouveau.", ur: "سرخ الفاظ دیکھیں، پھر آیت دوبارہ پڑھیں۔", ha: "Duba kalmomin ja, sannan ka sake karanta ayar.", id: "Periksa kata yang merah, lalu baca ayat itu lagi.", tl: "Tingnan ang mga pulang salita, saka bigkasin muli ang talata." };
DICT["Page complete. Masha’Allah!"] = { ...(DICT["Page complete. Masha’Allah!"] ?? {}), ar: "اكتملت الصفحة. ما شاء الله!", fr: "Page terminée. Masha’Allah !", ur: "صفحہ مکمل۔ ماشاءاللہ!", ha: "An gama shafin. Masha’Allah!", id: "Halaman selesai. Masya Allah!", tl: "Tapos ang pahina. Masha’Allah!" };
DICT["Listening · verse {n}"] = { ...(DICT["Listening · verse {n}"] ?? {}), ar: "جارٍ الاستماع · الآية {n}", fr: "Écoute · verset {n}", ur: "سن رہا ہے · آیت {n}", ha: "Ana saurare · aya {n}", id: "Mendengarkan · ayat {n}", tl: "Nakikinig · talata {n}" };

DICT["Show page"] = { ...(DICT["Show page"] ?? {}), ar: "إظهار الصفحة", fr: "Afficher la page", ur: "صفحہ دکھائیں", ha: "Nuna shafi", id: "Tampilkan halaman", tl: "Ipakita ang pahina" };
DICT["Hide page"] = { ...(DICT["Hide page"] ?? {}), ar: "إخفاء الصفحة", fr: "Masquer la page", ur: "صفحہ چھپائیں", ha: "Ɓoye shafi", id: "Sembunyikan halaman", tl: "Itago ang pahina" };
DICT["🎙️ Recite"] = { ...(DICT["🎙️ Recite"] ?? {}), ar: "🎙️ اقرأ", fr: "🎙️ Réciter", ur: "🎙️ پڑھیں", ha: "🎙️ Karanta", id: "🎙️ Baca", tl: "🎙️ Bigkasin" };
DICT["🔒 Recite"] = { ...(DICT["🔒 Recite"] ?? {}), ar: "🔒 اقرأ", fr: "🔒 Réciter", ur: "🔒 پڑھیں", ha: "🔒 Karanta", id: "🔒 Baca", tl: "🔒 Bigkasin" };
DICT["■ Stop"] = { ...(DICT["■ Stop"] ?? {}), ar: "■ إيقاف", fr: "■ Arrêter", ur: "■ روکیں", ha: "■ Tsaya", id: "■ Berhenti", tl: "■ Ihinto" };
DICT["Voice correction is Premium. Go Premium to revise by reciting."] = { ...(DICT["Voice correction is Premium. Go Premium to revise by reciting."] ?? {}), ar: "التصحيح الصوتي ضمن بريميوم. اشترك لتراجع بالتلاوة.", fr: "La correction vocale est Premium. Passez à Premium pour réviser en récitant.", ur: "آواز سے درستگی پریمیم ہے۔ تلاوت کر کے دہرانے کے لیے پریمیم لیں۔", ha: "Gyaran murya na Premium ne. Shiga Premium don yin bita da karatu.", id: "Koreksi suara adalah Premium. Jadi Premium untuk murajaah dengan membaca.", tl: "Premium ang pagwawasto gamit ang boses. Mag-Premium para magbalik-aral sa pagbigkas." };
DICT["Check the red words, then recite the verse again."] = { ...(DICT["Check the red words, then recite the verse again."] ?? {}), ar: "راجع الكلمات الحمراء ثم اقرأ الآية مجددًا.", fr: "Vérifiez les mots en rouge, puis récitez le verset à nouveau.", ur: "سرخ الفاظ دیکھیں، پھر آیت دوبارہ پڑھیں۔", ha: "Duba kalmomin ja, sannan ka sake karanta ayar.", id: "Periksa kata yang merah, lalu baca ayat itu lagi.", tl: "Tingnan ang mga pulang salita, saka bigkasin muli ang talata." };
DICT["Page complete. Masha’Allah!"] = { ...(DICT["Page complete. Masha’Allah!"] ?? {}), ar: "اكتملت الصفحة. ما شاء الله!", fr: "Page terminée. Masha’Allah !", ur: "صفحہ مکمل۔ ماشاءاللہ!", ha: "An gama shafin. Masha’Allah!", id: "Halaman selesai. Masya Allah!", tl: "Tapos ang pahina. Masha’Allah!" };
DICT["Listening · verse {n}"] = { ...(DICT["Listening · verse {n}"] ?? {}), ar: "جارٍ الاستماع · الآية {n}", fr: "Écoute · verset {n}", ur: "سن رہا ہے · آیت {n}", ha: "Ana saurare · aya {n}", id: "Mendengarkan · ayat {n}", tl: "Nakikinig · talata {n}" };

DICT["Add this page to your memorised verses? It joins My Hifz portion and gets revision reminders."] = { ...(DICT["Add this page to your memorised verses? It joins My Hifz portion and gets revision reminders."] ?? {}), ar: "هل تضيف هذه الصفحة إلى محفوظك؟ ستنضم إلى حصتك من الحفظ وتصلك تذكيرات المراجعة.", fr: "Ajouter cette page à vos versets mémorisés ? Elle rejoint votre partie de hifz et reçoit des rappels de révision.", ur: "یہ صفحہ اپنے حفظ میں شامل کریں؟ یہ آپ کے حفظ کے حصے میں شامل ہو جائے گا اور دہرائی کی یاد دہانیاں ملیں گی۔", ha: "Ƙara wannan shafi cikin abin da ka haddace? Zai shiga rabonka na haddar ya samu tunatarwar bita.", id: "Tambahkan halaman ini ke hafalanmu? Akan masuk ke bagian hafalanmu dan mendapat pengingat murajaah.", tl: "Idagdag ang pahinang ito sa iyong naisaulo? Mapapasama ito sa iyong bahagi sa Hifz at magkakaroon ng paalala sa pagbabalik-aral." };
DICT["✅ Add to my memorised"] = { ...(DICT["✅ Add to my memorised"] ?? {}), ar: "✅ أضف إلى محفوظي", fr: "✅ Ajouter à mes mémorisés", ur: "✅ میرے حفظ میں شامل کریں", ha: "✅ Ƙara cikin haddata", id: "✅ Tambahkan ke hafalanku", tl: "✅ Idagdag sa aking naisaulo" };
DICT["Added to your memorised verses"] = { ...(DICT["Added to your memorised verses"] ?? {}), ar: "أُضيفت إلى محفوظك", fr: "Ajouté à vos versets mémorisés", ur: "آپ کے حفظ میں شامل ہو گیا", ha: "An ƙara cikin abin da ka haddace", id: "Ditambahkan ke hafalanmu", tl: "Naidagdag sa iyong naisaulo" };
DICT["Next page"] = { ...(DICT["Next page"] ?? {}), ar: "الصفحة التالية", fr: "Page suivante", ur: "اگلا صفحہ", ha: "Shafi na gaba", id: "Halaman berikutnya", tl: "Susunod na pahina" };

DICT["🔊 Hear this verse"] = { ...(DICT["🔊 Hear this verse"] ?? {}), ar: "🔊 استمع إلى هذه الآية", fr: "🔊 Écouter ce verset", ur: "🔊 یہ آیت سنیں", ha: "🔊 Saurari wannan aya", id: "🔊 Dengarkan ayat ini", tl: "🔊 Pakinggan ang talatang ito" };
DICT["Couldn't play the recitation."] = { ...(DICT["Couldn't play the recitation."] ?? {}), ar: "تعذّر تشغيل التلاوة.", fr: "Impossible de lire la récitation.", ur: "تلاوت نہیں چل سکی۔", ha: "An kasa kunna karatun.", id: "Gagal memutar bacaan.", tl: "Hindi ma-play ang pagbigkas." };
// study level names (stage names show as "<Level> <n>")
const LEVELS: Record<string, T> = {
  "Preparatory": { ar: "التمهيدي", fr: "Préparatoire", ur: "ابتدائی", ha: "Share Fage", id: "Persiapan", tl: "Paghahanda" },
  "Beginner": { ar: "المبتدئ", fr: "Débutant", ur: "بیگنر", ha: "Mafari", id: "Pemula", tl: "Beginner" },
  "Intermediate": { ar: "المتوسط", fr: "Intermédiaire", ur: "متوسط", ha: "Matsakaici", id: "Menengah", tl: "Intermediate" },
  "Advanced": { ar: "المتقدم", fr: "Avancé", ur: "اعلیٰ", ha: "Babba", id: "Lanjutan", tl: "Advanced" },
};
for (const [k, v] of Object.entries(LEVELS)) {
  DICT[k] = { ...v, ...(DICT[k] ?? {}) };
  DICT[`${k} {n}`] = { ...Object.fromEntries(Object.entries(v).map(([l, w]) => [l, `${w} {n}`])), ...(DICT[`${k} {n}`] ?? {}) };
}
DICT["Qira'ah"] = { ar: "القراءة", fr: "Qira'ah", ur: "قراءت", ha: "Qira'ah", id: "Qira'ah", tl: "Qira'ah", ...(DICT["Qira'ah"] ?? {}) };

// Study pages + lesson titles (Qira'ah). Fills gaps only; existing entries win.
const STUDY: Record<string, T> = {
"Start ▶": {
"ar": "ابدأ ◀",
"fr": "Commencer ▶",
"ur": "شروع ◀",
"ha": "Fara ▶",
"id": "Mulai ▶",
"tl": "Simula ▶"
},
"Continue ▶": {
"ar": "تابع ◀",
"fr": "Continuer ▶",
"ur": "جاری رکھیں ◀",
"ha": "Ci gaba ▶",
"id": "Lanjut ▶",
"tl": "Magpatuloy ▶"
},
"Review": {
"ar": "مراجعة",
"fr": "Révision",
"ur": "جائزہ",
"ha": "Bita",
"id": "Ulasan",
"tl": "Pagbabalik-aral"
},
"Aisha & Khadija": {
"ar": "عائشة وخديجة",
"fr": "Aïcha et Khadija",
"ur": "عائشہ اور خدیجہ",
"ha": "Aisha da Khadija",
"id": "Aisyah dan Khadijah",
"tl": "Aisha at Khadija"
},
"All {n} letters": {
"ar": "الحروف الـ{n} كلها",
"fr": "Les {n} lettres",
"ur": "تمام {n} حروف",
"ha": "Dukan baƙaƙe {n}",
"id": "Semua {n} huruf",
"tl": "Lahat ng {n} titik"
},
"Allah's Blessings": {
"ar": "نِعَم الله",
"fr": "Les bienfaits d'Allah",
"ur": "اللہ کی نعمتیں",
"ha": "Ni'imomin Allah",
"id": "Nikmat-nikmat Allah",
"tl": "Mga Biyaya ni Allah"
},
"Allah's Greatness": {
"ar": "عظمة الله",
"fr": "La grandeur d'Allah",
"ur": "اللہ کی عظمت",
"ha": "Girman Allah",
"id": "Keagungan Allah",
"tl": "Ang Kadakilaan ni Allah"
},
"Alphabet Review": {
"ar": "مراجعة الحروف الهجائية",
"fr": "Révision de l'alphabet",
"ur": "حروفِ تہجی کا جائزہ",
"ha": "Bitar Baƙaƙe",
"id": "Ulasan Huruf Hijaiyah",
"tl": "Pagbabalik-aral sa Alpabeto"
},
"Alphabet review": {
"ar": "مراجعة الحروف الهجائية",
"fr": "Révision de l'alphabet",
"ur": "حروفِ تہجی کا جائزہ",
"ha": "Bitar baƙaƙe",
"id": "Ulasan huruf hijaiyah",
"tl": "Pagbabalik-aral sa alpabeto"
},
"Big Final Check": {
"ar": "الاختبار الكبير الأخير",
"fr": "Le grand contrôle final",
"ur": "بڑا آخری امتحان",
"ha": "Babban Jarrabawar Ƙarshe",
"id": "Ujian Akhir Besar",
"tl": "Malaking Huling Pagsusulit"
},
"Big Review {n}": {
"ar": "مراجعة كبيرة {n}",
"fr": "Grande révision {n}",
"ur": "بڑا جائزہ {n}",
"ha": "Babbar Bita {n}",
"id": "Ulasan Besar {n}",
"tl": "Malaking Pagbabalik-aral {n}"
},
"Damma": {
"ar": "الضمة",
"fr": "Damma",
"ur": "پیش",
"ha": "Damma",
"id": "Dhammah",
"tl": "Damma"
},
"Damma Words": {
"ar": "كلمات بالضمة",
"fr": "Mots avec damma",
"ur": "پیش والے الفاظ",
"ha": "Kalmomin Damma",
"id": "Kata-kata Dhammah",
"tl": "Mga Salitang may Damma"
},
"Damma Words in Two Steps": {
"ar": "كلمات بالضمة على خطوتين",
"fr": "Mots avec damma en deux étapes",
"ur": "پیش والے الفاظ دو مرحلوں میں",
"ha": "Kalmomin Damma a Matakai Biyu",
"id": "Kata-kata Dhammah dalam Dua Langkah",
"tl": "Mga Salitang may Damma sa Dalawang Hakbang"
},
"Fatha": {
"ar": "الفتحة",
"fr": "Fatha",
"ur": "زبر",
"ha": "Fatha",
"id": "Fathah",
"tl": "Fatha"
},
"First Words": {
"ar": "الكلمات الأولى",
"fr": "Premiers mots",
"ur": "پہلے الفاظ",
"ha": "Kalmomin Farko",
"id": "Kata-kata Pertama",
"tl": "Mga Unang Salita"
},
"Hamza in the Middle & at the End": {
"ar": "الهمزة في الوسط وفي الآخر",
"fr": "La hamza au milieu et à la fin",
"ur": "درمیان اور آخر میں ہمزہ",
"ha": "Hamza a Tsakiya da a Ƙarshe",
"id": "Hamzah di Tengah dan di Akhir",
"tl": "Hamza sa Gitna at sa Dulo"
},
"Hamza in the Middle {n}": {
"ar": "الهمزة في الوسط {n}",
"fr": "La hamza au milieu {n}",
"ur": "درمیان میں ہمزہ {n}",
"ha": "Hamza a Tsakiya {n}",
"id": "Hamzah di Tengah {n}",
"tl": "Hamza sa Gitna {n}"
},
"Hamzatul Wasl & the Moon Laam": {
"ar": "همزة الوصل واللام القمرية",
"fr": "La hamzat al-wasl et le lam lunaire",
"ur": "ہمزۃ الوصل اور لامِ قمری",
"ha": "Hamzatul Wasl da Laamul Qamariyya",
"id": "Hamzah Washal dan Lam Qamariyah",
"tl": "Hamzatul Wasl at ang Laam ng Buwan"
},
"Harakat Review": {
"ar": "مراجعة الحركات",
"fr": "Révision des harakat",
"ur": "حرکات کا جائزہ",
"ha": "Bitar Harakoki",
"id": "Ulasan Harakat",
"tl": "Pagbabalik-aral sa Harakat"
},
"Kasra": {
"ar": "الكسرة",
"fr": "Kasra",
"ur": "زیر",
"ha": "Kasra",
"id": "Kasrah",
"tl": "Kasra"
},
"Kasra Phrases": {
"ar": "جمل بالكسرة",
"fr": "Phrases avec kasra",
"ur": "زیر والے جملے",
"ha": "Jimlolin Kasra",
"id": "Kalimat Kasrah",
"tl": "Mga Pariralang may Kasra"
},
"Kasra Words": {
"ar": "كلمات بالكسرة",
"fr": "Mots avec kasra",
"ur": "زیر والے الفاظ",
"ha": "Kalmomin Kasra",
"id": "Kata-kata Kasrah",
"tl": "Mga Salitang may Kasra"
},
"Kasra Words in Two Steps": {
"ar": "كلمات بالكسرة على خطوتين",
"fr": "Mots avec kasra en deux étapes",
"ur": "زیر والے الفاظ دو مرحلوں میں",
"ha": "Kalmomin Kasra a Matakai Biyu",
"id": "Kata-kata Kasrah dalam Dua Langkah",
"tl": "Mga Salitang may Kasra sa Dalawang Hakbang"
},
"Letter Shapes": {
"ar": "أشكال الحروف",
"fr": "Les formes des lettres",
"ur": "حروف کی شکلیں",
"ha": "Siffofin Baƙaƙe",
"id": "Bentuk Huruf",
"tl": "Mga Hugis ng Titik"
},
"Letters Read but Not Written": {
"ar": "حروف تُنطق ولا تُكتب",
"fr": "Lettres lues mais non écrites",
"ur": "وہ حروف جو پڑھے جاتے ہیں مگر لکھے نہیں جاتے",
"ha": "Baƙaƙen da ake Karantawa amma Ba a Rubuta Su",
"id": "Huruf yang Dibaca tapi Tidak Ditulis",
"tl": "Mga Titik na Binabasa pero Hindi Isinusulat"
},
"Look-alike Letters": {
"ar": "الحروف المتشابهة",
"fr": "Les lettres qui se ressemblent",
"ur": "ملتے جلتے حروف",
"ha": "Baƙaƙe Masu Kama da Juna",
"id": "Huruf yang Mirip",
"tl": "Magkakamukhang Titik"
},
"Madd Practice": {
"ar": "تدريب على المدّ",
"fr": "Entraînement au madd",
"ur": "مد کی مشق",
"ha": "Atisayen Madda",
"id": "Latihan Mad",
"tl": "Pagsasanay sa Madd"
},
"Madd Review {n}": {
"ar": "مراجعة المدّ {n}",
"fr": "Révision du madd {n}",
"ur": "مد کا جائزہ {n}",
"ha": "Bitar Madda {n}",
"id": "Ulasan Mad {n}",
"tl": "Pagbabalik-aral sa Madd {n}"
},
"Madd with Alif": {
"ar": "المدّ بالألف",
"fr": "Le madd avec alif",
"ur": "الف کے ساتھ مد",
"ha": "Madda da Alif",
"id": "Mad dengan Alif",
"tl": "Madd na may Alif"
},
"Madd with Waw": {
"ar": "المدّ بالواو",
"fr": "Le madd avec waw",
"ur": "واؤ کے ساتھ مد",
"ha": "Madda da Waw",
"id": "Mad dengan Wau",
"tl": "Madd na may Waw"
},
"Madd with Yaa": {
"ar": "المدّ بالياء",
"fr": "Le madd avec yaa",
"ur": "یا کے ساتھ مد",
"ha": "Madda da Yaa",
"id": "Mad dengan Ya",
"tl": "Madd na may Yaa"
},
"Meem Sakinah & Ghunnah": {
"ar": "الميم الساكنة والغنّة",
"fr": "Le mim sakina et la ghounna",
"ur": "میم ساکن اور غنہ",
"ha": "Mim Sakina da Gunna",
"id": "Mim Sukun dan Ghunnah",
"tl": "Meem Sakinah at Ghunnah"
},
"Meet the letters": {
"ar": "تعرّف على الحروف",
"fr": "Découvre les lettres",
"ur": "حروف سے ملیں",
"ha": "Haɗu da baƙaƙe",
"id": "Kenali huruf-hurufnya",
"tl": "Kilalanin ang mga titik"
},
"More Tajweed Rules": {
"ar": "أحكام تجويد أخرى",
"fr": "D'autres règles de tajwid",
"ur": "تجوید کے مزید قواعد",
"ha": "Ƙarin Dokokin Tajwidi",
"id": "Hukum Tajwid Lainnya",
"tl": "Higit pang Tuntunin ng Tajweed"
},
"More Words": {
"ar": "كلمات أخرى",
"fr": "D'autres mots",
"ur": "مزید الفاظ",
"ha": "Ƙarin Kalmomi",
"id": "Kata-kata Lagi",
"tl": "Higit pang Salita"
},
"More letters": {
"ar": "حروف أخرى",
"fr": "D'autres lettres",
"ur": "مزید حروف",
"ha": "Ƙarin baƙaƙe",
"id": "Huruf lainnya",
"tl": "Higit pang titik"
},
"Noon Sakinah & Tanween {n}": {
"ar": "النون الساكنة والتنوين {n}",
"fr": "Noun sakina et tanwine {n}",
"ur": "نون ساکن اور تنوین {n}",
"ha": "Nun Sakina da Tanwin {n}",
"id": "Nun Sukun dan Tanwin {n}",
"tl": "Noon Sakinah at Tanween {n}"
},
"Noon Sakinah Practice": {
"ar": "تدريب على النون الساكنة",
"fr": "Entraînement au noun sakina",
"ur": "نون ساکن کی مشق",
"ha": "Atisayen Nun Sakina",
"id": "Latihan Nun Sukun",
"tl": "Pagsasanay sa Noon Sakinah"
},
"Preparatory Final Exam": {
"ar": "الاختبار النهائي للمستوى التمهيدي",
"fr": "Examen final du niveau préparatoire",
"ur": "ابتدائی درجے کا آخری امتحان",
"ha": "Jarrabawar Ƙarshe ta Share Fage",
"id": "Ujian Akhir Tingkat Persiapan",
"tl": "Huling Pagsusulit ng Paghahanda"
},
"Qur'anic and everyday spelling": {
"ar": "الرسم القرآني والإملائي",
"fr": "Écriture coranique et écriture courante",
"ur": "قرآنی اور عام املا",
"ha": "Rubutun Alƙur'ani da na yau da kullum",
"id": "Tulisan Al-Qur'an dan imla'i",
"tl": "Baybay ng Qur'an at karaniwang baybay"
},
"Qur'anic phrases": {
"ar": "عبارات قرآنية",
"fr": "Passages coraniques",
"ur": "قرآنی جملے",
"ha": "Jimlolin Alƙur'ani",
"id": "Kalimat Al-Qur'an",
"tl": "Mga parirala ng Qur'an"
},
"Qur'anic verses": {
"ar": "آيات من القرآن",
"fr": "Versets du Coran",
"ur": "قرآنی آیات",
"ha": "Ayoyin Alƙur'ani",
"id": "Ayat-ayat Al-Qur'an",
"tl": "Mga talata ng Qur'an"
},
"Qur'anic vs Everyday Spelling": {
"ar": "الرسم القرآني والرسم الإملائي",
"fr": "Écriture coranique ou courante",
"ur": "قرآنی رسم الخط اور عام املا",
"ha": "Rubutun Alƙur'ani da Rubutun Yau da Kullum",
"id": "Tulisan Al-Qur'an dan Tulisan Imla'i",
"tl": "Baybay ng Qur'an at Karaniwang Baybay"
},
"Qur'anic words": {
"ar": "كلمات قرآنية",
"fr": "Mots coraniques",
"ur": "قرآنی الفاظ",
"ha": "Kalmomin Alƙur'ani",
"id": "Kata-kata Al-Qur'an",
"tl": "Mga salita ng Qur'an"
},
"Review Practice {n}": {
"ar": "تدريب المراجعة {n}",
"fr": "Entraînement de révision {n}",
"ur": "جائزے کی مشق {n}",
"ha": "Atisayen Bita {n}",
"id": "Latihan Ulasan {n}",
"tl": "Pagsasanay sa Pagbabalik-aral {n}"
},
"Sami & Yusuf": {
"ar": "سامي ويوسف",
"fr": "Sami et Youssouf",
"ur": "سامی اور یوسف",
"ha": "Sami da Yusuf",
"id": "Sami dan Yusuf",
"tl": "Sami at Yusuf"
},
"Shadda Phrases {n}": {
"ar": "عبارات بالشدّة {n}",
"fr": "Phrases avec shadda {n}",
"ur": "شد والے جملے {n}",
"ha": "Jimlolin Shadda {n}",
"id": "Kalimat Tasydid {n}",
"tl": "Mga Pariralang may Shadda {n}"
},
"Shadda Review": {
"ar": "مراجعة الشدّة",
"fr": "Révision de la shadda",
"ur": "شد کا جائزہ",
"ha": "Bitar Shadda",
"id": "Ulasan Tasydid",
"tl": "Pagbabalik-aral sa Shadda"
},
"Shadda with Damma": {
"ar": "الشدّة مع الضمة",
"fr": "La shadda avec damma",
"ur": "شد پیش کے ساتھ",
"ha": "Shadda da Damma",
"id": "Tasydid dengan Dhammah",
"tl": "Shadda na may Damma"
},
"Shadda with Fatha": {
"ar": "الشدّة مع الفتحة",
"fr": "La shadda avec fatha",
"ur": "شد زبر کے ساتھ",
"ha": "Shadda da Fatha",
"id": "Tasydid dengan Fathah",
"tl": "Shadda na may Fatha"
},
"Shadda with Kasra": {
"ar": "الشدّة مع الكسرة",
"fr": "La shadda avec kasra",
"ur": "شد زیر کے ساتھ",
"ha": "Shadda da Kasra",
"id": "Tasydid dengan Kasrah",
"tl": "Shadda na may Kasra"
},
"Shadda with Tanween": {
"ar": "الشدّة مع التنوين",
"fr": "La shadda avec tanwine",
"ur": "شد تنوین کے ساتھ",
"ha": "Shadda da Tanwin",
"id": "Tasydid dengan Tanwin",
"tl": "Shadda na may Tanween"
},
"Short Phrases": {
"ar": "جمل قصيرة",
"fr": "Courtes phrases",
"ur": "چھوٹے جملے",
"ha": "Gajerun Jimloli",
"id": "Kalimat Pendek",
"tl": "Maiikling Parirala"
},
"Similar Letters Meeting": {
"ar": "التقاء الحروف المتشابهة",
"fr": "Rencontre de lettres semblables",
"ur": "ملتے جلتے حروف کا ملنا",
"ha": "Haɗuwar Baƙaƙe Masu Kama",
"id": "Pertemuan Huruf yang Serupa",
"tl": "Pagtatagpo ng Magkakahawig na Titik"
},
"Sukun": {
"ar": "السكون",
"fr": "Soukoun",
"ur": "جزم",
"ha": "Sukun",
"id": "Sukun",
"tl": "Sukun"
},
"Sukun Phrases {n}": {
"ar": "عبارات بالسكون {n}",
"fr": "Phrases avec soukoun {n}",
"ur": "جزم والے جملے {n}",
"ha": "Jimlolin Sukun {n}",
"id": "Kalimat Sukun {n}",
"tl": "Mga Pariralang may Sukun {n}"
},
"Tajweed Review": {
"ar": "مراجعة التجويد",
"fr": "Révision du tajwid",
"ur": "تجوید کا جائزہ",
"ha": "Bitar Tajwidi",
"id": "Ulasan Tajwid",
"tl": "Pagbabalik-aral sa Tajweed"
},
"Tanween Damm": {
"ar": "تنوين الضم",
"fr": "Tanwine damm",
"ur": "دو پیش کی تنوین",
"ha": "Tanwin Damm",
"id": "Tanwin Dhammah",
"tl": "Tanween Damm"
},
"Tanween Fath": {
"ar": "تنوين الفتح",
"fr": "Tanwine fath",
"ur": "دو زبر کی تنوین",
"ha": "Tanwin Fath",
"id": "Tanwin Fathah",
"tl": "Tanween Fath"
},
"Tanween Kasr": {
"ar": "تنوين الكسر",
"fr": "Tanwine kasr",
"ur": "دو زیر کی تنوین",
"ha": "Tanwin Kasr",
"id": "Tanwin Kasrah",
"tl": "Tanween Kasr"
},
"The Adhan": {
"ar": "الأذان",
"fr": "L'adhan",
"ur": "اذان",
"ha": "Kiran Sallah",
"id": "Azan",
"tl": "Ang Adhan"
},
"The Alphabet": {
"ar": "الحروف الهجائية",
"fr": "L'alphabet",
"ur": "حروفِ تہجی",
"ha": "Baƙaƙe",
"id": "Huruf Hijaiyah",
"tl": "Ang Alpabeto"
},
"The Creation of Man": {
"ar": "خلق الإنسان",
"fr": "La création de l'homme",
"ur": "انسان کی تخلیق",
"ha": "Halittar Mutum",
"id": "Penciptaan Manusia",
"tl": "Ang Paglikha sa Tao"
},
"The Day of Eid": {
"ar": "يوم العيد",
"fr": "Le jour de l'Aïd",
"ur": "عید کا دن",
"ha": "Ranar Sallah",
"id": "Hari Raya",
"tl": "Ang Araw ng Eid"
},
"The Farmer": {
"ar": "الفلّاح",
"fr": "Le paysan",
"ur": "کسان",
"ha": "Manomi",
"id": "Petani",
"tl": "Ang Magsasaka"
},
"The Muslim": {
"ar": "المسلم",
"fr": "Le musulman",
"ur": "مسلمان",
"ha": "Musulmi",
"id": "Muslim",
"tl": "Ang Muslim"
},
"The Qur'an": {
"ar": "القرآن",
"fr": "Le Coran",
"ur": "قرآن",
"ha": "Alƙur'ani",
"id": "Al-Qur'an",
"tl": "Ang Qur'an"
},
"The Small Alif": {
"ar": "الألف الصغيرة",
"fr": "Le petit alif",
"ur": "کھڑا زبر",
"ha": "Ƙaramar Alif",
"id": "Alif Kecil",
"tl": "Ang Maliit na Alif"
},
"The Small Waw": {
"ar": "الواو الصغيرة",
"fr": "Le petit waw",
"ur": "چھوٹا واؤ",
"ha": "Ƙaramar Waw",
"id": "Wau Kecil",
"tl": "Ang Maliit na Waw"
},
"The Small Yaa": {
"ar": "الياء الصغيرة",
"fr": "Le petit yaa",
"ur": "چھوٹی یا",
"ha": "Ƙaramar Yaa",
"id": "Ya Kecil",
"tl": "Ang Maliit na Yaa"
},
"The Sparrow": {
"ar": "العصفور",
"fr": "Le moineau",
"ur": "چڑیا",
"ha": "Gwara",
"id": "Burung Pipit",
"tl": "Ang Maya"
},
"The Stars": {
"ar": "النجوم",
"fr": "Les étoiles",
"ur": "ستارے",
"ha": "Taurari",
"id": "Bintang-bintang",
"tl": "Ang mga Bituin"
},
"The Sun Laam": {
"ar": "اللام الشمسية",
"fr": "Le lam solaire",
"ur": "لامِ شمسی",
"ha": "Laamush Shamsiyya",
"id": "Lam Syamsiyah",
"tl": "Ang Laam ng Araw"
},
"The last letters": {
"ar": "الحروف الأخيرة",
"fr": "Les dernières lettres",
"ur": "آخری حروف",
"ha": "Baƙaƙen ƙarshe",
"id": "Huruf-huruf terakhir",
"tl": "Ang mga huling titik"
},
"Two Passages": {
"ar": "نصّان",
"fr": "Deux textes",
"ur": "دو عبارتیں",
"ha": "Sassa Biyu",
"id": "Dua Bacaan",
"tl": "Dalawang Talata"
},
"Two Short Stories": {
"ar": "قصّتان قصيرتان",
"fr": "Deux courtes histoires",
"ur": "دو مختصر کہانیاں",
"ha": "Gajerun Labarai Biyu",
"id": "Dua Cerita Pendek",
"tl": "Dalawang Maikling Kuwento"
},
"Types of Madd {n}": {
"ar": "أنواع المدود {n}",
"fr": "Les types de madd {n}",
"ur": "مد کی اقسام {n}",
"ha": "Nau'ikan Madda {n}",
"id": "Jenis-jenis Mad {n}",
"tl": "Mga Uri ng Madd {n}"
},
"Umar and Karam": {
"ar": "عمر وكرم",
"fr": "Omar et Karam",
"ur": "عمر اور کرم",
"ha": "Umar da Karam",
"id": "Umar dan Karam",
"tl": "Umar at Karam"
},
"Whole Words": {
"ar": "كلمات كاملة",
"fr": "Mots entiers",
"ur": "مکمل الفاظ",
"ha": "Cikakkun Kalmomi",
"id": "Kata Utuh",
"tl": "Buong Salita"
},
"Words in Two Steps": {
"ar": "كلمات على خطوتين",
"fr": "Mots en deux étapes",
"ur": "دو مرحلوں میں الفاظ",
"ha": "Kalmomi a Matakai Biyu",
"id": "Kata dalam Dua Langkah",
"tl": "Mga Salita sa Dalawang Hakbang"
},
"and Qur'anic words": {
"ar": "وكلمات قرآنية",
"fr": "et mots coraniques",
"ur": "اور قرآنی الفاظ",
"ha": "da kalmomin Alƙur'ani",
"id": "dan kata-kata Al-Qur'an",
"tl": "at mga salita ng Qur'an"
},
"damma": {
"ar": "ضمة",
"fr": "damma",
"ur": "پیش",
"ha": "damma",
"id": "dhammah",
"tl": "damma"
},
"end": {
"ar": "آخر",
"fr": "fin",
"ur": "آخر",
"ha": "ƙarshe",
"id": "akhir",
"tl": "dulo"
},
"fatha": {
"ar": "فتحة",
"fr": "fatha",
"ur": "زبر",
"ha": "fatha",
"id": "fathah",
"tl": "fatha"
},
"from the Mushaf": {
"ar": "من المصحف",
"fr": "tirés du Moushaf",
"ur": "مصحف سے",
"ha": "daga Mus'hafi",
"id": "dari mushaf",
"tl": "mula sa Mushaf"
},
"kasra": {
"ar": "كسرة",
"fr": "kasra",
"ur": "زیر",
"ha": "kasra",
"id": "kasrah",
"tl": "kasra"
},
"letter by letter, then joined": {
"ar": "حرفًا حرفًا، ثم موصولة",
"fr": "lettre par lettre, puis reliées",
"ur": "حرف بہ حرف، پھر ملا کر",
"ha": "harafi-harafi, sannan a haɗe",
"id": "huruf demi huruf, lalu digabung",
"tl": "titik por titik, saka pinagdugtong"
},
"madd": {
"ar": "مدّ",
"fr": "madd",
"ur": "مد",
"ha": "madda",
"id": "mad",
"tl": "madd"
},
"middle": {
"ar": "وسط",
"fr": "milieu",
"ur": "درمیان",
"ha": "tsakiya",
"id": "tengah",
"tl": "gitna"
},
"more Qur'anic phrases": {
"ar": "عبارات قرآنية أخرى",
"fr": "d'autres passages coraniques",
"ur": "مزید قرآنی جملے",
"ha": "ƙarin jimlolin Alƙur'ani",
"id": "kalimat Al-Qur'an lainnya",
"tl": "higit pang parirala ng Qur'an"
},
"review & shadda": {
"ar": "مراجعة وشدّة",
"fr": "révision et shadda",
"ur": "جائزہ اور شد",
"ha": "bita da shadda",
"id": "ulasan dan tasydid",
"tl": "pagbabalik-aral at shadda"
},
"shadda": {
"ar": "الشدّة",
"fr": "shadda",
"ur": "شد",
"ha": "shadda",
"id": "tasydid",
"tl": "shadda"
},
"start": {
"ar": "أول",
"fr": "début",
"ur": "شروع",
"ha": "farko",
"id": "awal",
"tl": "simula"
},
"sukun": {
"ar": "سكون",
"fr": "soukoun",
"ur": "جزم",
"ha": "sukun",
"id": "sukun",
"tl": "sukun"
},
"sukun & tanween": {
"ar": "السكون والتنوين",
"fr": "soukoun et tanwine",
"ur": "جزم اور تنوین",
"ha": "sukun da tanwin",
"id": "sukun dan tanwin",
"tl": "sukun at tanween"
},
"tajweed & spelling": {
"ar": "التجويد والرسم",
"fr": "tajwid et écriture",
"ur": "تجوید اور املا",
"ha": "tajwidi da rubutu",
"id": "tajwid dan tulisan",
"tl": "tajweed at baybay"
},
"the whole book!": {
"ar": "الكتاب كله!",
"fr": "tout le livre !",
"ur": "پوری کتاب!",
"ha": "dukan littafin!",
"id": "seluruh buku!",
"tl": "ang buong aklat!"
},
"two letters, then the third": {
"ar": "حرفان، ثم الثالث",
"fr": "deux lettres, puis la troisième",
"ur": "دو حروف، پھر تیسرا",
"ha": "baƙaƙe biyu, sannan na uku",
"id": "dua huruf, lalu yang ketiga",
"tl": "dalawang titik, saka ang ikatlo"
},
"ـًا  = an": {
"ar": "ـًا  = an",
"fr": "ـًا  = an",
"ur": "ـًا  = اَن",
"ha": "ـًا  = an",
"id": "ـًا  = an",
"tl": "ـًا  = an"
},
"ـٌ  = un": {
"ar": "ـٌ  = un",
"fr": "ـٌ  = un",
"ur": "ـٌ  = اُن",
"ha": "ـٌ  = un",
"id": "ـٌ  = un",
"tl": "ـٌ  = un"
},
"ـٍ  = in": {
"ar": "ـٍ  = in",
"fr": "ـٍ  = in",
"ur": "ـٍ  = اِن",
"ha": "ـٍ  = in",
"id": "ـٍ  = in",
"tl": "ـٍ  = in"
},
"ـُۥ in the Mushaf": {
"ar": "ـُۥ في المصحف",
"fr": "ـُۥ dans le Moushaf",
"ur": "ـُۥ مصحف میں",
"ha": "ـُۥ a Mus'hafi",
"id": "ـُۥ dalam mushaf",
"tl": "ـُۥ sa Mushaf"
},
"ـِۦ in the Mushaf": {
"ar": "ـِۦ في المصحف",
"fr": "ـِۦ dans le Moushaf",
"ur": "ـِۦ مصحف میں",
"ha": "ـِۦ a Mus'hafi",
"id": "ـِۦ dalam mushaf",
"tl": "ـِۦ sa Mushaf"
},
"ـٰ in the Mushaf": {
"ar": "ـٰ في المصحف",
"fr": "ـٰ dans le Moushaf",
"ur": "ـٰ مصحف میں",
"ha": "ـٰ a Mus'hafi",
"id": "ـٰ dalam mushaf",
"tl": "ـٰ sa Mushaf"
},
"Alif Madd": {
"ar": "مدّ الألف",
"fr": "Madd de l'alif",
"ur": "الف کا مد",
"ha": "Maddar Alif",
"id": "Mad Alif",
"tl": "Alif Madd"
},
"Beginner {n} Final Exam": {
"ar": "الاختبار النهائي للمبتدئ {n}",
"fr": "Examen final Débutant {n}",
"ur": "بیگنر {n} کا آخری امتحان",
"ha": "Jarrabawar Ƙarshe ta Mafari {n}",
"id": "Ujian Akhir Pemula {n}",
"tl": "Huling Pagsusulit ng Beginner {n}"
},
"Certificate earned": {
"ar": "حصلت على الشهادة",
"fr": "Certificat obtenu",
"ur": "سرٹیفکیٹ مل گیا",
"ha": "An samu takardar shaida",
"id": "Sertifikat diperoleh",
"tl": "Nakuha ang sertipiko"
},
"Completed": {
"ar": "مكتمل",
"fr": "Terminé",
"ur": "مکمل",
"ha": "An kammala",
"id": "Selesai",
"tl": "Tapos na"
},
"Completed ✓": {
"ar": "مكتمل ✓",
"fr": "Terminé ✓",
"ur": "مکمل ✓",
"ha": "An kammala ✓",
"id": "Selesai ✓",
"tl": "Tapos na ✓"
},
"Creativity": {
"ar": "الإبداع",
"fr": "Créativité",
"ur": "تخلیقی صلاحیت",
"ha": "Fasaha",
"id": "Kreativitas",
"tl": "Pagkamalikhain"
},
"Development": {
"ar": "التطوير",
"fr": "Développement",
"ur": "ترقی",
"ha": "Ci gaba",
"id": "Pengembangan",
"tl": "Pag-unlad"
},
"Each subject moves up on its own: finish a subject's level, and its next level opens. Every completed level earns a certificate.": {
"ar": "كل مادة تتقدّم وحدها: أنهِ مستوى المادة فيُفتح مستواها التالي. وكل مستوى مكتمل يمنحك شهادة.",
"fr": "Chaque matière avance seule : termine un niveau d'une matière et son niveau suivant s'ouvre. Chaque niveau terminé donne un certificat.",
"ur": "ہر مضمون اپنے طور پر آگے بڑھتا ہے: مضمون کا درجہ مکمل کریں تو اس کا اگلا درجہ کھل جاتا ہے۔ ہر مکمل درجے پر سرٹیفکیٹ ملتا ہے۔",
"ha": "Kowane fanni yana hawa da kansa: gama matakin fanni, sai matakinsa na gaba ya buɗe. Kowane mataki da aka gama yana ba da takardar shaida.",
"id": "Setiap mata pelajaran naik sendiri: selesaikan tingkatnya, lalu tingkat berikutnya terbuka. Setiap tingkat yang selesai mendapat sertifikat.",
"tl": "Bawat asignatura ay umaakyat nang mag-isa: tapusin ang antas nito, at bubukas ang susunod. Bawat natapos na antas ay may sertipiko."
},
"Everyday Spelling": {
"ar": "الرسم الإملائي",
"fr": "Orthographe courante",
"ur": "عام املا",
"ha": "Rubutun Yau da Kullum",
"id": "Tulisan Imla'i",
"tl": "Karaniwang Baybay"
},
"everyday spelling": {
"ar": "الرسم الإملائي",
"fr": "orthographe courante",
"ur": "عام املا",
"ha": "rubutun yau da kullum",
"id": "tulisan imla'i",
"tl": "karaniwang baybay"
},
"Fast": {
"ar": "سريع",
"fr": "Rapide",
"ur": "تیز",
"ha": "Da sauri",
"id": "Cepat",
"tl": "Mabilis"
},
"Final exam · opens the next level": {
"ar": "الاختبار النهائي · يفتح المستوى التالي",
"fr": "Examen final · ouvre le niveau suivant",
"ur": "آخری امتحان · اگلا درجہ کھولتا ہے",
"ha": "Jarrabawar ƙarshe · tana buɗe mataki na gaba",
"id": "Ujian akhir · membuka tingkat berikutnya",
"tl": "Huling pagsusulit · bubuksan ang susunod na antas"
},
"Finish all the lessons to unlock the exam.": {
"ar": "أنهِ كل الدروس لفتح الاختبار.",
"fr": "Termine toutes les leçons pour débloquer l'examen.",
"ur": "امتحان کھولنے کے لیے تمام اسباق مکمل کریں۔",
"ha": "Gama dukan darussa don buɗe jarrabawar.",
"id": "Selesaikan semua pelajaran untuk membuka ujian.",
"tl": "Tapusin lahat ng aralin para mabuksan ang pagsusulit."
},
"Islamic education, step by step.": {
"ar": "تعليم إسلامي، خطوة بخطوة.",
"fr": "L'éducation islamique, pas à pas.",
"ur": "اسلامی تعلیم، قدم بہ قدم۔",
"ha": "Ilimin Musulunci, mataki-mataki.",
"id": "Pendidikan Islam, langkah demi langkah.",
"tl": "Edukasyong Islamiko, hakbang-hakbang."
},
"Languages": {
"ar": "اللغات",
"fr": "Langues",
"ur": "زبانیں",
"ha": "Harsuna",
"id": "Bahasa",
"tl": "Mga Wika"
},
"Learn new languages.": {
"ar": "تعلّم لغات جديدة.",
"fr": "Apprends de nouvelles langues.",
"ur": "نئی زبانیں سیکھیں۔",
"ha": "Koyi sababbin harsuna.",
"id": "Belajar bahasa baru.",
"tl": "Matuto ng mga bagong wika."
},
"Personal, professional and technical growth.": {
"ar": "نموّ شخصي ومهني وتقني.",
"fr": "Développement personnel, professionnel et technique.",
"ur": "ذاتی، پیشہ ورانہ اور تکنیکی ترقی۔",
"ha": "Ci gaban kai, sana'a da fasaha.",
"id": "Pengembangan pribadi, profesional, dan teknis.",
"tl": "Personal, propesyonal at teknikal na pag-unlad."
},
"Creative skills and practical talents.": {
"ar": "مهارات إبداعية ومواهب عملية.",
"fr": "Compétences créatives et talents pratiques.",
"ur": "تخلیقی مہارتیں اور عملی صلاحیتیں۔",
"ha": "Fasahohin kirkira da baiwa ta aiki.",
"id": "Keterampilan kreatif dan bakat praktis.",
"tl": "Malikhaing kasanayan at praktikal na talento."
},
"Lesson {n} · {n} min": {
"ar": "الدرس {n} · {n} دقائق",
"fr": "Leçon {n} · {n} min",
"ur": "سبق {n} · {n} منٹ",
"ha": "Darasi {n} · minti {n}",
"id": "Pelajaran {n} · {n} menit",
"tl": "Aralin {n} · {n} min"
},
"Lessons": {
"ar": "الدروس",
"fr": "Leçons",
"ur": "اسباق",
"ha": "Darussa",
"id": "Pelajaran",
"tl": "Mga Aralin"
},
"Lessons are being prepared. Check back soon.": {
"ar": "الدروس قيد الإعداد. عُد قريبًا.",
"fr": "Les leçons sont en préparation. Reviens bientôt.",
"ur": "اسباق تیار ہو رہے ہیں۔ جلد واپس آئیں۔",
"ha": "Ana shirya darussa. Ka dawo nan ba da daɗewa ba.",
"id": "Pelajaran sedang disiapkan. Kembali lagi nanti.",
"tl": "Inihahanda pa ang mga aralin. Bumalik ka maya-maya."
},
"Madrasah": {
"ar": "المدرسة",
"fr": "Madrasa",
"ur": "مدرسہ",
"ha": "Makaranta",
"id": "Madrasah",
"tl": "Madrasah"
},
"Open →": {
"ar": "افتح ←",
"fr": "Ouvrir →",
"ur": "کھولیں ←",
"ha": "Buɗe →",
"id": "Buka →",
"tl": "Buksan →"
},
"Open ▶": {
"ar": "افتح ◀",
"fr": "Ouvrir ▶",
"ur": "کھولیں ◀",
"ha": "Buɗe ▶",
"id": "Buka ▶",
"tl": "Buksan ▶"
},
"Opening…": {
"ar": "جارٍ الفتح…",
"fr": "Ouverture…",
"ur": "کھل رہا ہے…",
"ha": "Ana buɗewa…",
"id": "Membuka…",
"tl": "Binubuksan…"
},
"Pass the final exam to earn it.": {
"ar": "انجح في الاختبار النهائي لتحصل عليها.",
"fr": "Réussis l'examen final pour l'obtenir.",
"ur": "اسے حاصل کرنے کے لیے آخری امتحان پاس کریں۔",
"ha": "Ci jarrabawar ƙarshe don ka samu.",
"id": "Lulus ujian akhir untuk mendapatkannya.",
"tl": "Pumasa sa huling pagsusulit para makuha ito."
},
"Passed. The next stage is open.": {
"ar": "نجحت. المرحلة التالية مفتوحة.",
"fr": "Réussi. L'étape suivante est ouverte.",
"ur": "کامیاب۔ اگلا مرحلہ کھل گیا۔",
"ha": "Ka ci. Mataki na gaba ya buɗe.",
"id": "Lulus. Tahap berikutnya terbuka.",
"tl": "Pumasa. Bukas na ang susunod na yugto."
},
"Phrases": {
"ar": "عبارات",
"fr": "Phrases",
"ur": "جملے",
"ha": "Jimloli",
"id": "Kalimat",
"tl": "Mga Parirala"
},
"Plan your pace": {
"ar": "خطّط لسرعتك",
"fr": "Planifie ton rythme",
"ur": "اپنی رفتار طے کریں",
"ha": "Tsara saurinka",
"id": "Atur kecepatanmu",
"tl": "Planuhin ang iyong bilis"
},
"Promotion exam": {
"ar": "اختبار الترقية",
"fr": "Examen de passage",
"ur": "ترقی کا امتحان",
"ha": "Jarrabawar hawa",
"id": "Ujian kenaikan",
"tl": "Pagsusulit sa pag-akyat"
},
"Qur'anic Words": {
"ar": "كلمات قرآنية",
"fr": "Mots coraniques",
"ur": "قرآنی الفاظ",
"ha": "Kalmomin Alƙur'ani",
"id": "Kata-kata Al-Qur'an",
"tl": "Mga Salita ng Qur'an"
},
"Qur'anic Words {n}": {
"ar": "كلمات قرآنية {n}",
"fr": "Mots coraniques {n}",
"ur": "قرآنی الفاظ {n}",
"ha": "Kalmomin Alƙur'ani {n}",
"id": "Kata-kata Al-Qur'an {n}",
"tl": "Mga Salita ng Qur'an {n}"
},
"Relaxed": {
"ar": "مريح",
"fr": "Tranquille",
"ur": "آرام سے",
"ha": "A hankali",
"id": "Santai",
"tl": "Relaks"
},
"Review →": {
"ar": "راجع ←",
"fr": "Réviser →",
"ur": "دُہرائیں ←",
"ha": "Bita →",
"id": "Ulas →",
"tl": "Balikan →"
},
"Save my plan": {
"ar": "احفظ خطتي",
"fr": "Enregistrer mon plan",
"ur": "میرا منصوبہ محفوظ کریں",
"ha": "Ajiye tsarina",
"id": "Simpan rencanaku",
"tl": "I-save ang plano ko"
},
"Shadda": {
"ar": "الشدّة",
"fr": "Shadda",
"ur": "شد",
"ha": "Shadda",
"id": "Tasydid",
"tl": "Shadda"
},
"Short and Long": {
"ar": "قصير وطويل",
"fr": "Court et long",
"ur": "چھوٹا اور لمبا",
"ha": "Gajere da Dogo",
"id": "Pendek dan Panjang",
"tl": "Maikli at Mahaba"
},
"Skip ahead": {
"ar": "تقدّم للأمام",
"fr": "Avancer",
"ur": "آگے بڑھیں",
"ha": "Tsallaka gaba",
"id": "Lompat ke depan",
"tl": "Lumaktaw pasulong"
},
"Start here": {
"ar": "ابدأ هنا",
"fr": "Commence ici",
"ur": "یہاں سے شروع کریں",
"ha": "Fara nan",
"id": "Mulai di sini",
"tl": "Magsimula dito"
},
"Start →": {
"ar": "ابدأ ←",
"fr": "Commencer →",
"ur": "شروع کریں ←",
"ha": "Fara →",
"id": "Mulai →",
"tl": "Simula →"
},
"Steady": {
"ar": "منتظم",
"fr": "Régulier",
"ur": "مستقل",
"ha": "A tsaye",
"id": "Stabil",
"tl": "Tuloy-tuloy"
},
"Syllabus": {
"ar": "المنهج",
"fr": "Programme",
"ur": "نصاب",
"ha": "Manhaja",
"id": "Silabus",
"tl": "Silabus"
},
"Take the exam": {
"ar": "خذ الاختبار",
"fr": "Passer l'examen",
"ur": "امتحان دیں",
"ha": "Yi jarrabawar",
"id": "Ikuti ujian",
"tl": "Kumuha ng pagsusulit"
},
"Test": {
"ar": "اختبار",
"fr": "Test",
"ur": "ٹیسٹ",
"ha": "Gwaji",
"id": "Uji",
"tl": "Test"
},
"Test mode ON": {
"ar": "وضع الاختبار مُفعّل",
"fr": "Mode test ACTIVÉ",
"ur": "ٹیسٹ موڈ آن",
"ha": "Yanayin gwaji A KUNNE",
"id": "Mode uji AKTIF",
"tl": "Test mode NAKA-ON"
},
"This lesson is for Premium members.": {
"ar": "هذا الدرس لأعضاء بريميوم.",
"fr": "Cette leçon est réservée aux membres Premium.",
"ur": "یہ سبق پریمیم اراکین کے لیے ہے۔",
"ha": "Wannan darasi na membobin Premium ne.",
"id": "Pelajaran ini untuk anggota Premium.",
"tl": "Para sa mga Premium member ang araling ito."
},
"Verses & Hadith {n}": {
"ar": "آيات وأحاديث {n}",
"fr": "Versets et hadiths {n}",
"ur": "آیات اور احادیث {n}",
"ha": "Ayoyi da Hadisai {n}",
"id": "Ayat dan Hadis {n}",
"tl": "Mga Talata at Hadith {n}"
},
"Waw Madd": {
"ar": "مدّ الواو",
"fr": "Madd du waw",
"ur": "واؤ کا مد",
"ha": "Maddar Waw",
"id": "Mad Wau",
"tl": "Waw Madd"
},
"What will you learn today?": {
"ar": "ماذا ستتعلّم اليوم؟",
"fr": "Qu'apprendras-tu aujourd'hui ?",
"ur": "آج آپ کیا سیکھیں گے؟",
"ha": "Me za ka koya yau?",
"id": "Apa yang akan kamu pelajari hari ini?",
"tl": "Ano ang matututunan mo ngayon?"
},
"Words": {
"ar": "كلمات",
"fr": "Mots",
"ur": "الفاظ",
"ha": "Kalmomi",
"id": "Kata-kata",
"tl": "Mga Salita"
},
"words": {
"ar": "كلمات",
"fr": "mots",
"ur": "الفاظ",
"ha": "kalmomi",
"id": "kata-kata",
"tl": "mga salita"
},
"Words & Phrases": {
"ar": "كلمات وعبارات",
"fr": "Mots et phrases",
"ur": "الفاظ اور جملے",
"ha": "Kalmomi da Jimloli",
"id": "Kata dan Kalimat",
"tl": "Mga Salita at Parirala"
},
"Yaa Madd": {
"ar": "مدّ الياء",
"fr": "Madd du yaa",
"ur": "یا کا مد",
"ha": "Maddar Yaa",
"id": "Mad Ya",
"tl": "Yaa Madd"
},
"all harakat": {
"ar": "كل الحركات",
"fr": "toutes les harakat",
"ur": "تمام حرکات",
"ha": "dukan harakoki",
"id": "semua harakat",
"tl": "lahat ng harakat"
},
"all letters with damma": {
"ar": "كل الحروف بالضمة",
"fr": "toutes les lettres avec damma",
"ur": "تمام حروف پیش کے ساتھ",
"ha": "dukan baƙaƙe da damma",
"id": "semua huruf dengan dhammah",
"tl": "lahat ng titik na may damma"
},
"all letters with kasra": {
"ar": "كل الحروف بالكسرة",
"fr": "toutes les lettres avec kasra",
"ur": "تمام حروف زیر کے ساتھ",
"ha": "dukan baƙaƙe da kasra",
"id": "semua huruf dengan kasrah",
"tl": "lahat ng titik na may kasra"
},
"all madd": {
"ar": "كل أنواع المدّ",
"fr": "tous les madd",
"ur": "تمام مد",
"ha": "dukan madda",
"id": "semua mad",
"tl": "lahat ng madd"
},
"all the madd letters": {
"ar": "كل حروف المدّ",
"fr": "toutes les lettres de madd",
"ur": "مد کے تمام حروف",
"ha": "dukan baƙaƙen madda",
"id": "semua huruf mad",
"tl": "lahat ng titik ng madd"
},
"all three madd letters": {
"ar": "حروف المدّ الثلاثة",
"fr": "les trois lettres de madd",
"ur": "مد کے تینوں حروف",
"ha": "baƙaƙen madda uku",
"id": "ketiga huruf mad",
"tl": "tatlong titik ng madd"
},
"and phrases": {
"ar": "وعبارات",
"fr": "et phrases",
"ur": "اور جملے",
"ha": "da jimloli",
"id": "dan kalimat",
"tl": "at mga parirala"
},
"in shape and in sound": {
"ar": "في الشكل وفي الصوت",
"fr": "par la forme et par le son",
"ur": "شکل اور آواز میں",
"ha": "a siffa da sauti",
"id": "dalam bentuk dan bunyi",
"tl": "sa hugis at sa tunog"
},
"longer phrases": {
"ar": "عبارات أطول",
"fr": "phrases plus longues",
"ur": "لمبے جملے",
"ha": "dogayen jimloli",
"id": "kalimat lebih panjang",
"tl": "mas mahahabang parirala"
},
"longer words": {
"ar": "كلمات أطول",
"fr": "mots plus longs",
"ur": "لمبے الفاظ",
"ha": "dogayen kalmomi",
"id": "kata lebih panjang",
"tl": "mas mahahabang salita"
},
"meem": {
"ar": "الميم",
"fr": "mim",
"ur": "میم",
"ha": "mim",
"id": "mim",
"tl": "meem"
},
"noon": {
"ar": "النون",
"fr": "noun",
"ur": "نون",
"ha": "nun",
"id": "nun",
"tl": "noon"
},
"raa": {
"ar": "الراء",
"fr": "raa",
"ur": "را",
"ha": "raa",
"id": "ra",
"tl": "raa"
},
"tanween": {
"ar": "التنوين",
"fr": "tanwin",
"ur": "تنوین",
"ha": "tanwin",
"id": "tanwin",
"tl": "tanween"
},
"on waw": {
"ar": "على الواو",
"fr": "sur le waw",
"ur": "واؤ پر",
"ha": "a kan waw",
"id": "di atas wau",
"tl": "sa waw"
},
"on yaa": {
"ar": "على الياء",
"fr": "sur le yaa",
"ur": "یا پر",
"ha": "a kan yaa",
"id": "di atas ya",
"tl": "sa yaa"
},
"phrases with all harakat": {
"ar": "عبارات بكل الحركات",
"fr": "phrases avec toutes les harakat",
"ur": "تمام حرکات والے جملے",
"ha": "jimloli da dukan harakoki",
"id": "kalimat dengan semua harakat",
"tl": "mga parirala na may lahat ng harakat"
},
"read a whole phrase": {
"ar": "اقرأ عبارة كاملة",
"fr": "lis une phrase entière",
"ur": "پورا جملہ پڑھیں",
"ha": "karanta cikakkiyar jimla",
"id": "baca satu kalimat utuh",
"tl": "basahin ang buong parirala"
},
"read in one go": {
"ar": "اقرأ دفعة واحدة",
"fr": "lis d'un seul coup",
"ur": "ایک ہی بار میں پڑھیں",
"ha": "karanta a lokaci ɗaya",
"id": "baca sekaligus",
"tl": "basahin nang isang tuloy"
},
"read letter by letter": {
"ar": "اقرأ حرفًا حرفًا",
"fr": "lis lettre par lettre",
"ur": "حرف بہ حرف پڑھیں",
"ha": "karanta harafi-harafi",
"id": "baca huruf demi huruf",
"tl": "basahin titik por titik"
},
"sentences": {
"ar": "جمل",
"fr": "phrases",
"ur": "جملے",
"ha": "jimloli",
"id": "kalimat",
"tl": "mga pangungusap"
},
"silent letters": {
"ar": "الحروف التي لا تُنطق",
"fr": "lettres muettes",
"ur": "خاموش حروف",
"ha": "baƙaƙen da ba a furtawa",
"id": "huruf yang tidak dibaca",
"tl": "mga titik na hindi binibigkas"
},
"the closed letter": {
"ar": "الحرف الساكن",
"fr": "la lettre fermée",
"ur": "بند حرف",
"ha": "harafi a rufe",
"id": "huruf tertutup",
"tl": "ang saradong titik"
},
"the disjoined letters": {
"ar": "الحروف المقطّعة",
"fr": "les lettres isolées",
"ur": "حروفِ مقطعات",
"ha": "baƙaƙen muqatta'a",
"id": "huruf muqatha'ah",
"tl": "ang mga hiwalay na titik"
},
"the marks": {
"ar": "العلامات",
"fr": "les signes",
"ur": "نشانات",
"ha": "alamomi",
"id": "tanda-tandanya",
"tl": "ang mga marka"
},
"two and three words": {
"ar": "كلمتان وثلاث",
"fr": "deux et trois mots",
"ur": "دو اور تین الفاظ",
"ha": "kalmomi biyu da uku",
"id": "dua dan tiga kata",
"tl": "dalawa at tatlong salita"
},
"with fatha": {
"ar": "بالفتحة",
"fr": "avec fatha",
"ur": "زبر کے ساتھ",
"ha": "da fatha",
"id": "dengan fathah",
"tl": "na may fatha"
},
"with the qalqalah letters": {
"ar": "مع حروف القلقلة",
"fr": "avec les lettres de qalqala",
"ur": "قلقلہ کے حروف کے ساتھ",
"ha": "da baƙaƙen qalqala",
"id": "dengan huruf qalqalah",
"tl": "kasama ang mga titik ng qalqalah"
},
"words and phrases": {
"ar": "كلمات وعبارات",
"fr": "mots et phrases",
"ur": "الفاظ اور جملے",
"ha": "kalmomi da jimloli",
"id": "kata dan kalimat",
"tl": "mga salita at parirala"
},
"{n} min": {
"ar": "{n} دقائق",
"fr": "{n} min",
"ur": "{n} منٹ",
"ha": "minti {n}",
"id": "{n} menit",
"tl": "{n} min"
},
"{n} of {n} done": {
"ar": "{n} من {n} مكتملة",
"fr": "{n} sur {n} faites",
"ur": "{n} از {n} مکمل",
"ha": "{n} cikin {n} an gama",
"id": "{n} dari {n} selesai",
"tl": "{n} sa {n} tapos"
},
"{n} of {n} done ⭐": {
"ar": "{n} من {n} مكتملة ⭐",
"fr": "{n} sur {n} faites ⭐",
"ur": "{n} از {n} مکمل ⭐",
"ha": "{n} cikin {n} an gama ⭐",
"id": "{n} dari {n} selesai ⭐",
"tl": "{n} sa {n} tapos ⭐"
},
"{n} of {n} lessons": {
"ar": "{n} من {n} دروس",
"fr": "{n} sur {n} leçons",
"ur": "{n} از {n} اسباق",
"ha": "darussa {n} cikin {n}",
"id": "{n} dari {n} pelajaran",
"tl": "{n} sa {n} aralin"
},
"{n} lessons · {n}%": {
"ar": "{n} دروس · {n}%",
"fr": "{n} leçons · {n}%",
"ur": "{n} اسباق · {n}%",
"ha": "darussa {n} · {n}%",
"id": "{n} pelajaran · {n}%",
"tl": "{n} aralin · {n}%"
},
"{n} subject": {
"ar": "{n} مادة",
"fr": "{n} matière",
"ur": "{n} مضمون",
"ha": "fanni {n}",
"id": "{n} mata pelajaran",
"tl": "{n} asignatura"
},
"{n} subjects": {
"ar": "{n} مواد",
"fr": "{n} matières",
"ur": "{n} مضامین",
"ha": "fannoni {n}",
"id": "{n} mata pelajaran",
"tl": "{n} asignatura"
},
"Qiraha": {
"ar": "القراءة",
"fr": "Qira'ah",
"ur": "قراءت",
"ha": "Qira'ah",
"id": "Qira'ah",
"tl": "Qira'ah"
},
"'arid": {
"ar": "العارض",
"fr": "'arid",
"ur": "عارض",
"ha": "'arid",
"id": "'aridh",
"tl": "'arid"
},
"badal": {
"ar": "البدل",
"fr": "badal",
"ur": "بدل",
"ha": "badal",
"id": "badal",
"tl": "badal"
},
"idgham": {
"ar": "الإدغام",
"fr": "idgham",
"ur": "ادغام",
"ha": "idgami",
"id": "idgham",
"tl": "idgham"
},
"ikhfa": {
"ar": "الإخفاء",
"fr": "ikhfa",
"ur": "اخفاء",
"ha": "ikhfa'i",
"id": "ikhfa",
"tl": "ikhfa"
},
"iqlab": {
"ar": "الإقلاب",
"fr": "iqlab",
"ur": "اقلاب",
"ha": "iqlabi",
"id": "iqlab",
"tl": "iqlab"
},
"izhar": {
"ar": "الإظهار",
"fr": "izhar",
"ur": "اظہار",
"ha": "izhari",
"id": "izhar",
"tl": "izhar"
},
"izhar shafawi": {
"ar": "الإظهار الشفوي",
"fr": "izhar shafawi",
"ur": "اظہار شفوی",
"ha": "izhar shafawi",
"id": "izhar syafawi",
"tl": "izhar shafawi"
},
"lazim": {
"ar": "اللازم",
"fr": "lazim",
"ur": "لازم",
"ha": "lazim",
"id": "lazim",
"tl": "lazim"
},
"mithlain": {
"ar": "المثلين",
"fr": "mithlain",
"ur": "مثلین",
"ha": "mislaini",
"id": "mitslain",
"tl": "mithlain"
},
"munfasil": {
"ar": "المنفصل",
"fr": "munfasil",
"ur": "منفصل",
"ha": "munfasil",
"id": "munfashil",
"tl": "munfasil"
},
"mutajanisain": {
"ar": "المتجانسين",
"fr": "mutajanisain",
"ur": "متجانسین",
"ha": "mutajanisaini",
"id": "mutajanisain",
"tl": "mutajanisain"
},
"mutaqaribain": {
"ar": "المتقاربين",
"fr": "mutaqaribain",
"ur": "متقاربین",
"ha": "mutaqaribaini",
"id": "mutaqaribain",
"tl": "mutaqaribain"
},
"muttasil": {
"ar": "المتصل",
"fr": "muttasil",
"ur": "متصل",
"ha": "muttasil",
"id": "muttashil",
"tl": "muttasil"
},
"silah": {
"ar": "الصلة",
"fr": "silah",
"ur": "صلہ",
"ha": "sila",
"id": "shilah",
"tl": "silah"
},
"wasl": {
"ar": "الوصل",
"fr": "wasl",
"ur": "وصل",
"ha": "wasl",
"id": "washal",
"tl": "wasl"
},
"qalqalah": {
"ar": "القلقلة",
"fr": "qalqala",
"ur": "قلقلہ",
"ha": "qalqala",
"id": "qalqalah",
"tl": "qalqalah"
},
"pp.{n}–{n}": {
"ar": "ص {n}–{n}",
"fr": "p. {n}–{n}",
"ur": "ص {n}–{n}",
"ha": "shafi {n}–{n}",
"id": "hlm. {n}–{n}",
"tl": "p. {n}–{n}"
}
};
for (const [k, v] of Object.entries(STUDY)) DICT[k] = { ...v, ...(DICT[k] ?? {}) };

// Yoruba, Igbo, Bengali, Malay.
const MORE: Record<string, T> = {
"Today": {
"yo": "Òní",
"ig": "Taa",
"bn": "আজ",
"ms": "Hari ini"
},
"Play": {
"yo": "Ṣeré",
"ig": "Egwuregwu",
"bn": "খেলা",
"ms": "Main"
},
"Quests": {
"yo": "Àwọn ìrìn-àjò",
"ig": "Njem ọmụmụ",
"bn": "কোয়েস্ট",
"ms": "Misi"
},
"Progress": {
"yo": "Ìlọsíwájú",
"ig": "Ọganihu",
"bn": "অগ্রগতি",
"ms": "Kemajuan"
},
"You": {
"yo": "Ìwọ",
"ig": "Gị",
"bn": "আপনি",
"ms": "Anda"
},
"Home": {
"yo": "Ilé",
"ig": "Ụlọ",
"bn": "হোম",
"ms": "Laman utama"
},
"Study": {
"yo": "Ẹ̀kọ́",
"ig": "Ọmụmụ",
"bn": "পড়াশোনা",
"ms": "Belajar"
},
"Challenge": {
"yo": "Ìpèníjà",
"ig": "Ịma aka",
"bn": "চ্যালেঞ্জ",
"ms": "Cabaran"
},
"Quran": {
"yo": "Kùránì",
"ig": "Kur'an",
"bn": "কুরআন",
"ms": "Al-Quran"
},
"Qur’an": {
"yo": "Kùránì",
"ig": "Kur'an",
"bn": "কুরআন",
"ms": "Al-Quran"
},
"Halaqah": {
"yo": "Halaqah",
"ig": "Halaqah",
"bn": "হালাকা",
"ms": "Halaqah"
},
"Chatrooms": {
"yo": "Àwọn yàrá ìjíròrò",
"ig": "Ọnụ ụlọ mkparịta ụka",
"bn": "চ্যাটরুম",
"ms": "Bilik sembang"
},
"Library": {
"yo": "Ilé-ìkàwé",
"ig": "Ọbá akwụkwọ",
"bn": "লাইব্রেরি",
"ms": "Perpustakaan"
},
"Settings": {
"yo": "Ètò",
"ig": "Ntọala",
"bn": "সেটিংস",
"ms": "Tetapan"
},
"Family hub": {
"yo": "Ibùdó ẹbí",
"ig": "Ebe ezinụlọ",
"bn": "পরিবার কেন্দ্র",
"ms": "Hab keluarga"
},
"Wallet & store": {
"yo": "Àpò owó & ọjà",
"ig": "Akpa ego & ụlọ ahịa",
"bn": "ওয়ালেট ও স্টোর",
"ms": "Dompet & kedai"
},
"Practice": {
"yo": "Ìdánrawò",
"ig": "Mmega",
"bn": "অনুশীলন",
"ms": "Latihan"
},
"Log out": {
"yo": "Jáde",
"ig": "Pụọ",
"bn": "লগ আউট",
"ms": "Log keluar"
},
"Log in": {
"yo": "Wọlé",
"ig": "Banye",
"bn": "লগ ইন",
"ms": "Log masuk"
},
"Sign up": {
"yo": "Forúkọsílẹ̀",
"ig": "Debanye aha",
"bn": "সাইন আপ",
"ms": "Daftar"
},
"Create account": {
"yo": "Ṣẹ̀dá àkáǹtì",
"ig": "Mepụta akaụntụ",
"bn": "অ্যাকাউন্ট তৈরি করুন",
"ms": "Cipta akaun"
},
"Create an account": {
"yo": "Ṣẹ̀dá àkáǹtì kan",
"ig": "Mepụta akaụntụ",
"bn": "একটি অ্যাকাউন্ট তৈরি করুন",
"ms": "Cipta akaun"
},
"Get started": {
"yo": "Bẹ̀rẹ̀",
"ig": "Malite",
"bn": "শুরু করুন",
"ms": "Mula"
},
"Continue with Google": {
"yo": "Tẹ̀síwájú pẹ̀lú Google",
"ig": "Gaa n'ihu na Google",
"bn": "Google দিয়ে চালিয়ে যান",
"ms": "Teruskan dengan Google"
},
"Forgot password?": {
"yo": "Ṣé o gbàgbé ọ̀rọ̀ aṣínà?",
"ig": "Ichefuola paswọọdụ?",
"bn": "পাসওয়ার্ড ভুলে গেছেন?",
"ms": "Lupa kata laluan?"
},
"Email": {
"yo": "Ímeèlì",
"ig": "Email",
"bn": "ইমেইল",
"ms": "E-mel"
},
"Password": {
"yo": "Ọ̀rọ̀ aṣínà",
"ig": "Paswọọdụ",
"bn": "পাসওয়ার্ড",
"ms": "Kata laluan"
},
"Open dashboard": {
"yo": "Ṣí dáṣíbọ́ọ̀dù",
"ig": "Mepee dashboard",
"bn": "ড্যাশবোর্ড খুলুন",
"ms": "Buka papan pemuka"
},
"Events": {
"yo": "Àwọn ìṣẹ̀lẹ̀",
"ig": "Mmemme",
"bn": "অনুষ্ঠান",
"ms": "Acara"
},
"Centres": {
"yo": "Àwọn ibùdó",
"ig": "Ebe ọrụ",
"bn": "কেন্দ্র",
"ms": "Pusat"
},
"Sponsor": {
"yo": "Ṣe onígbọ̀wọ́",
"ig": "Kwado",
"bn": "পৃষ্ঠপোষকতা",
"ms": "Taja"
},
"Save": {
"yo": "Fipamọ́",
"ig": "Chekwaa",
"bn": "সংরক্ষণ",
"ms": "Simpan"
},
"Cancel": {
"yo": "Fagilé",
"ig": "Kagbuo",
"bn": "বাতিল",
"ms": "Batal"
},
"Close": {
"yo": "Pa á dé",
"ig": "Mechie",
"bn": "বন্ধ করুন",
"ms": "Tutup"
},
"Done": {
"yo": "Ó ti parí",
"ig": "Emechaala",
"bn": "সম্পন্ন",
"ms": "Selesai"
},
"Continue": {
"yo": "Tẹ̀síwájú",
"ig": "Gaa n'ihu",
"bn": "চালিয়ে যান",
"ms": "Teruskan"
},
"Back": {
"yo": "Padà",
"ig": "Laghachi",
"bn": "ফিরে যান",
"ms": "Kembali"
},
"Next": {
"yo": "Èyí tó kàn",
"ig": "Nke ọzọ",
"bn": "পরবর্তী",
"ms": "Seterusnya"
},
"Previous": {
"yo": "Èyí tó ṣáájú",
"ig": "Nke gara aga",
"bn": "পূর্ববর্তী",
"ms": "Sebelumnya"
},
"Go": {
"yo": "Lọ",
"ig": "Gaa",
"bn": "যান",
"ms": "Pergi"
},
"Page": {
"yo": "Ojú-ìwé",
"ig": "Peeji",
"bn": "পৃষ্ঠা",
"ms": "Halaman"
},
"Start": {
"yo": "Bẹ̀rẹ̀",
"ig": "Malite",
"bn": "শুরু",
"ms": "Mula"
},
"Loading…": {
"yo": "Ó ń gbé e wá…",
"ig": "Ọ na-ebu…",
"bn": "লোড হচ্ছে…",
"ms": "Memuatkan…"
},
"Try again": {
"yo": "Gbìyànjú lẹ́ẹ̀kan sí i",
"ig": "Nwaa ọzọ",
"bn": "আবার চেষ্টা করুন",
"ms": "Cuba lagi"
},
"Search": {
"yo": "Wá",
"ig": "Chọọ",
"bn": "খুঁজুন",
"ms": "Cari"
},
"Send": {
"yo": "Fi ránṣẹ́",
"ig": "Zipu",
"bn": "পাঠান",
"ms": "Hantar"
},
"Update": {
"yo": "Ṣe àtúnṣe",
"ig": "Melite",
"bn": "হালনাগাদ",
"ms": "Kemas kini"
},
"Install": {
"yo": "Fi sórí ẹ̀rọ",
"ig": "Wụnye",
"bn": "ইনস্টল",
"ms": "Pasang"
},
"Not now": {
"yo": "Kì í ṣe báyìí",
"ig": "Ọ bụghị ugbu a",
"bn": "এখন নয়",
"ms": "Bukan sekarang"
},
"Turn on": {
"yo": "Tàn án",
"ig": "Gbanye",
"bn": "চালু করুন",
"ms": "Hidupkan"
},
"Coming soon": {
"yo": "Ó ń bọ̀ láìpẹ́",
"ig": "Ọ na-abịa n'oge na-adịghị anya",
"bn": "শীঘ্রই আসছে",
"ms": "Akan datang"
},
"Tap to play": {
"yo": "Tẹ̀ láti ṣeré",
"ig": "Pịa ka ị kpọọ",
"bn": "খেলতে ট্যাপ করুন",
"ms": "Ketik untuk main"
},
"Hifz": {
"yo": "Hifz",
"ig": "Hifz",
"bn": "হিফজ",
"ms": "Hifz"
},
"Tilawah": {
"yo": "Tilawah",
"ig": "Tilawah",
"bn": "তিলাওয়াত",
"ms": "Tilawah"
},
"Revision": {
"yo": "Àtúnyẹ̀wò",
"ig": "Ntụgharị",
"bn": "রিভিশন",
"ms": "Ulang kaji"
},
"Listen": {
"yo": "Gbọ́",
"ig": "Gee ntị",
"bn": "শুনুন",
"ms": "Dengar"
},
"What would you like to do?": {
"yo": "Kí lo fẹ́ ṣe?",
"ig": "Gịnị ka ị chọrọ ime?",
"bn": "আপনি কী করতে চান?",
"ms": "Apa yang anda mahu lakukan?"
},
"Memorise step by step": {
"yo": "Há a sórí ní ìgbésẹ̀-ìgbésẹ̀",
"ig": "Buru n'isi nwayọọ nwayọọ",
"bn": "ধাপে ধাপে মুখস্থ করুন",
"ms": "Hafal langkah demi langkah"
},
"Read the mushaf page by page": {
"yo": "Ka Mus'hafi ní ojú-ìwé-ojú-ìwé",
"ig": "Gụọ Mushaf peeji site na peeji",
"bn": "পৃষ্ঠা ধরে মুসহাফ পড়ুন",
"ms": "Baca mushaf halaman demi halaman"
},
"Review what you’ve memorised": {
"yo": "Ṣàtúnyẹ̀wò ohun tí o ti há sórí",
"ig": "Tụgharịa ihe i buru n'isi",
"bn": "যা মুখস্থ করেছেন তা রিভিশন দিন",
"ms": "Ulang kaji apa yang telah dihafal"
},
"Listen to beautiful recitations": {
"yo": "Gbọ́ àwọn kíkà tó rẹwà",
"ig": "Gee ntị n'ọgụgụ mara mma",
"bn": "সুন্দর তিলাওয়াত শুনুন",
"ms": "Dengar bacaan yang indah"
},
"☰ Surahs": {
"yo": "☰ Àwọn Sùúrà",
"ig": "☰ Surah",
"bn": "☰ সূরা",
"ms": "☰ Surah"
},
"Search a surah…": {
"yo": "Wá sùúrà kan…",
"ig": "Chọọ surah…",
"bn": "সূরা খুঁজুন…",
"ms": "Cari surah…"
},
"Or choose a surah:": {
"yo": "Tàbí yan sùúrà kan:",
"ig": "Ma ọ bụ họrọ surah:",
"bn": "অথবা একটি সূরা বেছে নিন:",
"ms": "Atau pilih surah:"
},
"Choose a surah": {
"yo": "Yan sùúrà kan",
"ig": "Họrọ surah",
"bn": "একটি সূরা বেছে নিন",
"ms": "Pilih surah"
},
"Start from the beginning": {
"yo": "Bẹ̀rẹ̀ láti ìbẹ̀rẹ̀",
"ig": "Malite site na mbido",
"bn": "শুরু থেকে শুরু করুন",
"ms": "Mula dari awal"
},
"Continue reading?": {
"yo": "Ṣé o fẹ́ máa kà á lọ?",
"ig": "Ịga n'ihu na-agụ?",
"bn": "পড়া চালিয়ে যাবেন?",
"ms": "Teruskan membaca?"
},
"Continue listening?": {
"yo": "Ṣé o fẹ́ máa gbọ́ ọ lọ?",
"ig": "Ịga n'ihu na-ege ntị?",
"bn": "শোনা চালিয়ে যাবেন?",
"ms": "Teruskan mendengar?"
},
"▶ Play": {
"yo": "▶ Ṣe é",
"ig": "▶ Kpọọ",
"bn": "▶ চালান",
"ms": "▶ Main"
},
"⏸ Pause": {
"yo": "⏸ Dánu dúró",
"ig": "⏸ Kwụsịtụ",
"bn": "⏸ বিরতি",
"ms": "⏸ Jeda"
},
"▶ Play from this verse": {
"yo": "▶ Ṣe é láti àyá yìí",
"ig": "▶ Kpọọ site n'amaokwu a",
"bn": "▶ এই আয়াত থেকে চালান",
"ms": "▶ Main dari ayat ini"
},
"Loading the page…": {
"yo": "Ó ń gbé ojú-ìwé wá…",
"ig": "Ọ na-ebu peeji…",
"bn": "পৃষ্ঠা লোড হচ্ছে…",
"ms": "Memuatkan halaman…"
},
"Daily Wisdom": {
"yo": "Ọgbọ́n Ojoojúmọ́",
"ig": "Amamihe Kwa Ụbọchị",
"bn": "দৈনিক হিকমাহ",
"ms": "Hikmah Harian"
},
"Prayer times": {
"yo": "Àkókò ìrun",
"ig": "Oge ekpere",
"bn": "নামাজের সময়",
"ms": "Waktu solat"
},
"Fajr": {
"yo": "Subhi",
"ig": "Fajr",
"bn": "ফজর",
"ms": "Subuh"
},
"Sunrise": {
"yo": "Ìlà oòrùn",
"ig": "Ọwụwa anyanwụ",
"bn": "সূর্যোদয়",
"ms": "Syuruk"
},
"Dhuhr": {
"yo": "Ọ̀sán",
"ig": "Dhuhr",
"bn": "যোহর",
"ms": "Zohor"
},
"Asr": {
"yo": "Asri",
"ig": "Asr",
"bn": "আসর",
"ms": "Asar"
},
"Maghrib": {
"yo": "Mọ́gàríbì",
"ig": "Maghrib",
"bn": "মাগরিব",
"ms": "Maghrib"
},
"Isha": {
"yo": "Ìṣà",
"ig": "Isha",
"bn": "এশা",
"ms": "Isyak"
},
"Copy": {
"yo": "Ṣe ẹ̀dà",
"ig": "Detuo",
"bn": "কপি",
"ms": "Salin"
},
"Card": {
"yo": "Káàdì",
"ig": "Kaadị",
"bn": "কার্ড",
"ms": "Kad"
},
"Games 🎮": {
"yo": "Eré 🎮",
"ig": "Egwuregwu 🎮",
"bn": "খেলা 🎮",
"ms": "Permainan 🎮"
},
"Study 📚": {
"yo": "Ẹ̀kọ́ 📚",
"ig": "Ọmụmụ 📚",
"bn": "পড়াশোনা 📚",
"ms": "Belajar 📚"
},
"Games": {
"yo": "Eré",
"ig": "Egwuregwu",
"bn": "খেলা",
"ms": "Permainan"
},
"Quizzes": {
"yo": "Àwọn ìdánwò kékeré",
"ig": "Ajụjụ nlele",
"bn": "কুইজ",
"ms": "Kuiz"
},
"Puzzles": {
"yo": "Àwọn àdìtú",
"ig": "Ihe mgbagwoju anya",
"bn": "ধাঁধা",
"ms": "Teka-teki"
},
"Memory games": {
"yo": "Eré ìrántí",
"ig": "Egwuregwu ncheta",
"bn": "স্মৃতির খেলা",
"ms": "Permainan ingatan"
},
"Pick something to learn!": {
"yo": "Yan nǹkan láti kọ́!",
"ig": "Họrọ ihe ị ga-amụ!",
"bn": "শেখার জন্য কিছু বেছে নাও!",
"ms": "Pilih sesuatu untuk dipelajari!"
},
"Pick a subject!": {
"yo": "Yan ẹ̀kọ́ kan!",
"ig": "Họrọ isiokwu!",
"bn": "একটি বিষয় বেছে নাও!",
"ms": "Pilih satu subjek!"
},
"What do you want to play?": {
"yo": "Kí lo fẹ́ ṣeré?",
"ig": "Kedu egwuregwu ị chọrọ ịkpọ?",
"bn": "তুমি কী খেলতে চাও?",
"ms": "Apa yang kamu mahu main?"
},
"New lessons are coming soon! 🌟": {
"yo": "Àwọn ẹ̀kọ́ tuntun ń bọ̀ láìpẹ́! 🌟",
"ig": "Ihe ọmụmụ ọhụrụ na-abịa n'oge na-adịghị anya! 🌟",
"bn": "নতুন পাঠ শীঘ্রই আসছে! 🌟",
"ms": "Pelajaran baharu akan datang! 🌟"
},
"Subjects": {
"yo": "Àwọn ẹ̀kọ́",
"ig": "Isiokwu",
"bn": "বিষয়সমূহ",
"ms": "Subjek"
},
"Premium": {
"yo": "Premium",
"ig": "Premium",
"bn": "প্রিমিয়াম",
"ms": "Premium"
},
"Free": {
"yo": "Ọ̀fẹ́",
"ig": "N'efu",
"bn": "বিনামূল্যে",
"ms": "Percuma"
},
"Monthly": {
"yo": "Lóṣooṣù",
"ig": "Kwa ọnwa",
"bn": "মাসিক",
"ms": "Bulanan"
},
"Yearly": {
"yo": "Lọ́dọọdún",
"ig": "Kwa afọ",
"bn": "বার্ষিক",
"ms": "Tahunan"
},
"Choose plan": {
"yo": "Yan ètò",
"ig": "Họrọ atụmatụ",
"bn": "প্ল্যান বেছে নিন",
"ms": "Pilih pelan"
},
"Ask for a quote": {
"yo": "Béèrè iye owó",
"ig": "Jụọ ọnụahịa",
"bn": "মূল্য জানতে চান",
"ms": "Minta sebut harga"
},
"Pay now": {
"yo": "San owó báyìí",
"ig": "Kwụọ ugbu a",
"bn": "এখনই পরিশোধ করুন",
"ms": "Bayar sekarang"
},
"🔔 Notifications": {
"yo": "🔔 Ìfitónilétí",
"ig": "🔔 Ọkwa",
"bn": "🔔 নোটিফিকেশন",
"ms": "🔔 Pemberitahuan"
},
"Turn on notifications": {
"yo": "Tan ìfitónilétí",
"ig": "Gbanye ọkwa",
"bn": "নোটিফিকেশন চালু করুন",
"ms": "Hidupkan pemberitahuan"
},
"Send me a test": {
"yo": "Fi ìdánwò kan ránṣẹ́ sí mi",
"ig": "Zitere m nnwale",
"bn": "আমাকে একটি পরীক্ষামূলক বার্তা পাঠান",
"ms": "Hantar ujian kepada saya"
},
"📲 Install the app": {
"yo": "📲 Fi áàpù sórí ẹ̀rọ",
"ig": "📲 Wụnye ngwa",
"bn": "📲 অ্যাপ ইনস্টল করুন",
"ms": "📲 Pasang aplikasi"
},
"Install IlmStation": {
"yo": "Fi IlmStation sórí ẹ̀rọ",
"ig": "Wụnye IlmStation",
"bn": "IlmStation ইনস্টল করুন",
"ms": "Pasang IlmStation"
},
"Delete my account": {
"yo": "Pa àkáǹtì mi rẹ́",
"ig": "Hichapụ akaụntụ m",
"bn": "আমার অ্যাকাউন্ট মুছুন",
"ms": "Padam akaun saya"
},
"Privacy Policy": {
"yo": "Ìlànà Àṣírí",
"ig": "Iwu Nzuzo",
"bn": "গোপনীয়তা নীতি",
"ms": "Dasar Privasi"
},
"Terms of Use": {
"yo": "Àwọn Òfin Ìlò",
"ig": "Usoro Ojiji",
"bn": "ব্যবহারের শর্তাবলি",
"ms": "Terma Penggunaan"
},
"Prize Rules": {
"yo": "Àwọn Òfin Ẹ̀bùn",
"ig": "Iwu Onyinye",
"bn": "পুরস্কারের নিয়ম",
"ms": "Peraturan Hadiah"
},
"🌍 Language": {
"yo": "🌍 Èdè",
"ig": "🌍 Asụsụ",
"bn": "🌍 ভাষা",
"ms": "🌍 Bahasa"
},
"Preferences & account": {
"yo": "Ààyò & àkáǹtì",
"ig": "Mmasị & akaụntụ",
"bn": "পছন্দ ও অ্যাকাউন্ট",
"ms": "Pilihan & akaun"
},
"Experience": {
"yo": "Ìrírí",
"ig": "Ahụmịhe",
"bn": "অভিজ্ঞতা",
"ms": "Pengalaman"
},
"Saved automatically": {
"yo": "Ó ń fipamọ́ fúnra rẹ̀",
"ig": "A na-echekwa ya na-akpaghị aka",
"bn": "স্বয়ংক্রিয়ভাবে সংরক্ষিত",
"ms": "Disimpan secara automatik"
},
"Quest reminders": {
"yo": "Ìrántí ìrìn-àjò",
"ig": "Ncheta njem ọmụmụ",
"bn": "কোয়েস্ট রিমাইন্ডার",
"ms": "Peringatan misi"
},
"Sound effects": {
"yo": "Ìró ipa",
"ig": "Ụda mmetụta",
"bn": "সাউন্ড ইফেক্ট",
"ms": "Kesan bunyi"
},
"Reduced motion": {
"yo": "Ìṣípòpadà díẹ̀",
"ig": "Mbelata mmegharị",
"bn": "কম অ্যানিমেশন",
"ms": "Kurangkan animasi"
},
"Language": {
"yo": "Èdè",
"ig": "Asụsụ",
"bn": "ভাষা",
"ms": "Bahasa"
},
"Account": {
"yo": "Àkáǹtì",
"ig": "Akaụntụ",
"bn": "অ্যাকাউন্ট",
"ms": "Akaun"
},
"Frontend demo": {
"yo": "Àpẹẹrẹ ojú",
"ig": "Ngosipụta n'ihu",
"bn": "ফ্রন্টএন্ড ডেমো",
"ms": "Demo paparan"
},
"Replay onboarding": {
"yo": "Tún ìfihàn ìbẹ̀rẹ̀ ṣe",
"ig": "Megharịa nkọwa mmalite",
"bn": "পরিচিতি আবার দেখুন",
"ms": "Main semula pengenalan"
},
"Privacy & accessibility": {
"yo": "Àṣírí & ìrọ̀rùn lílò",
"ig": "Nzuzo & nnweta",
"bn": "গোপনীয়তা ও সহজলভ্যতা",
"ms": "Privasi & kebolehcapaian"
},
"Preview offline state": {
"yo": "Wo ipò àìsí lórí ayélujára",
"ig": "Lee ọnọdụ enweghị ịntanetị",
"bn": "অফলাইন অবস্থা দেখুন",
"ms": "Pratonton keadaan luar talian"
},
"Dark theme preview": {
"yo": "Wo àwọ̀ dúdú",
"ig": "Lee isiokwu ọchịchịrị",
"bn": "ডার্ক থিম দেখুন",
"ms": "Pratonton tema gelap"
},
"Language saved": {
"yo": "A ti fi èdè pamọ́",
"ig": "Echekwala asụsụ",
"bn": "ভাষা সংরক্ষিত হয়েছে",
"ms": "Bahasa disimpan"
},
"Your daily ledger": {
"yo": "Àkọsílẹ̀ ojoojúmọ́ rẹ",
"ig": "Ndekọ gị kwa ụbọchị",
"bn": "আপনার দৈনিক খাতা",
"ms": "Lejar harian anda"
},
"Quick quiz": {
"yo": "Ìdánwò kíákíá",
"ig": "Ajụjụ ngwa ngwa",
"bn": "দ্রুত কুইজ",
"ms": "Kuiz pantas"
},
"Quick Quiz": {
"yo": "Ìdánwò Kíákíá",
"ig": "Ajụjụ Ngwa Ngwa",
"bn": "দ্রুত কুইজ",
"ms": "Kuiz Pantas"
},
"Days to Ramadan": {
"yo": "Ọjọ́ sí Ramadan",
"ig": "Ụbọchị ruo Ramadan",
"bn": "রমজান পর্যন্ত দিন",
"ms": "Hari menuju Ramadan"
},
"Prepare": {
"yo": "Múra sílẹ̀",
"ig": "Kwado",
"bn": "প্রস্তুতি নিন",
"ms": "Bersedia"
},
"Pick up where you left off": {
"yo": "Tẹ̀síwájú láti ibi tí o dúró sí",
"ig": "Gaa n'ihu ebe ị kwụsịrị",
"bn": "যেখানে থেমেছিলেন সেখান থেকে শুরু করুন",
"ms": "Sambung dari tempat anda berhenti"
},
"Continue reading": {
"yo": "Tẹ̀síwájú kíkà",
"ig": "Gaa n'ihu na-agụ",
"bn": "পড়া চালিয়ে যান",
"ms": "Teruskan membaca"
},
"Continue in Library": {
"yo": "Tẹ̀síwájú ní Ilé-ìkàwé",
"ig": "Gaa n'ihu n'Ọbá akwụkwọ",
"bn": "লাইব্রেরিতে চালিয়ে যান",
"ms": "Teruskan di Perpustakaan"
},
"Next prayer": {
"yo": "Ìrun tó kàn",
"ig": "Ekpere na-esote",
"bn": "পরবর্তী নামাজ",
"ms": "Solat seterusnya"
},
"Download": {
"yo": "Gbà á sílẹ̀",
"ig": "Budata",
"bn": "ডাউনলোড",
"ms": "Muat turun"
},
"Share": {
"yo": "Pín in",
"ig": "Kesaa",
"bn": "শেয়ার",
"ms": "Kongsi"
},
"Ramadan": {
"yo": "Ramadan",
"ig": "Ramadan",
"bn": "রমজান",
"ms": "Ramadan"
},
"Cards": {
"yo": "Àwọn káàdì",
"ig": "Kaadị",
"bn": "কার্ড",
"ms": "Kad"
},
"Community": {
"yo": "Àwùjọ",
"ig": "Obodo",
"bn": "কমিউনিটি",
"ms": "Komuniti"
},
"IlmBot": {
"yo": "IlmBot",
"ig": "IlmBot",
"bn": "IlmBot",
"ms": "IlmBot"
},
"Assalamu-alaikum,": {
"yo": "Assalamu alaikum,",
"ig": "Assalamu alaikum,",
"bn": "আসসালামু আলাইকুম,",
"ms": "Assalamualaikum,"
},
"Assalamu alaikum": {
"yo": "Assalamu alaikum",
"ig": "Assalamu alaikum",
"bn": "আসসালামু আলাইকুম",
"ms": "Assalamualaikum"
},
"days to Ramadan": {
"yo": "ọjọ́ sí Ramadan",
"ig": "ụbọchị ruo Ramadan",
"bn": "দিন রমজান পর্যন্ত",
"ms": "hari menuju Ramadan"
},
"Prepare your intention, Tarawih plan, and 30-day quest chain.": {
"yo": "Múra èròngbà rẹ sílẹ̀, ètò Tarawih, àti ìrìn-àjò ọgbọ̀n ọjọ́.",
"ig": "Kwadebe ebumnuche gị, atụmatụ Tarawih, na njem ọmụmụ ụbọchị iri atọ.",
"bn": "আপনার নিয়ত, তারাবিহ পরিকল্পনা এবং ৩০ দিনের কোয়েস্ট প্রস্তুত করুন।",
"ms": "Sediakan niat anda, pelan Tarawih, dan rangkaian misi 30 hari."
},
"Prepare your intention, Tarawih plan, and 30-day quest chain": {
"yo": "Múra èròngbà rẹ sílẹ̀, ètò Tarawih, àti ìrìn-àjò ọgbọ̀n ọjọ́",
"ig": "Kwadebe ebumnuche gị, atụmatụ Tarawih, na njem ọmụmụ ụbọchị iri atọ",
"bn": "আপনার নিয়ত, তারাবিহ পরিকল্পনা এবং ৩০ দিনের কোয়েস্ট প্রস্তুত করুন",
"ms": "Sediakan niat anda, pelan Tarawih, dan rangkaian misi 30 hari"
},
"Play Modes": {
"yo": "Ọ̀nà Eré",
"ig": "Ụdị Egwuregwu",
"bn": "খেলার ধরন",
"ms": "Mod Permainan"
},
"Choose a practice": {
"yo": "Yan ìdánrawò kan",
"ig": "Họrọ mmega",
"bn": "একটি অনুশীলন বেছে নিন",
"ms": "Pilih latihan"
},
"Hifz Drills": {
"yo": "Ìdánrawò Hifz",
"ig": "Mmega Hifz",
"bn": "হিফজ অনুশীলন",
"ms": "Latihan Hifz"
},
"Recite and review": {
"yo": "Ka kí o sì ṣàtúnyẹ̀wò",
"ig": "Gụọ ma tụgharịa",
"bn": "তিলাওয়াত ও রিভিশন",
"ms": "Baca dan ulang kaji"
},
"Tafsir Quiz": {
"yo": "Ìdánwò Tafsir",
"ig": "Ajụjụ Tafsir",
"bn": "তাফসির কুইজ",
"ms": "Kuiz Tafsir"
},
"10 mixed questions": {
"yo": "Ìbéèrè àdàlù mẹ́wàá",
"ig": "Ajụjụ iri agwakọtara",
"bn": "১০টি মিশ্র প্রশ্ন",
"ms": "10 soalan campuran"
},
"Learn with family": {
"yo": "Kọ́ pẹ̀lú ẹbí",
"ig": "Mụta na ezinụlọ",
"bn": "পরিবারের সাথে শিখুন",
"ms": "Belajar bersama keluarga"
},
"Ask and explore": {
"yo": "Béèrè kí o sì ṣàwárí",
"ig": "Jụọ ma chọpụta",
"bn": "জিজ্ঞাসা করুন ও খুঁজে দেখুন",
"ms": "Tanya dan teroka"
},
"Leaderboard": {
"yo": "Àtẹ àwọn aṣáájú",
"ig": "Tebụl ndị ndu",
"bn": "লিডারবোর্ড",
"ms": "Papan pendahulu"
},
"Weekly": {
"yo": "Lọ́sọ̀ọ̀sẹ̀",
"ig": "Kwa izu",
"bn": "সাপ্তাহিক",
"ms": "Mingguan"
},
"Invite friends to see the leaderboard.": {
"yo": "Pe àwọn ọ̀rẹ́ láti rí àtẹ àwọn aṣáájú.",
"ig": "Kpọọ ndị enyi ka ha hụ tebụl ndị ndu.",
"bn": "লিডারবোর্ড দেখতে বন্ধুদের আমন্ত্রণ জানান।",
"ms": "Jemput rakan untuk melihat papan pendahulu."
},
"View all": {
"yo": "Wo gbogbo rẹ̀",
"ig": "Lee ha niile",
"bn": "সব দেখুন",
"ms": "Lihat semua"
},
"Daily streak": {
"yo": "Ọjọ́ tí kò já",
"ig": "Usoro ụbọchị",
"bn": "দৈনিক ধারা",
"ms": "Rentetan harian"
},
"Adhan": {
"yo": "Àdhàn",
"ig": "Adhan",
"bn": "আজান",
"ms": "Azan"
},
"▶ Play adhan": {
"yo": "▶ Ṣe àdhàn",
"ig": "▶ Kpọọ adhan",
"bn": "▶ আজান চালান",
"ms": "▶ Mainkan azan"
},
"Stop": {
"yo": "Dúró",
"ig": "Kwụsị",
"bn": "থামুন",
"ms": "Berhenti"
},
"Turn off adhan": {
"yo": "Pa àdhàn",
"ig": "Gbanyụọ adhan",
"bn": "আজান বন্ধ করুন",
"ms": "Matikan azan"
},
"Couldn't load prayer times.": {
"yo": "A kò lè gbé àkókò ìrun wá.",
"ig": "Enweghị ike ibu oge ekpere.",
"bn": "নামাজের সময় লোড করা যায়নি।",
"ms": "Tidak dapat memuatkan waktu solat."
},
"Continue listening": {
"yo": "Tẹ̀síwájú gbígbọ́",
"ig": "Gaa n'ihu na-ege ntị",
"bn": "শোনা চালিয়ে যান",
"ms": "Teruskan mendengar"
},
"Start reading": {
"yo": "Bẹ̀rẹ̀ kíkà",
"ig": "Malite ịgụ",
"bn": "পড়া শুরু করুন",
"ms": "Mula membaca"
},
"Start with a quick quiz": {
"yo": "Bẹ̀rẹ̀ pẹ̀lú ìdánwò kíákíá",
"ig": "Malite na ajụjụ ngwa ngwa",
"bn": "একটি দ্রুত কুইজ দিয়ে শুরু করুন",
"ms": "Mula dengan kuiz pantas"
},
"Open a book from the library, or test yourself with a quick quiz.": {
"yo": "Ṣí ìwé kan láti ilé-ìkàwé, tàbí dán ara rẹ wò pẹ̀lú ìdánwò kíákíá.",
"ig": "Mepee akwụkwọ n'ọbá akwụkwọ, ma ọ bụ nwaa onwe gị na ajụjụ ngwa ngwa.",
"bn": "লাইব্রেরি থেকে একটি বই খুলুন, অথবা দ্রুত কুইজ দিয়ে নিজেকে যাচাই করুন।",
"ms": "Buka buku dari perpustakaan, atau uji diri anda dengan kuiz pantas."
},
"Jumu’ah Mubarak": {
"yo": "Jimọ̀ Mubarak",
"ig": "Jumu'ah Mubarak",
"bn": "জুমা মোবারক",
"ms": "Jumaat Mubarak"
},
"Surah Al-Kahf": {
"yo": "Sùúrà Al-Kahf",
"ig": "Surah Al-Kahf",
"bn": "সূরা আল-কাহফ",
"ms": "Surah Al-Kahfi"
},
"Mushaf": {
"yo": "Mus'hafi",
"ig": "Mushaf",
"bn": "মুসহাফ",
"ms": "Mushaf"
},
"With translation": {
"yo": "Pẹ̀lú ìtumọ̀",
"ig": "Na nsụgharị",
"bn": "অনুবাদসহ",
"ms": "Dengan terjemahan"
},
"110 ayat · read or listen": {
"yo": "Àyá 110 · kà tàbí gbọ́",
"ig": "Amaokwu 110 · gụọ ma ọ bụ gee ntị",
"bn": "১১০ আয়াত · পড়ুন বা শুনুন",
"ms": "110 ayat · baca atau dengar"
},
"Couldn't load the surah. Check your connection and try again.": {
"yo": "A kò lè gbé sùúrà náà wá. Ṣàyẹ̀wò ìsopọ̀ rẹ kí o sì gbìyànjú lẹ́ẹ̀kan sí i.",
"ig": "Enweghị ike ibu surah ahụ. Lelee njikọ gị ma nwaa ọzọ.",
"bn": "সূরাটি লোড করা যায়নি। আপনার সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
"ms": "Tidak dapat memuatkan surah. Semak sambungan anda dan cuba lagi."
},
"Read Surah Al-Kahf": {
"yo": "Ka Sùúrà Al-Kahf",
"ig": "Gụọ Surah Al-Kahf",
"bn": "সূরা আল-কাহফ পড়ুন",
"ms": "Baca Surah Al-Kahfi"
},
"I’ve read Al-Kahf": {
"yo": "Mo ti ka Al-Kahf",
"ig": "Agụọla m Al-Kahf",
"bn": "আমি আল-কাহফ পড়েছি",
"ms": "Saya telah membaca Al-Kahfi"
},
"Level": {
"yo": "Ìpele",
"ig": "Ọkwa",
"bn": "স্তর",
"ms": "Tahap"
},
"▶ Next": {
"yo": "▶ Èyí tó kàn",
"ig": "▶ Nke ọzọ",
"bn": "▶ পরবর্তী",
"ms": "▶ Seterusnya"
},
"Seek · Learn · Grow": {
"yo": "Wá · Kọ́ · Dàgbà",
"ig": "Chọọ · Mụta · Too",
"bn": "খুঁজুন · শিখুন · বেড়ে উঠুন",
"ms": "Cari · Belajar · Berkembang"
},
"Knowledge pursued with purpose.": {
"yo": "Ìmọ̀ tí a ń lépa pẹ̀lú èrò.",
"ig": "Ihe ọmụma a na-achụ n'ebumnuche.",
"bn": "উদ্দেশ্য নিয়ে জ্ঞান অর্জন।",
"ms": "Ilmu yang dicari dengan tujuan."
},
"About": {
"yo": "Nípa wa",
"ig": "Banyere anyị",
"bn": "সম্পর্কে",
"ms": "Tentang"
},
"Sponsor a learner": {
"yo": "Ṣe onígbọ̀wọ́ akẹ́kọ̀ọ́",
"ig": "Kwado onye na-amụ ihe",
"bn": "একজন শিক্ষার্থীর পৃষ্ঠপোষক হোন",
"ms": "Taja seorang pelajar"
},
"Dashboard": {
"yo": "Dáṣíbọ́ọ̀dù",
"ig": "Dashboard",
"bn": "ড্যাশবোর্ড",
"ms": "Papan pemuka"
},
"Privacy": {
"yo": "Àṣírí",
"ig": "Nzuzo",
"bn": "গোপনীয়তা",
"ms": "Privasi"
},
"Terms": {
"yo": "Òfin",
"ig": "Usoro",
"bn": "শর্তাবলি",
"ms": "Terma"
},
"Prize rules": {
"yo": "Òfin ẹ̀bùn",
"ig": "Iwu onyinye",
"bn": "পুরস্কারের নিয়ম",
"ms": "Peraturan hadiah"
},
"A living school for everyday Muslims": {
"yo": "Ilé-ìwé alààyè fún àwọn Mùsùlùmí ojoojúmọ́",
"ig": "Ụlọ akwụkwọ dị ndụ maka ndị Alakụba kwa ụbọchị",
"bn": "প্রতিদিনের মুসলিমদের জন্য একটি জীবন্ত বিদ্যালয়",
"ms": "Sekolah yang hidup untuk Muslim setiap hari"
},
"Seek knowledge.": {
"yo": "Wá ìmọ̀.",
"ig": "Chọọ ihe ọmụma.",
"bn": "জ্ঞান অন্বেষণ করুন।",
"ms": "Cari ilmu."
},
"Grow together.": {
"yo": "Dàgbà papọ̀.",
"ig": "Too ọnụ.",
"bn": "একসাথে বেড়ে উঠুন।",
"ms": "Berkembang bersama."
},
"Daily lessons, quizzes, a library with audio, moderated chatrooms and a 3D Muslim world, in one purposeful journey.": {
"yo": "Ẹ̀kọ́ ojoojúmọ́, ìdánwò, ilé-ìkàwé pẹ̀lú ohùn, yàrá ìjíròrò tí a ń bójútó àti ayé Mùsùlùmí 3D, nínú ìrìn-àjò kan tó ní ète.",
"ig": "Ihe ọmụmụ kwa ụbọchị, ajụjụ, ọbá akwụkwọ nwere ụda, ọnụ ụlọ mkparịta ụka a na-elekọta na ụwa Alakụba 3D, n'otu njem nwere ebumnuche.",
"bn": "দৈনিক পাঠ, কুইজ, অডিওসহ লাইব্রেরি, পরিচালিত চ্যাটরুম এবং একটি ৩ডি মুসলিম জগৎ, একটি উদ্দেশ্যপূর্ণ যাত্রায়।",
"ms": "Pelajaran harian, kuiz, perpustakaan dengan audio, bilik sembang yang diselia dan dunia Muslim 3D, dalam satu perjalanan yang bermakna."
},
"Start today’s quest": {
"yo": "Bẹ̀rẹ̀ ìrìn-àjò òní",
"ig": "Malite njem ọmụmụ taa",
"bn": "আজকের কোয়েস্ট শুরু করুন",
"ms": "Mula misi hari ini"
},
"Explore IlmWorld": {
"yo": "Ṣàwárí IlmWorld",
"ig": "Chọpụta IlmWorld",
"bn": "IlmWorld ঘুরে দেখুন",
"ms": "Teroka IlmWorld"
},
"to start learning": {
"yo": "láti bẹ̀rẹ̀ kíkọ́",
"ig": "iji malite ịmụ ihe",
"bn": "শেখা শুরু করতে",
"ms": "untuk mula belajar"
},
"3 zones": {
"yo": "Agbègbè 3",
"ig": "Mpaghara 3",
"bn": "৩টি জোন",
"ms": "3 zon"
},
"Kids · Teens · Adults": {
"yo": "Ọmọdé · Ọ̀dọ́ · Àgbà",
"ig": "Ụmụaka · Ndị nọ n'afọ iri na ụma · Ndị okenye",
"bn": "শিশু · কিশোর · প্রাপ্তবয়স্ক",
"ms": "Kanak-kanak · Remaja · Dewasa"
},
"“My Lord, increase me in knowledge.”": {
"yo": "“Olúwa mi, ṣe àlékún ìmọ̀ fún mi.”",
"ig": "“Onyenwe m, mụbaara m ihe ọmụma.”",
"bn": "“হে আমার রব, আমার জ্ঞান বৃদ্ধি করে দিন।”",
"ms": "“Wahai Tuhanku, tambahkanlah ilmu kepadaku.”"
},
"Qur’an 20:114": {
"yo": "Kùránì 20:114",
"ig": "Kur'an 20:114",
"bn": "কুরআন ২০:১১৪",
"ms": "Al-Quran 20:114"
},
"Simple by design": {
"yo": "Rírọrùn ní ìṣètò",
"ig": "Dị mfe site na nhazi",
"bn": "নকশায় সহজ",
"ms": "Ringkas dari segi reka bentuk"
},
"How IlmStation works": {
"yo": "Bí IlmStation ṣe ń ṣiṣẹ́",
"ig": "Otu IlmStation si arụ ọrụ",
"bn": "IlmStation কীভাবে কাজ করে",
"ms": "Cara IlmStation berfungsi"
},
"New · 3D world": {
"yo": "Tuntun · ayé 3D",
"ig": "Ọhụrụ · ụwa 3D",
"bn": "নতুন · ৩ডি জগৎ",
"ms": "Baharu · dunia 3D"
},
"IlmWorld: live a Muslim life, learn as you go.": {
"yo": "IlmWorld: gbé ìgbésí ayé Mùsùlùmí, kọ́ bí o ṣe ń lọ.",
"ig": "IlmWorld: bie ndụ Alakụba, mụta ka ị na-aga.",
"bn": "IlmWorld: মুসলিম জীবন যাপন করুন, চলতে চলতে শিখুন।",
"ms": "IlmWorld: jalani kehidupan Muslim, belajar sambil berjalan."
},
"Enter IlmWorld": {
"yo": "Wọ IlmWorld",
"ig": "Banye IlmWorld",
"bn": "IlmWorld-এ প্রবেশ করুন",
"ms": "Masuk IlmWorld"
},
"One companion, the whole journey": {
"yo": "Alábàákẹ́gbẹ́ kan, gbogbo ìrìn-àjò",
"ig": "Otu enyi, njem niile",
"bn": "একজন সঙ্গী, পুরো যাত্রা",
"ms": "Seorang teman, sepanjang perjalanan"
},
"Everything you need to keep going": {
"yo": "Gbogbo ohun tí o nílò láti máa tẹ̀síwájú",
"ig": "Ihe niile ị chọrọ iji gaa n'ihu",
"bn": "চালিয়ে যেতে যা কিছু দরকার",
"ms": "Semua yang anda perlukan untuk terus maju"
},
"Open the app": {
"yo": "Ṣí áàpù náà",
"ig": "Mepee ngwa ahụ",
"bn": "অ্যাপটি খুলুন",
"ms": "Buka aplikasi"
},
"Ramadan with IlmStation": {
"yo": "Ramadan pẹ̀lú IlmStation",
"ig": "Ramadan na IlmStation",
"bn": "IlmStation-এর সাথে রমজান",
"ms": "Ramadan bersama IlmStation"
},
"Your best Ramadan, day by day.": {
"yo": "Ramadan rẹ tó dára jùlọ, lójoojúmọ́.",
"ig": "Ramadan gị kacha mma, ụbọchị site n'ụbọchị.",
"bn": "আপনার সেরা রমজান, দিনে দিনে।",
"ms": "Ramadan terbaik anda, hari demi hari."
},
"Prepare for Ramadan": {
"yo": "Múra sílẹ̀ fún Ramadan",
"ig": "Kwado maka Ramadan",
"bn": "রমজানের প্রস্তুতি নিন",
"ms": "Bersedia untuk Ramadan"
},
"Sponsor a day’s prizes": {
"yo": "Ṣe onígbọ̀wọ́ ẹ̀bùn ọjọ́ kan",
"ig": "Kwado onyinye otu ụbọchị",
"bn": "এক দিনের পুরস্কারের পৃষ্ঠপোষক হোন",
"ms": "Taja hadiah sehari"
},
"Conversations with adab": {
"yo": "Ìjíròrò pẹ̀lú àdáàbù",
"ig": "Mkparịta ụka nwere adab",
"bn": "আদবের সাথে কথোপকথন",
"ms": "Perbualan beradab"
},
"The circle stays open.": {
"yo": "Àyíká ṣì wà ní ṣíṣí.",
"ig": "Okirikiri ahụ ka meghere.",
"bn": "বৃত্তটি খোলা থাকে।",
"ms": "Bulatan sentiasa terbuka."
},
"Topic rooms for each age group, sisters’ and brothers’ circles, text-only and moderated by our team.": {
"yo": "Yàrá kókó-ọ̀rọ̀ fún ẹgbẹ́ ọjọ́-orí kọ̀ọ̀kan, àyíká àwọn arábìnrin àti arákùnrin, ọ̀rọ̀ nìkan, tí ẹgbẹ́ wa ń bójútó.",
"ig": "Ọnụ ụlọ isiokwu maka otu afọ ọ bụla, okirikiri ụmụnne nwanyị na ụmụnne nwoke, naanị ederede, nke otu anyị na-elekọta.",
"bn": "প্রতিটি বয়সের জন্য বিষয়ভিত্তিক রুম, বোনদের ও ভাইদের বৃত্ত, শুধু লেখা, আমাদের দল দ্বারা পরিচালিত।",
"ms": "Bilik topik untuk setiap kumpulan umur, bulatan muslimah dan muslimin, teks sahaja dan diselia oleh pasukan kami."
},
"Enter chatrooms": {
"yo": "Wọ yàrá ìjíròrò",
"ig": "Banye ọnụ ụlọ mkparịta ụka",
"bn": "চ্যাটরুমে প্রবেশ করুন",
"ms": "Masuk bilik sembang"
},
"Rooms are opening soon.": {
"yo": "Àwọn yàrá ń ṣí láìpẹ́.",
"ig": "Ọnụ ụlọ na-emeghe n'oge na-adịghị anya.",
"bn": "রুমগুলো শীঘ্রই খুলছে।",
"ms": "Bilik akan dibuka tidak lama lagi."
},
"Kids & family": {
"yo": "Ọmọdé & ẹbí",
"ig": "Ụmụaka & ezinụlọ",
"bn": "শিশু ও পরিবার",
"ms": "Kanak-kanak & keluarga"
},
"A safe, joyful journey for children.": {
"yo": "Ìrìn-àjò aláàbò, tó kún fún ayọ̀ fún àwọn ọmọdé.",
"ig": "Njem dị nchebe, jupụta n'ọṅụ maka ụmụaka.",
"bn": "শিশুদের জন্য একটি নিরাপদ, আনন্দময় যাত্রা।",
"ms": "Perjalanan yang selamat dan gembira untuk kanak-kanak."
},
"Sponsor a child": {
"yo": "Ṣe onígbọ̀wọ́ ọmọdé kan",
"ig": "Kwado otu nwatakịrị",
"bn": "একটি শিশুর পৃষ্ঠপোষক হোন",
"ms": "Taja seorang kanak-kanak"
},
"Before you begin": {
"yo": "Kí o tó bẹ̀rẹ̀",
"ig": "Tupu ị malite",
"bn": "শুরু করার আগে",
"ms": "Sebelum anda mula"
},
"Questions, answered.": {
"yo": "Àwọn ìbéèrè, a ti dáhùn.",
"ig": "Ajụjụ, azaala.",
"bn": "প্রশ্ন, উত্তরসহ।",
"ms": "Soalan, berjawab."
},
"Anything else? Write to us at": {
"yo": "Ṣé ohun mìíràn wà? Kọ̀wé sí wa ní",
"ig": "Ihe ọzọ ọ dị? Dee anyị na",
"bn": "আর কিছু? আমাদের লিখুন",
"ms": "Ada lagi? Tulis kepada kami di"
},
"Your first lesson is one click away.": {
"yo": "Ẹ̀kọ́ àkọ́kọ́ rẹ kù ìtẹ̀ kan péré.",
"ig": "Ihe ọmụmụ mbụ gị dị naanị otu ịpị.",
"bn": "আপনার প্রথম পাঠ মাত্র এক ক্লিক দূরে।",
"ms": "Pelajaran pertama anda hanya satu klik lagi."
},
"No long setup, no pressure. Open the app, read today’s wisdom, take a quick quiz, and let the streak begin.": {
"yo": "Kò sí ètò gígùn, kò sí ìfúnpá. Ṣí áàpù náà, ka ọgbọ́n òní, ṣe ìdánwò kíákíá, kí ọjọ́ tí kò já bẹ̀rẹ̀.",
"ig": "Enweghị nhazi ogologo, enweghị nrụgide. Mepee ngwa ahụ, gụọ amamihe taa, mee ajụjụ ngwa ngwa, ka usoro ụbọchị gị malite.",
"bn": "কোনো দীর্ঘ সেটআপ নেই, কোনো চাপ নেই। অ্যাপটি খুলুন, আজকের হিকমাহ পড়ুন, একটি দ্রুত কুইজ দিন, আর ধারা শুরু হোক।",
"ms": "Tiada persediaan panjang, tiada tekanan. Buka aplikasi, baca hikmah hari ini, ambil kuiz pantas, dan biarkan rentetan bermula."
},
"Is IlmStation free to use?": {
"yo": "Ṣé IlmStation jẹ́ ọ̀fẹ́?",
"ig": "IlmStation ọ bụ n'efu?",
"bn": "IlmStation কি বিনামূল্যে ব্যবহার করা যায়?",
"ms": "Adakah IlmStation percuma?"
},
"Do I need to know Arabic to start?": {
"yo": "Ṣé mo nílò láti mọ Lárúbáwá kí n tó bẹ̀rẹ̀?",
"ig": "Ọ dị m mkpa ịma Arabik tupu m malite?",
"bn": "শুরু করতে কি আরবি জানতে হবে?",
"ms": "Perlukah saya tahu bahasa Arab untuk bermula?"
},
"No. Everything has English, and the Arabic is there for when you’re ready.": {
"yo": "Rárá. Gbogbo nǹkan ní Gẹ̀ẹ́sì, Lárúbáwá sì wà fún ìgbà tí o bá ṣetán.",
"ig": "Mba. Ihe niile nwere Bekee, Arabik dịkwa maka mgbe ị dị njikere.",
"bn": "না। সবকিছুতে ইংরেজি আছে, আর আরবি আছে যখন আপনি প্রস্তুত হবেন।",
"ms": "Tidak. Semuanya ada dalam bahasa Inggeris, dan bahasa Arab ada bila anda bersedia."
},
"What is IlmWorld?": {
"yo": "Kí ni IlmWorld?",
"ig": "Gịnị bụ IlmWorld?",
"bn": "IlmWorld কী?",
"ms": "Apakah IlmWorld?"
},
"How does the Ramadan prize quiz work?": {
"yo": "Báwo ni ìdánwò ẹ̀bùn Ramadan ṣe ń ṣiṣẹ́?",
"ig": "Kedu ka ajụjụ onyinye Ramadan si arụ ọrụ?",
"bn": "রমজান পুরস্কার কুইজ কীভাবে কাজ করে?",
"ms": "Bagaimana kuiz hadiah Ramadan berfungsi?"
},
"Is it suitable for children?": {
"yo": "Ṣé ó yẹ fún àwọn ọmọdé?",
"ig": "Ọ dabara maka ụmụaka?",
"bn": "এটি কি শিশুদের জন্য উপযুক্ত?",
"ms": "Adakah ia sesuai untuk kanak-kanak?"
},
"Yes. IlmStation works fully online on your phone or computer.": {
"yo": "Bẹ́ẹ̀ni. IlmStation ń ṣiṣẹ́ pátápátá lórí ayélujára lórí fóònù tàbí kọ̀ǹpútà rẹ.",
"ig": "Ee. IlmStation na-arụ ọrụ zuru oke n'ịntanetị na ekwentị ma ọ bụ kọmputa gị.",
"bn": "হ্যাঁ। IlmStation আপনার ফোন বা কম্পিউটারে সম্পূর্ণ অনলাইনে কাজ করে।",
"ms": "Ya. IlmStation berfungsi sepenuhnya dalam talian di telefon atau komputer anda."
},
"How do children join IlmStation?": {
"yo": "Báwo ni àwọn ọmọdé ṣe ń darapọ̀ mọ́ IlmStation?",
"ig": "Kedu ka ụmụaka si esonye IlmStation?",
"bn": "শিশুরা কীভাবে IlmStation-এ যোগ দেয়?",
"ms": "Bagaimana kanak-kanak menyertai IlmStation?"
},
"Is kids mode safe?": {
"yo": "Ṣé ipò ọmọdé ní ààbò?",
"ig": "Ọnọdụ ụmụaka ọ dị nchebe?",
"bn": "কিডস মোড কি নিরাপদ?",
"ms": "Adakah mod kanak-kanak selamat?"
},
"Can my child play on another device?": {
"yo": "Ṣé ọmọ mi lè ṣeré lórí ẹ̀rọ mìíràn?",
"ig": "Nwa m nwere ike igwu egwu na ngwaọrụ ọzọ?",
"bn": "আমার শিশু কি অন্য ডিভাইসে খেলতে পারবে?",
"ms": "Bolehkah anak saya bermain di peranti lain?"
},
"Quizzes & daily streaks": {
"yo": "Ìdánwò & ọjọ́ tí kò já",
"ig": "Ajụjụ & usoro ụbọchị",
"bn": "কুইজ ও দৈনিক ধারা",
"ms": "Kuiz & rentetan harian"
},
"Short quizzes on Aqeedah, Hadith, Seerah, Fiqh, Arabic and more, with a streak that rewards showing up every day.": {
"yo": "Ìdánwò kúkúrú lórí Aqeedah, Hadith, Seerah, Fiqh, Lárúbáwá àti bẹ́ẹ̀ bẹ́ẹ̀ lọ, pẹ̀lú ọjọ́ tí kò já tó ń san èrè fún wíwá lójoojúmọ́.",
"ig": "Ajụjụ dị mkpụmkpụ gbasara Aqeedah, Hadith, Seerah, Fiqh, Arabik na ndị ọzọ, nwere usoro ụbọchị na-akwụ ụgwọ ọrụ maka ịbịa kwa ụbọchị.",
"bn": "আকিদা, হাদিস, সিরাত, ফিকহ, আরবি এবং আরও বিষয়ে ছোট কুইজ, প্রতিদিন আসার জন্য পুরস্কৃত ধারাসহ।",
"ms": "Kuiz ringkas tentang Akidah, Hadis, Sirah, Fiqh, bahasa Arab dan banyak lagi, dengan rentetan yang memberi ganjaran kerana hadir setiap hari."
},
"Library with audio": {
"yo": "Ilé-ìkàwé pẹ̀lú ohùn",
"ig": "Ọbá akwụkwọ nwere ụda",
"bn": "অডিওসহ লাইব্রেরি",
"ms": "Perpustakaan dengan audio"
},
"Books and articles that remember your page, plus audiobooks and lecture series chapter by chapter.": {
"yo": "Àwọn ìwé àti àpilẹ̀kọ tó ń rántí ojú-ìwé rẹ, àti ìwé ohùn àti ọ̀rọ̀ ìwàásù ní orí-orí.",
"ig": "Akwụkwọ na edemede na-echeta peeji gị, gbakwunyere akwụkwọ ụda na usoro okwu ihu ọha isi site n'isi.",
"bn": "বই ও প্রবন্ধ যা আপনার পৃষ্ঠা মনে রাখে, সাথে অধ্যায় ধরে অডিওবুক ও বক্তৃতা সিরিজ।",
"ms": "Buku dan artikel yang mengingati halaman anda, serta buku audio dan siri kuliah bab demi bab."
},
"Memorise at your own pace with revision and gentle daily targets.": {
"yo": "Há sórí bí o ṣe lè ṣe é, pẹ̀lú àtúnyẹ̀wò àti àfojúsùn ojoojúmọ́ tó rọrùn.",
"ig": "Buru n'isi n'ọsọ nke gị, na ntụgharị na ebumnuche kwa ụbọchị dị nro.",
"bn": "নিজের গতিতে মুখস্থ করুন, রিভিশন ও সহজ দৈনিক লক্ষ্যসহ।",
"ms": "Hafal mengikut rentak anda sendiri dengan ulang kaji dan sasaran harian yang ringan."
},
"An ayah, hadith or word of the scholars each day, ready to save, copy or share as a beautiful card.": {
"yo": "Àyá kan, hadith kan tàbí ọ̀rọ̀ àwọn onímọ̀ lójoojúmọ́, tó ṣetán láti fipamọ́, ṣe ẹ̀dà tàbí pín bí káàdì tó rẹwà.",
"ig": "Amaokwu, hadith ma ọ bụ okwu ndị ọkà mmụta kwa ụbọchị, dị njikere ichekwa, idetuo ma ọ bụ ikesa dị ka kaadị mara mma.",
"bn": "প্রতিদিন একটি আয়াত, হাদিস বা আলেমদের বাণী, সংরক্ষণ, কপি বা সুন্দর কার্ড হিসেবে শেয়ার করার জন্য প্রস্তুত।",
"ms": "Satu ayat, hadis atau kata-kata ulama setiap hari, sedia untuk disimpan, disalin atau dikongsi sebagai kad yang cantik."
},
"Moderated chatrooms": {
"yo": "Yàrá ìjíròrò tí a ń bójútó",
"ig": "Ọnụ ụlọ mkparịta ụka a na-elekọta",
"bn": "পরিচালিত চ্যাটরুম",
"ms": "Bilik sembang yang diselia"
},
"Topic rooms by age group, with sisters’ and brothers’ circles, kept text-only and respectful.": {
"yo": "Yàrá kókó-ọ̀rọ̀ nípa ẹgbẹ́ ọjọ́-orí, pẹ̀lú àyíká àwọn arábìnrin àti arákùnrin, ọ̀rọ̀ nìkan àti pẹ̀lú ọ̀wọ̀.",
"ig": "Ọnụ ụlọ isiokwu site n'otu afọ, nwere okirikiri ụmụnne nwanyị na ụmụnne nwoke, naanị ederede na nkwanye ùgwù.",
"bn": "বয়সভিত্তিক বিষয়ের রুম, বোনদের ও ভাইদের বৃত্তসহ, শুধু লেখা এবং সম্মানজনক।",
"ms": "Bilik topik mengikut kumpulan umur, dengan bulatan muslimah dan muslimin, teks sahaja dan penuh hormat."
},
"Cards for every occasion": {
"yo": "Káàdì fún gbogbo ayẹyẹ",
"ig": "Kaadị maka mmemme ọ bụla",
"bn": "প্রতিটি উপলক্ষের জন্য কার্ড",
"ms": "Kad untuk setiap majlis"
},
"Make Eid, Ramadan, Jumu’ah, nikah, new baby and condolence cards and share them on WhatsApp.": {
"yo": "Ṣe káàdì Ọdún, Ramadan, Jimọ̀, ìgbéyàwó, ọmọ tuntun àti ìbánikẹ́dùn kí o sì pín wọn lórí WhatsApp.",
"ig": "Mee kaadị Eid, Ramadan, Jumu'ah, alụmdi na nwunye, nwa ọhụrụ na nkasi obi ma kesaa ha na WhatsApp.",
"bn": "ঈদ, রমজান, জুমা, বিবাহ, নবজাতক ও শোকবার্তার কার্ড তৈরি করুন এবং WhatsApp-এ শেয়ার করুন।",
"ms": "Buat kad Hari Raya, Ramadan, Jumaat, nikah, bayi baharu dan takziah serta kongsi di WhatsApp."
},
"Join your zone": {
"yo": "Darapọ̀ mọ́ agbègbè rẹ",
"ig": "Sonye na mpaghara gị",
"bn": "আপনার জোনে যোগ দিন",
"ms": "Sertai zon anda"
},
"Sign up free and choose your zone: Kids, Teens & Young Adults, or Adult. You only see what’s right for you.": {
"yo": "Forúkọsílẹ̀ lọ́fẹ̀ẹ́ kí o sì yan agbègbè rẹ: Ọmọdé, Ọ̀dọ́ & Ọ̀dọ́mọdé Àgbà, tàbí Àgbà. Ohun tó yẹ fún ọ nìkan ni o máa rí.",
"ig": "Debanye aha n'efu ma họrọ mpaghara gị: Ụmụaka, Ndị nọ n'afọ iri na ụma & Ndị ntorobịa, ma ọ bụ Ndị okenye. Ị ga-ahụ naanị ihe dabara gị.",
"bn": "বিনামূল্যে সাইন আপ করুন এবং আপনার জোন বেছে নিন: শিশু, কিশোর ও তরুণ, অথবা প্রাপ্তবয়স্ক। আপনি শুধু আপনার উপযুক্ত জিনিসই দেখবেন।",
"ms": "Daftar percuma dan pilih zon anda: Kanak-kanak, Remaja & Belia, atau Dewasa. Anda hanya melihat apa yang sesuai untuk anda."
},
"Learn a little, daily": {
"yo": "Kọ́ díẹ̀, lójoojúmọ́",
"ig": "Mụta ntakịrị, kwa ụbọchị",
"bn": "প্রতিদিন একটু শিখুন",
"ms": "Belajar sedikit, setiap hari"
},
"A daily wisdom, a quick quiz, a few pages or an audio chapter. Ten focused minutes keeps your streak alive.": {
"yo": "Ọgbọ́n ojoojúmọ́, ìdánwò kíákíá, ojú-ìwé díẹ̀ tàbí orí ohùn kan. Ìṣẹ́jú mẹ́wàá tí o fi ọkàn sí ń pa ọjọ́ tí kò já rẹ mọ́.",
"ig": "Amamihe kwa ụbọchị, ajụjụ ngwa ngwa, peeji ole na ole ma ọ bụ otu isi ụda. Nkeji iri ị tinyere uche na-edobe usoro ụbọchị gị ndụ.",
"bn": "একটি দৈনিক হিকমাহ, একটি দ্রুত কুইজ, কয়েকটি পৃষ্ঠা বা একটি অডিও অধ্যায়। দশ মিনিটের মনোযোগ আপনার ধারা সচল রাখে।",
"ms": "Hikmah harian, kuiz pantas, beberapa halaman atau satu bab audio. Sepuluh minit yang fokus mengekalkan rentetan anda."
},
"Grow with company": {
"yo": "Dàgbà pẹ̀lú àwọn ẹlẹgbẹ́",
"ig": "Too na ndị otu",
"bn": "সঙ্গীদের সাথে বেড়ে উঠুন",
"ms": "Berkembang bersama teman"
},
"Reflect in moderated chatrooms, discuss books with other readers, and live it out in IlmWorld.": {
"yo": "Ronú jinlẹ̀ nínú yàrá ìjíròrò, jíròrò ìwé pẹ̀lú àwọn òǹkàwé mìíràn, kí o sì gbé e jáde nínú IlmWorld.",
"ig": "Tụgharịa uche n'ọnụ ụlọ mkparịta ụka a na-elekọta, kparịta akwụkwọ na ndị ọgụgụ ndị ọzọ, ma bie ya na IlmWorld.",
"bn": "পরিচালিত চ্যাটরুমে ভাবুন, অন্য পাঠকদের সাথে বই নিয়ে আলোচনা করুন, এবং IlmWorld-এ তা বাস্তবায়ন করুন।",
"ms": "Renungkan di bilik sembang yang diselia, bincangkan buku dengan pembaca lain, dan amalkannya di IlmWorld."
},
"Pray at the masjid": {
"yo": "Kírun ní mọ́ṣáláṣí",
"ig": "Kpee ekpere na ụlọ alakụba",
"bn": "মসজিদে নামাজ পড়ুন",
"ms": "Solat di masjid"
},
"Rent & furnish a home": {
"yo": "Yá ilé kí o sì ṣe é lọ́ṣọ̀ọ́",
"ig": "Gbazite ma chọọ ụlọ mma",
"bn": "বাড়ি ভাড়া নিন ও সাজান",
"ms": "Sewa & hias rumah"
},
"Run a market stall": {
"yo": "Ṣe ìsọ̀ ní ọjà",
"ig": "Rụọ ụlọ ahịa n'ahịa",
"bn": "বাজারে দোকান চালান",
"ms": "Jalankan gerai pasar"
},
"Race at the arena": {
"yo": "Sáré ní pápá eré",
"ig": "Gbaa ọsọ n'ọgbọ egwuregwu",
"bn": "অ্যারেনায় দৌড় দিন",
"ms": "Berlumba di arena"
},
"Hajj & Umrah": {
"yo": "Hajj & Umrah",
"ig": "Hajj & Umrah",
"bn": "হজ ও উমরাহ",
"ms": "Haji & Umrah"
},
"Lectures & quizzes": {
"yo": "Ìwàásù & ìdánwò",
"ig": "Okwu ihu ọha & ajụjụ",
"bn": "বক্তৃতা ও কুইজ",
"ms": "Kuliah & kuiz"
},
"Open": {
"yo": "Ṣí i",
"ig": "Mepee",
"bn": "খুলুন",
"ms": "Buka"
},
"Try it now": {
"yo": "Gbìyànjú rẹ̀ báyìí",
"ig": "Nwaa ya ugbu a",
"bn": "এখনই চেষ্টা করুন",
"ms": "Cuba sekarang"
},
"Daily checklist": {
"yo": "Àkọsílẹ̀ ojoojúmọ́",
"ig": "Ndepụta kwa ụbọchị",
"bn": "দৈনিক চেকলিস্ট",
"ms": "Senarai semak harian"
},
"Fasting, the five prayers, Tarawih, Qur’an, dua and sadaqah, with a streak.": {
"yo": "Ààwẹ̀, ìrun márààrún, Tarawih, Kùránì, àdúà àti sàráà, pẹ̀lú ọjọ́ tí kò já.",
"ig": "Ibu ọnụ, ekpere ise, Tarawih, Kur'an, dua na sadaqah, nwere usoro ụbọchị.",
"bn": "রোজা, পাঁচ ওয়াক্ত নামাজ, তারাবিহ, কুরআন, দোয়া ও সদকা, ধারাসহ।",
"ms": "Puasa, solat lima waktu, Tarawih, Al-Quran, doa dan sedekah, dengan rentetan."
},
"A lesson, a dua and a reminder each day, then the quiz.": {
"yo": "Ẹ̀kọ́ kan, àdúà kan àti ìrántí kan lójoojúmọ́, lẹ́yìn náà ìdánwò.",
"ig": "Otu ihe ọmụmụ, otu dua na otu ncheta kwa ụbọchị, mgbe ahụ ajụjụ.",
"bn": "প্রতিদিন একটি পাঠ, একটি দোয়া ও একটি স্মরণিকা, তারপর কুইজ।",
"ms": "Satu pelajaran, satu doa dan satu peringatan setiap hari, kemudian kuiz."
},
"Daily prize quiz": {
"yo": "Ìdánwò ẹ̀bùn ojoojúmọ́",
"ig": "Ajụjụ onyinye kwa ụbọchị",
"bn": "দৈনিক পুরস্কার কুইজ",
"ms": "Kuiz hadiah harian"
},
"First correct entries win. Results after Tarawih, with a live leaderboard.": {
"yo": "Àwọn ìdáhùn tó tọ̀nà àkọ́kọ́ ló máa jàre. Àbájáde lẹ́yìn Tarawih, pẹ̀lú àtẹ aṣáájú tààrà.",
"ig": "Ndị mbụ zara nke ọma ga-emeri. Nsonaazụ mgbe Tarawih gasịrị, nwere tebụl ndị ndu dị ndụ.",
"bn": "প্রথম সঠিক উত্তরদাতারা জেতেন। তারাবিহর পরে ফলাফল, লাইভ লিডারবোর্ডসহ।",
"ms": "Jawapan betul terawal menang. Keputusan selepas Tarawih, dengan papan pendahulu secara langsung."
},
"Eid cards": {
"yo": "Káàdì Ọdún",
"ig": "Kaadị Eid",
"bn": "ঈদ কার্ড",
"ms": "Kad Hari Raya"
},
"Make and share beautiful Eid cards with your family.": {
"yo": "Ṣe káàdì Ọdún tó rẹwà kí o sì pín in pẹ̀lú ẹbí rẹ.",
"ig": "Mee ma kesaa kaadị Eid mara mma na ezinụlọ gị.",
"bn": "সুন্দর ঈদ কার্ড তৈরি করে পরিবারের সাথে শেয়ার করুন।",
"ms": "Buat dan kongsi kad Hari Raya yang cantik bersama keluarga anda."
},
"Age-appropriate": {
"yo": "Tó yẹ fún ọjọ́-orí",
"ig": "Dabara n'afọ",
"bn": "বয়স উপযোগী",
"ms": "Sesuai umur"
},
"Kids only see books, lessons and rooms meant for their age.": {
"yo": "Àwọn ọmọdé ń rí ìwé, ẹ̀kọ́ àti yàrá tó yẹ fún ọjọ́-orí wọn nìkan.",
"ig": "Ụmụaka na-ahụ naanị akwụkwọ, ihe ọmụmụ na ọnụ ụlọ e mere maka afọ ha.",
"bn": "শিশুরা শুধু তাদের বয়সের জন্য তৈরি বই, পাঠ ও রুম দেখে।",
"ms": "Kanak-kanak hanya melihat buku, pelajaran dan bilik untuk umur mereka."
},
"Moderated rooms": {
"yo": "Yàrá tí a ń bójútó",
"ig": "Ọnụ ụlọ a na-elekọta",
"bn": "পরিচালিত রুম",
"ms": "Bilik yang diselia"
},
"Kids rooms are run by our team, and anything can be reported.": {
"yo": "Ẹgbẹ́ wa ló ń darí yàrá àwọn ọmọdé, a sì lè fi ẹjọ́ ohunkóhun sùn.",
"ig": "Otu anyị na-achịkwa ọnụ ụlọ ụmụaka, a pụkwara ịkọ banyere ihe ọ bụla.",
"bn": "শিশুদের রুম আমাদের দল পরিচালনা করে, এবং যেকোনো কিছু রিপোর্ট করা যায়।",
"ms": "Bilik kanak-kanak dikendalikan oleh pasukan kami, dan apa sahaja boleh dilaporkan."
},
"Learning that’s fun": {
"yo": "Ẹ̀kọ́ tó dùn",
"ig": "Ọmụmụ na-atọ ụtọ",
"bn": "আনন্দময় শেখা",
"ms": "Belajar yang menyeronokkan"
},
"Quizzes, streaks and points built for short attention spans.": {
"yo": "Ìdánwò, ọjọ́ tí kò já àti àmì tí a ṣe fún àwọn tí kì í pẹ́ lórí nǹkan kan.",
"ig": "Ajụjụ, usoro ụbọchị na akara e mere maka ndị na-adịghị anọdụ ogologo oge n'otu ihe.",
"bn": "অল্প মনোযোগের জন্য তৈরি কুইজ, ধারা ও পয়েন্ট।",
"ms": "Kuiz, rentetan dan mata yang dibina untuk tumpuan yang singkat."
},
"Progress you can see": {
"yo": "Ìlọsíwájú tí o lè rí",
"ig": "Ọganihu ị nwere ike ịhụ",
"bn": "দেখা যায় এমন অগ্রগতি",
"ms": "Kemajuan yang boleh dilihat"
},
"Points, streaks and finished books show how they’re growing.": {
"yo": "Àmì, ọjọ́ tí kò já àti ìwé tí wọ́n ti parí ń fi bí wọ́n ṣe ń dàgbà hàn.",
"ig": "Akara, usoro ụbọchị na akwụkwọ ha gụchara na-egosi ka ha si eto.",
"bn": "পয়েন্ট, ধারা ও শেষ করা বই দেখায় তারা কীভাবে বেড়ে উঠছে।",
"ms": "Mata, rentetan dan buku yang selesai menunjukkan cara mereka berkembang."
},
"Welcome back": {
"yo": "Káàbọ̀ padà",
"ig": "Nnọọ ọzọ",
"bn": "আবার স্বাগতম",
"ms": "Selamat kembali"
},
"Your streak, badges and Hifz plan are waiting where you left them.": {
"yo": "Ọjọ́ tí kò já, àmì ẹ̀yẹ àti ètò Hifz rẹ ń dúró de ọ níbi tí o fi wọ́n sí.",
"ig": "Usoro ụbọchị gị, baajị na atụmatụ Hifz gị na-echere gị ebe ị hapụrụ ha.",
"bn": "আপনার ধারা, ব্যাজ ও হিফজ পরিকল্পনা যেখানে রেখেছিলেন সেখানেই অপেক্ষা করছে।",
"ms": "Rentetan, lencana dan pelan Hifz anda menanti di tempat anda tinggalkan."
},
"New to IlmStation?": {
"yo": "Ṣé o jẹ́ tuntun sí IlmStation?",
"ig": "Ị bụ onye ọhụrụ na IlmStation?",
"bn": "IlmStation-এ নতুন?",
"ms": "Baharu di IlmStation?"
},
"A few small steps, then your first quest.": {
"yo": "Ìgbésẹ̀ kékeré díẹ̀, lẹ́yìn náà ìrìn-àjò àkọ́kọ́ rẹ.",
"ig": "Nzọụkwụ ole na ole, mgbe ahụ njem ọmụmụ mbụ gị.",
"bn": "কয়েকটি ছোট ধাপ, তারপর আপনার প্রথম কোয়েস্ট।",
"ms": "Beberapa langkah kecil, kemudian misi pertama anda."
},
"Enter your email, or your username if a parent made your account.": {
"yo": "Tẹ ímeèlì rẹ, tàbí orúkọ oníṣe rẹ tí òbí rẹ bá ṣe àkáǹtì rẹ.",
"ig": "Tinye email gị, ma ọ bụ aha njirimara gị ma ọ bụrụ na nne ma ọ bụ nna gị mere akaụntụ gị.",
"bn": "আপনার ইমেইল লিখুন, অথবা অভিভাবক অ্যাকাউন্ট তৈরি করে থাকলে আপনার ইউজারনেম।",
"ms": "Masukkan e-mel anda, atau nama pengguna jika ibu bapa yang membuat akaun anda."
},
"Enter your password.": {
"yo": "Tẹ ọ̀rọ̀ aṣínà rẹ.",
"ig": "Tinye paswọọdụ gị.",
"bn": "আপনার পাসওয়ার্ড লিখুন।",
"ms": "Masukkan kata laluan anda."
},
"Your password": {
"yo": "Ọ̀rọ̀ aṣínà rẹ",
"ig": "Paswọọdụ gị",
"bn": "আপনার পাসওয়ার্ড",
"ms": "Kata laluan anda"
},
"Logging in…": {
"yo": "Ó ń wọlé…",
"ig": "Ọ na-abanye…",
"bn": "লগ ইন হচ্ছে…",
"ms": "Sedang log masuk…"
},
"Show password": {
"yo": "Fi ọ̀rọ̀ aṣínà hàn",
"ig": "Gosi paswọọdụ",
"bn": "পাসওয়ার্ড দেখান",
"ms": "Tunjuk kata laluan"
},
"Hide password": {
"yo": "Fi ọ̀rọ̀ aṣínà pamọ́",
"ig": "Zoo paswọọdụ",
"bn": "পাসওয়ার্ড লুকান",
"ms": "Sembunyi kata laluan"
},
"Choose a language": {
"yo": "Yan èdè kan",
"ig": "Họrọ asụsụ",
"bn": "একটি ভাষা বেছে নিন",
"ms": "Pilih bahasa"
},
"You can change this any time from the site header.": {
"yo": "O lè yí èyí padà nígbàkúùgbà láti orí ojú-òpó.",
"ig": "Ị nwere ike ịgbanwe nke a mgbe ọ bụla site n'elu saịtị.",
"bn": "সাইটের উপরের অংশ থেকে যেকোনো সময় এটি বদলাতে পারবেন।",
"ms": "Anda boleh menukar ini bila-bila masa dari pengepala laman."
},
"Tell us who you are and where to reach you.": {
"yo": "Sọ fún wa ẹni tí o jẹ́ àti bí a ṣe lè kàn sí ọ.",
"ig": "Gwa anyị onye ị bụ na ebe anyị ga-esi kpọtụrụ gị.",
"bn": "আপনি কে এবং কোথায় যোগাযোগ করা যাবে তা জানান।",
"ms": "Beritahu kami siapa anda dan cara menghubungi anda."
},
"Set a password": {
"yo": "Ṣètò ọ̀rọ̀ aṣínà",
"ig": "Tọọ paswọọdụ",
"bn": "একটি পাসওয়ার্ড দিন",
"ms": "Tetapkan kata laluan"
},
"One strong password and you’re in.": {
"yo": "Ọ̀rọ̀ aṣínà kan tó lágbára, o sì ti wọlé.",
"ig": "Otu paswọọdụ siri ike, ị banyela.",
"bn": "একটি শক্তিশালী পাসওয়ার্ড, আর আপনি প্রবেশ করেছেন।",
"ms": "Satu kata laluan yang kukuh dan anda sudah masuk."
},
"A little about you": {
"yo": "Díẹ̀ nípa rẹ",
"ig": "Ntakịrị banyere gị",
"bn": "আপনার সম্পর্কে একটু",
"ms": "Sedikit tentang anda"
},
"This places you in the right learning zone.": {
"yo": "Èyí ń fi ọ́ sí agbègbè ẹ̀kọ́ tó tọ́.",
"ig": "Nke a na-etinye gị na mpaghara ọmụmụ kwesịrị ekwesị.",
"bn": "এটি আপনাকে সঠিক শেখার জোনে রাখে।",
"ms": "Ini meletakkan anda dalam zon pembelajaran yang betul."
},
"Your interests": {
"yo": "Ohun tí o nífẹ̀ẹ́ sí",
"ig": "Ihe masịrị gị",
"bn": "আপনার আগ্রহ",
"ms": "Minat anda"
},
"Pick your favourite topics — choose at least 3.": {
"yo": "Yan àwọn kókó-ọ̀rọ̀ tí o fẹ́ràn jùlọ — yan mẹ́ta ó kéré tán.",
"ig": "Họrọ isiokwu kachasị masị gị — họrọ opekata mpe atọ.",
"bn": "আপনার প্রিয় বিষয়গুলো বেছে নিন — অন্তত ৩টি।",
"ms": "Pilih topik kegemaran anda — sekurang-kurangnya 3."
},
"Quick knowledge check": {
"yo": "Àyẹ̀wò ìmọ̀ kíákíá",
"ig": "Nlele ihe ọmụma ngwa ngwa",
"bn": "দ্রুত জ্ঞান যাচাই",
"ms": "Semakan ilmu pantas"
},
"Optional: 5 questions to set your starting level. No pressure.": {
"yo": "Àṣàyàn: ìbéèrè 5 láti mọ ìpele ìbẹ̀rẹ̀ rẹ. Kò sí ìfúnpá.",
"ig": "Nhọrọ: ajụjụ 5 iji tọọ ọkwa mmalite gị. Enweghị nrụgide.",
"bn": "ঐচ্ছিক: আপনার শুরুর স্তর ঠিক করতে ৫টি প্রশ্ন। কোনো চাপ নেই।",
"ms": "Pilihan: 5 soalan untuk menetapkan tahap permulaan anda. Tiada tekanan."
},
"Enter your full name.": {
"yo": "Tẹ orúkọ rẹ ní kíkún.",
"ig": "Tinye aha gị zuru ezu.",
"bn": "আপনার পুরো নাম লিখুন।",
"ms": "Masukkan nama penuh anda."
},
"Enter a valid email, like name@example.com.": {
"yo": "Tẹ ímeèlì tó tọ́, bí name@example.com.",
"ig": "Tinye email ziri ezi, dị ka name@example.com.",
"bn": "একটি সঠিক ইমেইল লিখুন, যেমন name@example.com।",
"ms": "Masukkan e-mel yang sah, seperti name@example.com."
},
"Username": {
"yo": "Orúkọ oníṣe",
"ig": "Aha njirimara",
"bn": "ইউজারনেম",
"ms": "Nama pengguna"
},
"Create a password": {
"yo": "Ṣẹ̀dá ọ̀rọ̀ aṣínà",
"ig": "Mepụta paswọọdụ",
"bn": "একটি পাসওয়ার্ড তৈরি করুন",
"ms": "Cipta kata laluan"
},
"Confirm password": {
"yo": "Jẹ́rìí ọ̀rọ̀ aṣínà",
"ig": "Kwado paswọọdụ",
"bn": "পাসওয়ার্ড নিশ্চিত করুন",
"ms": "Sahkan kata laluan"
},
"The passwords don’t match yet.": {
"yo": "Àwọn ọ̀rọ̀ aṣínà kò tíì bá ara wọn mu.",
"ig": "Paswọọdụ ndị ahụ adabaghị ọnụ ma.",
"bn": "পাসওয়ার্ড দুটি এখনো মিলছে না।",
"ms": "Kata laluan belum sepadan."
},
"Age group": {
"yo": "Ẹgbẹ́ ọjọ́-orí",
"ig": "Otu afọ",
"bn": "বয়সের গ্রুপ",
"ms": "Kumpulan umur"
},
"Your age group": {
"yo": "Ẹgbẹ́ ọjọ́-orí rẹ",
"ig": "Otu afọ gị",
"bn": "আপনার বয়সের গ্রুপ",
"ms": "Kumpulan umur anda"
},
"Gender": {
"yo": "Akọ tàbí abo",
"ig": "Nwoke ma ọ bụ nwanyị",
"bn": "লিঙ্গ",
"ms": "Jantina"
},
"Choose one to continue.": {
"yo": "Yan ọ̀kan láti tẹ̀síwájú.",
"ig": "Họrọ otu iji gaa n'ihu.",
"bn": "চালিয়ে যেতে একটি বেছে নিন।",
"ms": "Pilih satu untuk teruskan."
},
"Choose your age group to continue.": {
"yo": "Yan ẹgbẹ́ ọjọ́-orí rẹ láti tẹ̀síwájú.",
"ig": "Họrọ otu afọ gị iji gaa n'ihu.",
"bn": "চালিয়ে যেতে আপনার বয়সের গ্রুপ বেছে নিন।",
"ms": "Pilih kumpulan umur anda untuk teruskan."
},
"Under 13?": {
"yo": "Ṣé o kéré sí ọdún 13?",
"ig": "Ị gbaghị afọ 13?",
"bn": "১৩ বছরের কম?",
"ms": "Bawah 13 tahun?"
},
"Creating account…": {
"yo": "Ó ń ṣẹ̀dá àkáǹtì…",
"ig": "Ọ na-emepụta akaụntụ…",
"bn": "অ্যাকাউন্ট তৈরি হচ্ছে…",
"ms": "Mencipta akaun…"
},
"Kids Zone": {
"yo": "Agbègbè Ọmọdé",
"ig": "Mpaghara Ụmụaka",
"bn": "শিশু জোন",
"ms": "Zon Kanak-kanak"
},
"Teens & Young Adults Zone": {
"yo": "Agbègbè Ọ̀dọ́ & Ọ̀dọ́mọdé Àgbà",
"ig": "Mpaghara Ndị nọ n'afọ iri na ụma & Ndị ntorobịa",
"bn": "কিশোর ও তরুণ জোন",
"ms": "Zon Remaja & Belia"
},
"Adult Zone": {
"yo": "Agbègbè Àgbà",
"ig": "Mpaghara Ndị okenye",
"bn": "প্রাপ্তবয়স্ক জোন",
"ms": "Zon Dewasa"
},
"Guided quests for teens and young adults — Qur’an, Seerah and everyday fiqh at a steady pace.": {
"yo": "Ìrìn-àjò tí a ń tọ́ sọ́nà fún ọ̀dọ́ àti ọ̀dọ́mọdé àgbà — Kùránì, Seerah àti fiqh ojoojúmọ́ ní ìwọ̀n tó dúró.",
"ig": "Njem ọmụmụ a na-eduzi maka ndị nọ n'afọ iri na ụma na ndị ntorobịa — Kur'an, Seerah na fiqh kwa ụbọchị n'ọsọ kwụsiri ike.",
"bn": "কিশোর ও তরুণদের জন্য নির্দেশিত কোয়েস্ট — কুরআন, সিরাত ও দৈনন্দিন ফিকহ স্থির গতিতে।",
"ms": "Misi berpandu untuk remaja dan belia — Al-Quran, Sirah dan fiqh harian pada rentak yang tetap."
},
"Deep dives into Islamic knowledge — Fiqh, Aqeedah, Seerah and more.": {
"yo": "Ìwádìí jinlẹ̀ sínú ìmọ̀ Ìsìláàmù — Fiqh, Aqeedah, Seerah àti bẹ́ẹ̀ bẹ́ẹ̀ lọ.",
"ig": "Nyocha miri emi n'ihe ọmụma Alakụba — Fiqh, Aqeedah, Seerah na ndị ọzọ.",
"bn": "ইসলামী জ্ঞানের গভীরে — ফিকহ, আকিদা, সিরাত এবং আরও।",
"ms": "Penerokaan mendalam ilmu Islam — Fiqh, Akidah, Sirah dan banyak lagi."
},
"By creating an account, you agree to our": {
"yo": "Nípa ṣíṣẹ̀dá àkáǹtì, o gbà sí",
"ig": "Site n'imepụta akaụntụ, ị kwenyere na",
"bn": "অ্যাকাউন্ট তৈরি করে আপনি সম্মত হচ্ছেন আমাদের",
"ms": "Dengan mencipta akaun, anda bersetuju dengan"
},
"Log in instead": {
"yo": "Wọlé dípò rẹ̀",
"ig": "Banye kama",
"bn": "বরং লগ ইন করুন",
"ms": "Log masuk sebaliknya"
},
"An account with this email already exists.": {
"yo": "Àkáǹtì pẹ̀lú ímeèlì yìí ti wà tẹ́lẹ̀.",
"ig": "Akaụntụ nwere email a adịlarị.",
"bn": "এই ইমেইল দিয়ে একটি অ্যাকাউন্ট আগে থেকেই আছে।",
"ms": "Akaun dengan e-mel ini sudah wujud."
},
"Go Premium": {
"yo": "Lọ sí Premium",
"ig": "Gaa Premium",
"bn": "প্রিমিয়াম নিন",
"ms": "Langgan Premium"
},
"Profile": {
"yo": "Profaili",
"ig": "Profaịlụ",
"bn": "প্রোফাইল",
"ms": "Profil"
},
"Friends": {
"yo": "Àwọn ọ̀rẹ́",
"ig": "Ndị enyi",
"bn": "বন্ধুরা",
"ms": "Rakan"
},
"Achievements": {
"yo": "Àwọn àṣeyọrí",
"ig": "Ihe ndị e mezuru",
"bn": "অর্জন",
"ms": "Pencapaian"
},
"Wallet": {
"yo": "Àpò owó",
"ig": "Akpa ego",
"bn": "ওয়ালেট",
"ms": "Dompet"
},
"Use points": {
"yo": "Lo àmì",
"ig": "Jiri akara",
"bn": "পয়েন্ট ব্যবহার করুন",
"ms": "Guna mata"
},
"Notifications": {
"yo": "Ìfitónilétí",
"ig": "Ọkwa",
"bn": "নোটিফিকেশন",
"ms": "Pemberitahuan"
},
"Rewards": {
"yo": "Èrè",
"ig": "Ụgwọ ọrụ",
"bn": "পুরস্কার",
"ms": "Ganjaran"
},
"Streak": {
"yo": "Ọjọ́ tí kò já",
"ig": "Usoro ụbọchị",
"bn": "ধারা",
"ms": "Rentetan"
},
"Badges": {
"yo": "Àmì ẹ̀yẹ",
"ig": "Baajị",
"bn": "ব্যাজ",
"ms": "Lencana"
},
"Points": {
"yo": "Àmì",
"ig": "Akara",
"bn": "পয়েন্ট",
"ms": "Mata"
},
"Balance": {
"yo": "Ìyókù",
"ig": "Ego fọdụrụ",
"bn": "ব্যালেন্স",
"ms": "Baki"
},
"Test yourself": {
"yo": "Dán ara rẹ wò",
"ig": "Nwaa onwe gị",
"bn": "নিজেকে যাচাই করুন",
"ms": "Uji diri anda"
},
"Choose a topic": {
"yo": "Yan kókó-ọ̀rọ̀ kan",
"ig": "Họrọ isiokwu",
"bn": "একটি বিষয় বেছে নিন",
"ms": "Pilih topik"
},
"Play now": {
"yo": "Ṣeré báyìí",
"ig": "Kpọọ ugbu a",
"bn": "এখনই খেলুন",
"ms": "Main sekarang"
},
"New": {
"yo": "Tuntun",
"ig": "Ọhụrụ",
"bn": "নতুন",
"ms": "Baharu"
},
"Start quiz": {
"yo": "Bẹ̀rẹ̀ ìdánwò",
"ig": "Malite ajụjụ",
"bn": "কুইজ শুরু করুন",
"ms": "Mula kuiz"
},
"Next question": {
"yo": "Ìbéèrè tó kàn",
"ig": "Ajụjụ na-esote",
"bn": "পরবর্তী প্রশ্ন",
"ms": "Soalan seterusnya"
},
"See results": {
"yo": "Wo àbájáde",
"ig": "Lee nsonaazụ",
"bn": "ফলাফল দেখুন",
"ms": "Lihat keputusan"
},
"Score": {
"yo": "Máàkì",
"ig": "Akara",
"bn": "স্কোর",
"ms": "Markah"
},
"XP earned": {
"yo": "XP tí o jèrè",
"ig": "XP enwetara",
"bn": "অর্জিত XP",
"ms": "XP diperoleh"
},
"Accuracy": {
"yo": "Ìpéye",
"ig": "Izi ezi",
"bn": "নির্ভুলতা",
"ms": "Ketepatan"
},
"Play again": {
"yo": "Tún ṣeré",
"ig": "Kpọọ ọzọ",
"bn": "আবার খেলুন",
"ms": "Main lagi"
},
"Challenge a friend": {
"yo": "Pe ọ̀rẹ́ níjà",
"ig": "Maa enyi aka",
"bn": "বন্ধুকে চ্যালেঞ্জ করুন",
"ms": "Cabar rakan"
},
"Fresh quizzes and interactive games from the IlmStation team.": {
"yo": "Ìdánwò tuntun àti eré ìbáṣepọ̀ láti ọ̀dọ̀ ẹgbẹ́ IlmStation.",
"ig": "Ajụjụ ọhụrụ na egwuregwu mmekọrịta site n'aka otu IlmStation.",
"bn": "IlmStation দলের নতুন কুইজ ও ইন্টারঅ্যাক্টিভ খেলা।",
"ms": "Kuiz baharu dan permainan interaktif daripada pasukan IlmStation."
},
"Aqeedah, Hadith, Seerah, Fiqh, Arabic, Qur’an and more. Short quizzes, XP for every right answer, and challenges with friends.": {
"yo": "Aqeedah, Hadith, Seerah, Fiqh, Lárúbáwá, Kùránì àti bẹ́ẹ̀ bẹ́ẹ̀ lọ. Ìdánwò kúkúrú, XP fún gbogbo ìdáhùn tó tọ̀nà, àti ìpèníjà pẹ̀lú àwọn ọ̀rẹ́.",
"ig": "Aqeedah, Hadith, Seerah, Fiqh, Arabik, Kur'an na ndị ọzọ. Ajụjụ dị mkpụmkpụ, XP maka azịza ziri ezi ọ bụla, na ịma aka na ndị enyi.",
"bn": "আকিদা, হাদিস, সিরাত, ফিকহ, আরবি, কুরআন এবং আরও। ছোট কুইজ, প্রতিটি সঠিক উত্তরে XP, আর বন্ধুদের সাথে চ্যালেঞ্জ।",
"ms": "Akidah, Hadis, Sirah, Fiqh, bahasa Arab, Al-Quran dan banyak lagi. Kuiz ringkas, XP untuk setiap jawapan betul, dan cabaran bersama rakan."
},
"What would you like to do today?": {
"yo": "Kí lo fẹ́ ṣe lónìí?",
"ig": "Gịnị ka ị chọrọ ime taa?",
"bn": "আজ আপনি কী করতে চান?",
"ms": "Apa yang anda mahu lakukan hari ini?"
},
"Fun quizzes · earn stars": {
"yo": "Ìdánwò alárinrin · jèrè ìràwọ̀",
"ig": "Ajụjụ na-atọ ụtọ · nweta kpakpando",
"bn": "মজার কুইজ · তারা অর্জন করো",
"ms": "Kuiz seronok · kumpul bintang"
},
"Your lessons": {
"yo": "Àwọn ẹ̀kọ́ rẹ",
"ig": "Ihe ọmụmụ gị",
"bn": "তোমার পাঠ",
"ms": "Pelajaran kamu"
},
"Games & quizzes": {
"yo": "Eré & ìdánwò",
"ig": "Egwuregwu & ajụjụ",
"bn": "খেলা ও কুইজ",
"ms": "Permainan & kuiz"
},
"Masha’Allah!": {
"yo": "Masha'Allah!",
"ig": "Masha'Allah!",
"bn": "মাশাআল্লাহ!",
"ms": "Masya-Allah!"
},
"Time’s up for today": {
"yo": "Àkókò ti tán fún òní",
"ig": "Oge agwụla maka taa",
"bn": "আজকের সময় শেষ",
"ms": "Masa sudah tamat untuk hari ini"
},
"Get Premium for more time": {
"yo": "Gba Premium fún àkókò síi",
"ig": "Nweta Premium maka oge ọzọ",
"bn": "আরও সময়ের জন্য প্রিমিয়াম নিন",
"ms": "Dapatkan Premium untuk masa lebih"
},
"Download card": {
"yo": "Gba káàdì sílẹ̀",
"ig": "Budata kaadị",
"bn": "কার্ড ডাউনলোড করুন",
"ms": "Muat turun kad"
},
"Read Surah Al-Kahf today": {
"yo": "Ka Sùúrà Al-Kahf lónìí",
"ig": "Gụọ Surah Al-Kahf taa",
"bn": "আজ সূরা আল-কাহফ পড়ুন",
"ms": "Baca Surah Al-Kahfi hari ini"
},
"Read Al-Kahf": {
"yo": "Ka Al-Kahf",
"ig": "Gụọ Al-Kahf",
"bn": "আল-কাহফ পড়ুন",
"ms": "Baca Al-Kahfi"
},
"Browse the library": {
"yo": "Wo ilé-ìkàwé",
"ig": "Lelee ọbá akwụkwọ",
"bn": "লাইব্রেরি ঘুরে দেখুন",
"ms": "Layari perpustakaan"
},
"Saved": {
"yo": "A ti fipamọ́",
"ig": "Echekwala",
"bn": "সংরক্ষিত",
"ms": "Disimpan"
},
"Copied": {
"yo": "A ti ṣe ẹ̀dà",
"ig": "Edetuola",
"bn": "কপি হয়েছে",
"ms": "Disalin"
},
"Log in to save wisdom.": {
"yo": "Wọlé láti fi ọgbọ́n pamọ́.",
"ig": "Banye iji chekwaa amamihe.",
"bn": "হিকমাহ সংরক্ষণ করতে লগ ইন করুন।",
"ms": "Log masuk untuk menyimpan hikmah."
},
"Reciter": {
"yo": "Olùkà",
"ig": "Onye ọgụgụ",
"bn": "কারী",
"ms": "Qari"
},
"Calculation": {
"yo": "Ìṣirò",
"ig": "Ngụkọ",
"bn": "হিসাব পদ্ধতি",
"ms": "Kiraan"
},
"You’re on the free plan": {
"yo": "O wà lórí ètò ọ̀fẹ́",
"ig": "Ị nọ na atụmatụ n'efu",
"bn": "আপনি বিনামূল্যের প্ল্যানে আছেন",
"ms": "Anda menggunakan pelan percuma"
},
"Premium is active": {
"yo": "Premium ń ṣiṣẹ́",
"ig": "Premium na-arụ ọrụ",
"bn": "প্রিমিয়াম চালু আছে",
"ms": "Premium aktif"
},
"Custom pricing": {
"yo": "Iye owó àkànṣe",
"ig": "Ọnụahịa pụrụ iche",
"bn": "বিশেষ মূল্য",
"ms": "Harga tersuai"
},
"Get it": {
"yo": "Gbà á",
"ig": "Nweta ya",
"bn": "নিন",
"ms": "Dapatkan"
},
"All time": {
"yo": "Gbogbo àkókò",
"ig": "Oge niile",
"bn": "সর্বকাল",
"ms": "Sepanjang masa"
},
"Among friends": {
"yo": "Láàrin àwọn ọ̀rẹ́",
"ig": "N'etiti ndị enyi",
"bn": "বন্ধুদের মধ্যে",
"ms": "Antara rakan"
},
"Global": {
"yo": "Káàkiri ayé",
"ig": "Ụwa niile",
"bn": "বিশ্বব্যাপী",
"ms": "Global"
},
"Find friends": {
"yo": "Wá àwọn ọ̀rẹ́",
"ig": "Chọta ndị enyi",
"bn": "বন্ধু খুঁজুন",
"ms": "Cari rakan"
},
"Requests": {
"yo": "Àwọn ìbéèrè",
"ig": "Arịrịọ",
"bn": "অনুরোধ",
"ms": "Permintaan"
},
"Learning record": {
"yo": "Àkọsílẹ̀ ẹ̀kọ́",
"ig": "Ndekọ ọmụmụ",
"bn": "শেখার রেকর্ড",
"ms": "Rekod pembelajaran"
},
"Your progress": {
"yo": "Ìlọsíwájú rẹ",
"ig": "Ọganihu gị",
"bn": "আপনার অগ্রগতি",
"ms": "Kemajuan anda"
},
"Topic performance": {
"yo": "Ìṣe nínú kókó-ọ̀rọ̀",
"ig": "Arụmọrụ n'isiokwu",
"bn": "বিষয়ভিত্তিক ফলাফল",
"ms": "Prestasi topik"
},
"How to earn": {
"yo": "Bí o ṣe lè jèrè",
"ig": "Otu esi enweta",
"bn": "কীভাবে অর্জন করবেন",
"ms": "Cara memperoleh"
},
"From new levels": {
"yo": "Láti àwọn ìpele tuntun",
"ig": "Site n'ọkwa ọhụrụ",
"bn": "নতুন স্তর থেকে",
"ms": "Dari tahap baharu"
},
"Ask IlmBot": {
"yo": "Béèrè lọ́wọ́ IlmBot",
"ig": "Jụọ IlmBot",
"bn": "IlmBot-কে জিজ্ঞাসা করুন",
"ms": "Tanya IlmBot"
},
"Not a fatwa service": {
"yo": "Kì í ṣe iṣẹ́ fátúwà",
"ig": "Ọ bụghị ọrụ fatwa",
"bn": "এটি ফতোয়া সেবা নয়",
"ms": "Bukan perkhidmatan fatwa"
},
"Ask a learning question…": {
"yo": "Béèrè ìbéèrè ẹ̀kọ́ kan…",
"ig": "Jụọ ajụjụ ọmụmụ…",
"bn": "শেখার একটি প্রশ্ন করুন…",
"ms": "Tanya soalan pembelajaran…"
},
"Open navigation": {
"yo": "Ṣí àtòjọ",
"ig": "Mepee nduzi",
"bn": "নেভিগেশন খুলুন",
"ms": "Buka navigasi"
},
"Toggle navigation": {
"yo": "Yí àtòjọ padà",
"ig": "Gbanwee nduzi",
"bn": "নেভিগেশন টগল করুন",
"ms": "Togol navigasi"
},
"Arabic": {
"yo": "Lárúbáwá",
"ig": "Arabik",
"bn": "আরবি",
"ms": "Bahasa Arab"
},
"Aqeedah": {
"yo": "Aqeedah",
"ig": "Aqeedah",
"bn": "আকিদা",
"ms": "Akidah"
},
"Hadith": {
"yo": "Hadith",
"ig": "Hadith",
"bn": "হাদিস",
"ms": "Hadis"
},
"Seerah": {
"yo": "Seerah",
"ig": "Seerah",
"bn": "সিরাত",
"ms": "Sirah"
},
"Fiqh": {
"yo": "Fiqh",
"ig": "Fiqh",
"bn": "ফিকহ",
"ms": "Fiqh"
},
"Tafsir": {
"yo": "Tafsir",
"ig": "Tafsir",
"bn": "তাফসির",
"ms": "Tafsir"
},
"Dua": {
"yo": "Àdúà",
"ig": "Dua",
"bn": "দোয়া",
"ms": "Doa"
},
"{n}% read": {
"yo": "{n}% ti kà",
"ig": "{n}% agụrụ",
"bn": "{n}% পড়া হয়েছে",
"ms": "{n}% dibaca"
},
"DAYS TO RAMADAN": {
"yo": "ỌJỌ́ SÍ RAMADAN",
"ig": "ỤBỌCHỊ RUO RAMADAN",
"bn": "রমজান পর্যন্ত দিন",
"ms": "HARI MENUJU RAMADAN"
},
"days to ramadan": {
"yo": "ọjọ́ sí ramadan",
"ig": "ụbọchị ruo ramadan",
"bn": "রমজান পর্যন্ত দিন",
"ms": "hari menuju ramadan"
},
"Days to Ramadan!": {
"yo": "Ọjọ́ sí Ramadan!",
"ig": "Ụbọchị ruo Ramadan!",
"bn": "রমজান পর্যন্ত দিন!",
"ms": "Hari menuju Ramadan!"
},
"{n} days to Ramadan": {
"yo": "Ọjọ́ {n} sí Ramadan",
"ig": "Ụbọchị {n} ruo Ramadan",
"bn": "রমজান পর্যন্ত {n} দিন",
"ms": "{n} hari menuju Ramadan"
},
"{n} days": {
"yo": "Ọjọ́ {n}",
"ig": "Ụbọchị {n}",
"bn": "{n} দিন",
"ms": "{n} hari"
},
"{n} XP": {
"yo": "{n} XP",
"ig": "{n} XP",
"bn": "{n} XP",
"ms": "{n} XP"
},
"{n}-day streak": {
"yo": "Ọjọ́ {n} tí kò já",
"ig": "Usoro ụbọchị {n}",
"bn": "{n} দিনের ধারা",
"ms": "Rentetan {n} hari"
},
"Change city": {
"yo": "Yí ìlú padà",
"ig": "Gbanwee obodo",
"bn": "শহর পরিবর্তন করুন",
"ms": "Tukar bandar"
},
"Your country’s usual method (default)": {
"yo": "Ọ̀nà tí orílẹ̀-èdè rẹ máa ń lò (àìyípadà)",
"ig": "Ụzọ obodo gị na-ejikarị (ndabara)",
"bn": "আপনার দেশের প্রচলিত পদ্ধতি (ডিফল্ট)",
"ms": "Kaedah biasa negara anda (lalai)"
},
"Muslim World League": {
"yo": "Muslim World League",
"ig": "Muslim World League",
"bn": "Muslim World League",
"ms": "Muslim World League"
},
"Egyptian General Authority": {
"yo": "Egyptian General Authority",
"ig": "Egyptian General Authority",
"bn": "Egyptian General Authority",
"ms": "Egyptian General Authority"
},
"Moonsighting Committee": {
"yo": "Moonsighting Committee",
"ig": "Moonsighting Committee",
"bn": "Moonsighting Committee",
"ms": "Moonsighting Committee"
},
"Umm al-Qura, Makkah": {
"yo": "Umm al-Qura, Mákà",
"ig": "Umm al-Qura, Makkah",
"bn": "উম্মুল কুরা, মক্কা",
"ms": "Umm al-Qura, Makkah"
},
"Auto": {
"yo": "Fúnra rẹ̀",
"ig": "Akpaghị aka",
"bn": "স্বয়ংক্রিয়",
"ms": "Auto"
},
"Adhan 🔔": {
"yo": "Àdhàn 🔔",
"ig": "Adhan 🔔",
"bn": "আজান 🔔",
"ms": "Azan 🔔"
},
"🔔 Adhan": {
"yo": "🔔 Àdhàn",
"ig": "🔔 Adhan",
"bn": "🔔 আজান",
"ms": "🔔 Azan"
},
"12h": {
"yo": "12h",
"ig": "12h",
"bn": "১২ ঘণ্টা",
"ms": "12j"
},
"24h": {
"yo": "24h",
"ig": "24h",
"bn": "২৪ ঘণ্টা",
"ms": "24j"
},
"in": {
"yo": "ní",
"ig": "n'ime",
"bn": "বাকি",
"ms": "dalam"
},
"{n}h {n}m": {
"yo": "{n}h {n}m",
"ig": "{n}h {n}m",
"bn": "{n}ঘ {n}মি",
"ms": "{n}j {n}m"
},
"in {n}h {n}m": {
"yo": "ní {n}h {n}m",
"ig": "n'ime {n}h {n}m",
"bn": "{n}ঘ {n}মি বাকি",
"ms": "dalam {n}j {n}m"
},
"{n}m": {
"yo": "{n}m",
"ig": "{n}m",
"bn": "{n}মি",
"ms": "{n}m"
},
"in {n}m": {
"yo": "ní {n}m",
"ig": "n'ime {n}m",
"bn": "{n}মি বাকি",
"ms": "dalam {n}m"
},
"{n}:{n} AM": {
"yo": "{n}:{n} òwúrọ̀",
"ig": "{n}:{n} ụtụtụ",
"bn": "সকাল {n}:{n}",
"ms": "{n}:{n} PG"
},
"{n}:{n} PM": {
"yo": "{n}:{n} ọ̀sán",
"ig": "{n}:{n} ehihie",
"bn": "বিকাল {n}:{n}",
"ms": "{n}:{n} PTG"
},
"Today’s prayer times": {
"yo": "Àkókò ìrun òní",
"ig": "Oge ekpere taa",
"bn": "আজকের নামাজের সময়",
"ms": "Waktu solat hari ini"
},
"Use my location": {
"yo": "Lo ibi tí mo wà",
"ig": "Jiri ebe m nọ",
"bn": "আমার অবস্থান ব্যবহার করুন",
"ms": "Guna lokasi saya"
},
"Search a city…": {
"yo": "Wá ìlú kan…",
"ig": "Chọọ obodo…",
"bn": "শহর খুঁজুন…",
"ms": "Cari bandar…"
},
"TODAY": {
"yo": "ÒNÍ",
"ig": "TAA",
"bn": "আজ",
"ms": "HARI INI"
},
"Newcomer": {
"yo": "Ẹni tuntun",
"ig": "Onye ọhụrụ",
"bn": "নবাগত",
"ms": "Pendatang baharu"
},
"Seeker": {
"yo": "Olùwá",
"ig": "Onye na-achọ",
"bn": "অন্বেষী",
"ms": "Pencari"
},
"Learner": {
"yo": "Akẹ́kọ̀ọ́",
"ig": "Onye na-amụ ihe",
"bn": "শিক্ষার্থী",
"ms": "Pelajar"
},
"Student": {
"yo": "Akẹ́kọ̀ọ́",
"ig": "Nwa akwụkwọ",
"bn": "ছাত্র",
"ms": "Murid"
},
"Scholar": {
"yo": "Onímọ̀",
"ig": "Ọkà mmụta",
"bn": "আলেম",
"ms": "Ulama"
},
"Guardian": {
"yo": "Alábòójútó",
"ig": "Onye nche",
"bn": "অভিভাবক",
"ms": "Penjaga"
},
"Explorer": {
"yo": "Aṣàwárí",
"ig": "Onye nchọpụta",
"bn": "অভিযাত্রী",
"ms": "Penjelajah"
},
"Hafiz": {
"yo": "Hafiz",
"ig": "Hafiz",
"bn": "হাফেজ",
"ms": "Hafiz"
},
"Teacher": {
"yo": "Olùkọ́",
"ig": "Onye nkuzi",
"bn": "শিক্ষক",
"ms": "Guru"
},
"🌅 Daily Wisdom": {
"yo": "🌅 Ọgbọ́n Ojoojúmọ́",
"ig": "🌅 Amamihe Kwa Ụbọchị",
"bn": "🌅 দৈনিক হিকমাহ",
"ms": "🌅 Hikmah Harian"
},
"🕌 Prayer times": {
"yo": "🕌 Àkókò ìrun",
"ig": "🕌 Oge ekpere",
"bn": "🕌 নামাজের সময়",
"ms": "🕌 Waktu solat"
},
"Daily tilawah": {
"yo": "Tilawah ojoojúmọ́",
"ig": "Tilawah kwa ụbọchị",
"bn": "দৈনিক তিলাওয়াত",
"ms": "Tilawah harian"
},
"📖 Daily tilawah": {
"yo": "📖 Tilawah ojoojúmọ́",
"ig": "📖 Tilawah kwa ụbọchị",
"bn": "📖 দৈনিক তিলাওয়াত",
"ms": "📖 Tilawah harian"
},
"Streak reminder": {
"yo": "Ìrántí ọjọ́ tí kò já",
"ig": "Ncheta usoro ụbọchị",
"bn": "ধারার রিমাইন্ডার",
"ms": "Peringatan rentetan"
},
"🔥 Streak reminder": {
"yo": "🔥 Ìrántí ọjọ́ tí kò já",
"ig": "🔥 Ncheta usoro ụbọchị",
"bn": "🔥 ধারার রিমাইন্ডার",
"ms": "🔥 Peringatan rentetan"
},
"Friday Al-Kahf": {
"yo": "Al-Kahf ọjọ́ Jimọ̀",
"ig": "Al-Kahf Fraịdee",
"bn": "জুমার দিনে আল-কাহফ",
"ms": "Al-Kahfi hari Jumaat"
},
"📖 Friday Al-Kahf": {
"yo": "📖 Al-Kahf ọjọ́ Jimọ̀",
"ig": "📖 Al-Kahf Fraịdee",
"bn": "📖 জুমার দিনে আল-কাহফ",
"ms": "📖 Al-Kahfi hari Jumaat"
},
"Ramadan prize quiz": {
"yo": "Ìdánwò ẹ̀bùn Ramadan",
"ig": "Ajụjụ onyinye Ramadan",
"bn": "রমজান পুরস্কার কুইজ",
"ms": "Kuiz hadiah Ramadan"
},
"🏆 Ramadan prize quiz": {
"yo": "🏆 Ìdánwò ẹ̀bùn Ramadan",
"ig": "🏆 Ajụjụ onyinye Ramadan",
"bn": "🏆 রমজান পুরস্কার কুইজ",
"ms": "🏆 Kuiz hadiah Ramadan"
},
"Every morning at {n}:{n}": {
"yo": "Ní àràárọ̀ ní {n}:{n}",
"ig": "Kwa ụtụtụ n'elekere {n}:{n}",
"bn": "প্রতিদিন সকাল {n}:{n}-এ",
"ms": "Setiap pagi pada {n}:{n}"
},
"At each of the five prayers": {
"yo": "Ní ìrun márààrún",
"ig": "N'ekpere ise ọ bụla",
"bn": "পাঁচ ওয়াক্ত নামাজের প্রতিটিতে",
"ms": "Pada setiap solat lima waktu"
},
"At the time you choose below": {
"yo": "Ní àkókò tí o yàn nísàlẹ̀",
"ig": "N'oge ị họọrọ n'okpuru",
"bn": "নিচে আপনার বেছে নেওয়া সময়ে",
"ms": "Pada masa yang anda pilih di bawah"
},
"In the evening, if you haven't learned yet": {
"yo": "Ní ìrọ̀lẹ́, tí o kò bá tíì kọ́ ẹ̀kọ́",
"ig": "Na mgbede, ma ọ bụrụ na ị mụbeghị ihe",
"bn": "সন্ধ্যায়, যদি এখনো না শিখে থাকেন",
"ms": "Pada waktu petang, jika anda belum belajar"
},
"Friday morning": {
"yo": "Àárọ̀ ọjọ́ Jimọ̀",
"ig": "Ụtụtụ Fraịdee",
"bn": "শুক্রবার সকাল",
"ms": "Pagi Jumaat"
},
"When each day's quiz opens": {
"yo": "Nígbà tí ìdánwò ọjọ́ kọ̀ọ̀kan bá ṣí",
"ig": "Mgbe ajụjụ ụbọchị ọ bụla mepere",
"bn": "যখন প্রতিদিনের কুইজ খোলে",
"ms": "Apabila kuiz setiap hari dibuka"
},
"Tilawah time": {
"yo": "Àkókò Tilawah",
"ig": "Oge Tilawah",
"bn": "তিলাওয়াতের সময়",
"ms": "Masa tilawah"
},
"Update device and location": {
"yo": "Ṣe àtúnṣe ẹ̀rọ àti ibi tí o wà",
"ig": "Melite ngwaọrụ na ebe ị nọ",
"bn": "ডিভাইস ও অবস্থান হালনাগাদ করুন",
"ms": "Kemas kini peranti dan lokasi"
},
"Notifications are on": {
"yo": "Ìfitónilétí wà ní títàn",
"ig": "Ọkwa gbanyere",
"bn": "নোটিফিকেশন চালু আছে",
"ms": "Pemberitahuan dihidupkan"
},
"Notifications are off": {
"yo": "Ìfitónilétí wà ní pípa",
"ig": "Ọkwa gbanyụrụ",
"bn": "নোটিফিকেশন বন্ধ আছে",
"ms": "Pemberitahuan dimatikan"
},
"Sun": {
"yo": "Àìkú",
"ig": "Ụka",
"bn": "রবি",
"ms": "Ahd"
},
"Mon": {
"yo": "Ajé",
"ig": "Mọn",
"bn": "সোম",
"ms": "Isn"
},
"Tue": {
"yo": "Ìṣẹ́gun",
"ig": "Tiu",
"bn": "মঙ্গল",
"ms": "Sel"
},
"Wed": {
"yo": "Ọjọ́rú",
"ig": "Wen",
"bn": "বুধ",
"ms": "Rab"
},
"Thu": {
"yo": "Ọjọ́bọ̀",
"ig": "Tọọ",
"bn": "বৃহস্পতি",
"ms": "Kha"
},
"Fri": {
"yo": "Ẹtì",
"ig": "Fraị",
"bn": "শুক্র",
"ms": "Jum"
},
"Sat": {
"yo": "Àbámẹ́ta",
"ig": "Sat",
"bn": "শনি",
"ms": "Sab"
},
"🧑 Teen & Adult": {
"yo": "🧑 Ọ̀dọ́ & Àgbà",
"ig": "🧑 Ndị ntorobịa & Ndị okenye",
"bn": "🧑 কিশোর ও প্রাপ্তবয়স্ক",
"ms": "🧑 Remaja & Dewasa"
},
"🧒 Child": {
"yo": "🧒 Ọmọdé",
"ig": "🧒 Nwatakịrị",
"bn": "🧒 শিশু",
"ms": "🧒 Kanak-kanak"
},
"👋 Ask your parent for your username and password.": {
"yo": "👋 Béèrè orúkọ oníṣe àti ọ̀rọ̀ aṣínà rẹ lọ́wọ́ òbí rẹ.",
"ig": "👋 Jụọ nne ma ọ bụ nna gị aha njirimara na paswọọdụ gị.",
"bn": "👋 তোমার অভিভাবকের কাছে ইউজারনেম ও পাসওয়ার্ড চাও।",
"ms": "👋 Minta nama pengguna dan kata laluan daripada ibu bapa kamu."
},
"Forgot it? Ask your parent.": {
"yo": "Ṣé o gbàgbé? Béèrè lọ́wọ́ òbí rẹ.",
"ig": "Chefuru ya? Jụọ nne ma ọ bụ nna gị.",
"bn": "ভুলে গেছ? অভিভাবককে জিজ্ঞাসা করো।",
"ms": "Terlupa? Tanya ibu bapa kamu."
},
"e.g. amina_10": {
"yo": "àpẹẹrẹ: amina_10",
"ig": "dịka: amina_10",
"bn": "যেমন: amina_10",
"ms": "cth. amina_10"
},
"Email address": {
"yo": "Àdírẹ́sì ímeèlì",
"ig": "Adreesị email",
"bn": "ইমেইল ঠিকানা",
"ms": "Alamat e-mel"
},
"Log in to IlmStation": {
"yo": "Wọlé sí IlmStation",
"ig": "Banye na IlmStation",
"bn": "IlmStation-এ লগ ইন করুন",
"ms": "Log masuk ke IlmStation"
},
"Pick up today’s quest where you left it.": {
"yo": "Tẹ̀síwájú ìrìn-àjò òní níbi tí o fi í sí.",
"ig": "Gaa n'ihu njem ọmụmụ taa ebe ị hapụrụ ya.",
"bn": "আজকের কোয়েস্ট যেখানে রেখেছিলেন সেখান থেকে শুরু করুন।",
"ms": "Sambung misi hari ini dari tempat anda tinggalkan."
},
"OR": {
"yo": "TÀBÍ",
"ig": "MA Ọ BỤ",
"bn": "অথবা",
"ms": "ATAU"
},
"Ta-Ha 20:114": {
"yo": "Ta-Ha 20:114",
"ig": "Ta-Ha 20:114",
"bn": "ত্বা-হা ২০:১১৪",
"ms": "Ta-Ha 20:114"
},
"Teen & Adult": {
"yo": "Ọ̀dọ́ & Àgbà",
"ig": "Ndị ntorobịa & Ndị okenye",
"bn": "কিশোর ও প্রাপ্তবয়স্ক",
"ms": "Remaja & Dewasa"
},
"Child": {
"yo": "Ọmọdé",
"ig": "Nwatakịrị",
"bn": "শিশু",
"ms": "Kanak-kanak"
},
"Log in with Google or your email": {
"yo": "Wọlé pẹ̀lú Google tàbí ímeèlì rẹ",
"ig": "Banye na Google ma ọ bụ email gị",
"bn": "Google বা আপনার ইমেইল দিয়ে লগ ইন করুন",
"ms": "Log masuk dengan Google atau e-mel anda"
},
"Log in with the username your parent gave you": {
"yo": "Wọlé pẹ̀lú orúkọ oníṣe tí òbí rẹ fún ọ",
"ig": "Banye na aha njirimara nne ma ọ bụ nna gị nyere gị",
"bn": "অভিভাবকের দেওয়া ইউজারনেম দিয়ে লগ ইন করো",
"ms": "Log masuk dengan nama pengguna yang diberi oleh ibu bapa kamu"
},
"Change": {
"yo": "Yí padà",
"ig": "Gbanwee",
"bn": "পরিবর্তন",
"ms": "Tukar"
},
"Your account": {
"yo": "Àkáǹtì rẹ",
"ig": "Akaụntụ gị",
"bn": "আপনার অ্যাকাউন্ট",
"ms": "Akaun anda"
},
"Me": {
"yo": "Èmi",
"ig": "Mụ",
"bn": "আমি",
"ms": "Saya"
},
"Your profile": {
"yo": "Profaili rẹ",
"ig": "Profaịlụ gị",
"bn": "আপনার প্রোফাইল",
"ms": "Profil anda"
},
"Free plan": {
"yo": "Ètò ọ̀fẹ́",
"ig": "Atụmatụ n'efu",
"bn": "বিনামূল্যের প্ল্যান",
"ms": "Pelan percuma"
},
"My progress": {
"yo": "Ìlọsíwájú mi",
"ig": "Ọganihu m",
"bn": "আমার অগ্রগতি",
"ms": "Kemajuan saya"
},
"Stars, levels and streak": {
"yo": "Ìràwọ̀, ìpele àti ọjọ́ tí kò já",
"ig": "Kpakpando, ọkwa na usoro ụbọchị",
"bn": "তারা, স্তর ও ধারা",
"ms": "Bintang, tahap dan rentetan"
},
"My badges": {
"yo": "Àwọn àmì ẹ̀yẹ mi",
"ig": "Baajị m",
"bn": "আমার ব্যাজ",
"ms": "Lencana saya"
},
"Everything you’ve earned": {
"yo": "Gbogbo ohun tí o ti jèrè",
"ig": "Ihe niile i nwetara",
"bn": "আপনার অর্জিত সবকিছু",
"ms": "Semua yang telah anda peroleh"
},
"My lessons": {
"yo": "Àwọn ẹ̀kọ́ mi",
"ig": "Ihe ọmụmụ m",
"bn": "আমার পাঠ",
"ms": "Pelajaran saya"
},
"Keep learning": {
"yo": "Máa kọ́ ẹ̀kọ́ lọ",
"ig": "Gaa n'ihu na-amụ ihe",
"bn": "শেখা চালিয়ে যান",
"ms": "Terus belajar"
},
"Language and more": {
"yo": "Èdè àti àwọn mìíràn",
"ig": "Asụsụ na ndị ọzọ",
"bn": "ভাষা ও আরও",
"ms": "Bahasa dan lain-lain"
},
"Your learning record": {
"yo": "Àkọsílẹ̀ ẹ̀kọ́ rẹ",
"ig": "Ndekọ ọmụmụ gị",
"bn": "আপনার শেখার রেকর্ড",
"ms": "Rekod pembelajaran anda"
},
"Daily and weekly goals": {
"yo": "Àfojúsùn ojoojúmọ́ àti ọ̀sọ̀ọ̀sẹ̀",
"ig": "Ebumnuche kwa ụbọchị na kwa izu",
"bn": "দৈনিক ও সাপ্তাহিক লক্ষ্য",
"ms": "Sasaran harian dan mingguan"
},
"Wallet & points": {
"yo": "Àpò owó & àmì",
"ig": "Akpa ego & akara",
"bn": "ওয়ালেট ও পয়েন্ট",
"ms": "Dompet & mata"
},
"Friends & challenges": {
"yo": "Ọ̀rẹ́ & ìpèníjà",
"ig": "Ndị enyi & ịma aka",
"bn": "বন্ধু ও চ্যালেঞ্জ",
"ms": "Rakan & cabaran"
},
"Your circle": {
"yo": "Àyíká rẹ",
"ig": "Okirikiri gị",
"bn": "আপনার বৃত্ত",
"ms": "Bulatan anda"
},
"Children’s accounts and family plan": {
"yo": "Àkáǹtì àwọn ọmọdé àti ètò ẹbí",
"ig": "Akaụntụ ụmụaka na atụmatụ ezinụlọ",
"bn": "শিশুদের অ্যাকাউন্ট ও পারিবারিক প্ল্যান",
"ms": "Akaun kanak-kanak dan pelan keluarga"
},
"Your plan": {
"yo": "Ètò rẹ",
"ig": "Atụmatụ gị",
"bn": "আপনার প্ল্যান",
"ms": "Pelan anda"
},
"See plans": {
"yo": "Wo àwọn ètò",
"ig": "Lee atụmatụ",
"bn": "প্ল্যান দেখুন",
"ms": "Lihat pelan"
},
"Invite friends": {
"yo": "Pe àwọn ọ̀rẹ́",
"ig": "Kpọọ ndị enyi",
"bn": "বন্ধুদের আমন্ত্রণ জানান",
"ms": "Jemput rakan"
},
"Share IlmStation": {
"yo": "Pín IlmStation",
"ig": "Kesaa IlmStation",
"bn": "IlmStation শেয়ার করুন",
"ms": "Kongsi IlmStation"
},
"⚙️ Settings": {
"yo": "⚙️ Ètò",
"ig": "⚙️ Ntọala",
"bn": "⚙️ সেটিংস",
"ms": "⚙️ Tetapan"
},
"❓ Help & contact": {
"yo": "❓ Ìrànlọ́wọ́ & ìkànsí",
"ig": "❓ Enyemaka & kpọtụrụ",
"bn": "❓ সাহায্য ও যোগাযোগ",
"ms": "❓ Bantuan & hubungi"
},
"📄 Privacy Policy": {
"yo": "📄 Ìlànà Àṣírí",
"ig": "📄 Iwu Nzuzo",
"bn": "📄 গোপনীয়তা নীতি",
"ms": "📄 Dasar Privasi"
},
"📄 Terms of Use": {
"yo": "📄 Àwọn Òfin Ìlò",
"ig": "📄 Usoro Ojiji",
"bn": "📄 ব্যবহারের শর্তাবলি",
"ms": "📄 Terma Penggunaan"
},
"🚪 Log out": {
"yo": "🚪 Jáde",
"ig": "🚪 Pụọ",
"bn": "🚪 লগ আউট",
"ms": "🚪 Log keluar"
},
"Link copied": {
"yo": "A ti ṣe ẹ̀dà ìjápọ̀",
"ig": "Edetuola njikọ",
"bn": "লিংক কপি হয়েছে",
"ms": "Pautan disalin"
},
"Logged out": {
"yo": "O ti jáde",
"ig": "Ịpụọla",
"bn": "লগ আউট হয়েছে",
"ms": "Telah log keluar"
},
"Level {n}": {
"yo": "Ìpele {n}",
"ig": "Ọkwa {n}",
"bn": "স্তর {n}",
"ms": "Tahap {n}"
},
"Help & contact": {
"yo": "Ìrànlọ́wọ́ & ìkànsí",
"ig": "Enyemaka & kpọtụrụ",
"bn": "সাহায্য ও যোগাযোগ",
"ms": "Bantuan & hubungi"
},
"Free trial": {
"yo": "Ìgbìyànjú ọ̀fẹ́",
"ig": "Nnwale n'efu",
"bn": "বিনামূল্যে ট্রায়াল",
"ms": "Percubaan percuma"
},
"Curriculum journey": {
"yo": "Ìrìn-àjò ẹ̀kọ́",
"ig": "Njem ọmụmụ",
"bn": "পাঠ্যক্রমের যাত্রা",
"ms": "Perjalanan kurikulum"
},
"Quest Map": {
"yo": "Máàpù Ìrìn-àjò",
"ig": "Maapụ Njem",
"bn": "কোয়েস্ট ম্যাপ",
"ms": "Peta Misi"
},
"← Map": {
"yo": "← Máàpù",
"ig": "← Maapụ",
"bn": "← ম্যাপ",
"ms": "← Peta"
},
"{n} lessons · {n}%": {
"yo": "Ẹ̀kọ́ {n} · {n}%",
"ig": "Ihe ọmụmụ {n} · {n}%",
"bn": "{n}টি পাঠ · {n}%",
"ms": "{n} pelajaran · {n}%"
},
"This lesson is Premium.": {
"yo": "Ẹ̀kọ́ yìí jẹ́ Premium.",
"ig": "Ihe ọmụmụ a bụ Premium.",
"bn": "এই পাঠটি প্রিমিয়াম।",
"ms": "Pelajaran ini Premium."
},
"Family learning": {
"yo": "Ẹ̀kọ́ ẹbí",
"ig": "Ọmụmụ ezinụlọ",
"bn": "পারিবারিক শিক্ষা",
"ms": "Pembelajaran keluarga"
},
"Family Halaqah": {
"yo": "Halaqah Ẹbí",
"ig": "Halaqah Ezinụlọ",
"bn": "পারিবারিক হালাকা",
"ms": "Halaqah Keluarga"
},
"Host": {
"yo": "Agbàlejò",
"ig": "Onye nnabata",
"bn": "হোস্ট",
"ms": "Hos"
},
"Guest": {
"yo": "Àlejò",
"ig": "Ọbịa",
"bn": "অতিথি",
"ms": "Tetamu"
},
"Create a room": {
"yo": "Ṣẹ̀dá yàrá kan",
"ig": "Mepụta ọnụ ụlọ",
"bn": "একটি রুম তৈরি করুন",
"ms": "Cipta bilik"
},
"Join a room": {
"yo": "Darapọ̀ mọ́ yàrá kan",
"ig": "Sonye n'ọnụ ụlọ",
"bn": "একটি রুমে যোগ দিন",
"ms": "Sertai bilik"
},
"Topic": {
"yo": "Kókó-ọ̀rọ̀",
"ig": "Isiokwu",
"bn": "বিষয়",
"ms": "Topik"
},
"Questions": {
"yo": "Àwọn ìbéèrè",
"ig": "Ajụjụ",
"bn": "প্রশ্ন",
"ms": "Soalan"
},
"Time per question": {
"yo": "Àkókò fún ìbéèrè kọ̀ọ̀kan",
"ig": "Oge maka ajụjụ ọ bụla",
"bn": "প্রতি প্রশ্নের সময়",
"ms": "Masa setiap soalan"
},
"Ask the host for the room code.": {
"yo": "Béèrè kóòdù yàrá lọ́wọ́ agbàlejò.",
"ig": "Jụọ onye nnabata koodu ọnụ ụlọ.",
"bn": "হোস্টের কাছে রুম কোড চান।",
"ms": "Minta kod bilik daripada hos."
},
"Join": {
"yo": "Darapọ̀",
"ig": "Sonye",
"bn": "যোগ দিন",
"ms": "Sertai"
},
"Room code": {
"yo": "Kóòdù yàrá",
"ig": "Koodu ọnụ ụlọ",
"bn": "রুম কোড",
"ms": "Kod bilik"
},
"Copy code": {
"yo": "Ṣe ẹ̀dà kóòdù",
"ig": "Detuo koodu",
"bn": "কোড কপি করুন",
"ms": "Salin kod"
},
"In the room (": {
"yo": "Nínú yàrá (",
"ig": "N'ime ọnụ ụlọ (",
"bn": "রুমে আছেন (",
"ms": "Dalam bilik ("
},
"Waiting for the host to start…": {
"yo": "Ó ń dúró de agbàlejò láti bẹ̀rẹ̀…",
"ig": "Ọ na-eche onye nnabata ka ọ malite…",
"bn": "হোস্টের শুরু করার অপেক্ষা…",
"ms": "Menunggu hos untuk bermula…"
},
"Leave": {
"yo": "Kúrò",
"ig": "Pụọ",
"bn": "বেরিয়ে যান",
"ms": "Keluar"
},
"Family results": {
"yo": "Àbájáde ẹbí",
"ig": "Nsonaazụ ezinụlọ",
"bn": "পরিবারের ফলাফল",
"ms": "Keputusan keluarga"
},
"Question {n} / {n}": {
"yo": "Ìbéèrè {n} / {n}",
"ig": "Ajụjụ {n} / {n}",
"bn": "প্রশ্ন {n} / {n}",
"ms": "Soalan {n} / {n}"
},
"{n}s": {
"yo": "{n}ìṣ",
"ig": "{n}s",
"bn": "{n}সে",
"ms": "{n}s"
},
"Locked in. Waiting for the others… ({n}/{n})": {
"yo": "A ti tì í. Ó ń dúró de àwọn yòókù… ({n}/{n})",
"ig": "Ekpochiri. Ọ na-eche ndị ọzọ… ({n}/{n})",
"bn": "নিশ্চিত হয়েছে। অন্যদের অপেক্ষা… ({n}/{n})",
"ms": "Dikunci. Menunggu yang lain… ({n}/{n})"
},
"Reveal now": {
"yo": "Ṣí i payá báyìí",
"ig": "Gosi ugbu a",
"bn": "এখনই দেখান",
"ms": "Dedahkan sekarang"
},
"Got it right:": {
"yo": "Àwọn tó gbà á tọ̀nà:",
"ig": "Ndị zara nke ọma:",
"bn": "সঠিক উত্তর দিয়েছে:",
"ms": "Jawab dengan betul:"
},
"nobody this time": {
"yo": "kò sí ẹnìkan lọ́tẹ̀ yìí",
"ig": "ọ dịghị onye oge a",
"bn": "এবার কেউ না",
"ms": "tiada sesiapa kali ini"
},
"The host will start the next question.": {
"yo": "Agbàlejò yóò bẹ̀rẹ̀ ìbéèrè tó kàn.",
"ig": "Onye nnabata ga-amalite ajụjụ na-esote.",
"bn": "হোস্ট পরবর্তী প্রশ্ন শুরু করবেন।",
"ms": "Hos akan memulakan soalan seterusnya."
},
"Log in first.": {
"yo": "Wọlé ná.",
"ig": "Banye mbụ.",
"bn": "আগে লগ ইন করুন।",
"ms": "Log masuk dahulu."
},
"Enter the room code.": {
"yo": "Tẹ kóòdù yàrá.",
"ig": "Tinye koodu ọnụ ụlọ.",
"bn": "রুম কোড লিখুন।",
"ms": "Masukkan kod bilik."
},
"No room with that code.": {
"yo": "Kò sí yàrá pẹ̀lú kóòdù yẹn.",
"ig": "Enweghị ọnụ ụlọ nwere koodu ahụ.",
"bn": "এই কোডের কোনো রুম নেই।",
"ms": "Tiada bilik dengan kod itu."
},
"This game has already started.": {
"yo": "Eré yìí ti bẹ̀rẹ̀.",
"ig": "Egwuregwu a amalitelarị.",
"bn": "এই খেলা ইতিমধ্যে শুরু হয়েছে।",
"ms": "Permainan ini sudah bermula."
},
"Couldn't join. Check the code.": {
"yo": "A kò lè darapọ̀. Ṣàyẹ̀wò kóòdù náà.",
"ig": "Enweghị ike isonye. Lelee koodu ahụ.",
"bn": "যোগ দেওয়া যায়নি। কোডটি পরীক্ষা করুন।",
"ms": "Tidak dapat menyertai. Semak kod."
},
"Couldn't create the room. Try again.": {
"yo": "A kò lè ṣẹ̀dá yàrá náà. Gbìyànjú lẹ́ẹ̀kan sí i.",
"ig": "Enweghị ike imepụta ọnụ ụlọ ahụ. Nwaa ọzọ.",
"bn": "রুম তৈরি করা যায়নি। আবার চেষ্টা করুন।",
"ms": "Tidak dapat mencipta bilik. Cuba lagi."
},
"The room has closed.": {
"yo": "Yàrá náà ti tì.",
"ig": "Ọnụ ụlọ ahụ emechiela.",
"bn": "রুমটি বন্ধ হয়ে গেছে।",
"ms": "Bilik telah ditutup."
},
"You’ve hosted today’s free games. Go Premium to host without limits, or join someone else’s room.": {
"yo": "O ti gba eré ọ̀fẹ́ òní lálejò. Lọ sí Premium láti gbàlejò láìsí ààlà, tàbí darapọ̀ mọ́ yàrá ẹlòmíràn.",
"ig": "Ị nabatala egwuregwu n'efu nke taa. Gaa Premium iji nabata n'enweghị oke, ma ọ bụ sonye n'ọnụ ụlọ onye ọzọ.",
"bn": "আপনি আজকের বিনামূল্যের খেলাগুলো হোস্ট করেছেন। সীমাহীন হোস্ট করতে প্রিমিয়াম নিন, অথবা অন্য কারো রুমে যোগ দিন।",
"ms": "Anda telah menjadi hos permainan percuma hari ini. Langgan Premium untuk menjadi hos tanpa had, atau sertai bilik orang lain."
},
"This topic is Premium. Premium hosts can play it with the whole family.": {
"yo": "Kókó-ọ̀rọ̀ yìí jẹ́ Premium. Àwọn agbàlejò Premium lè ṣe é pẹ̀lú gbogbo ẹbí.",
"ig": "Isiokwu a bụ Premium. Ndị nnabata Premium nwere ike ịkpọ ya na ezinụlọ niile.",
"bn": "এই বিষয়টি প্রিমিয়াম। প্রিমিয়াম হোস্টরা পুরো পরিবারের সাথে এটি খেলতে পারেন।",
"ms": "Topik ini Premium. Hos Premium boleh memainkannya bersama seluruh keluarga."
},
"Choose a free topic, or go Premium.": {
"yo": "Yan kókó-ọ̀rọ̀ ọ̀fẹ́, tàbí lọ sí Premium.",
"ig": "Họrọ isiokwu n'efu, ma ọ bụ gaa Premium.",
"bn": "একটি বিনামূল্যের বিষয় বেছে নিন, অথবা প্রিমিয়াম নিন।",
"ms": "Pilih topik percuma, atau langgan Premium."
},
"✨ A new version of IlmStation is ready.": {
"yo": "✨ Ẹ̀yà tuntun IlmStation ti ṣetán.",
"ig": "✨ Ụdị ọhụrụ nke IlmStation adịla njikere.",
"bn": "✨ IlmStation-এর নতুন সংস্করণ প্রস্তুত।",
"ms": "✨ Versi baharu IlmStation sudah sedia."
},
"A new version of IlmStation is ready.": {
"yo": "Ẹ̀yà tuntun IlmStation ti ṣetán.",
"ig": "Ụdị ọhụrụ nke IlmStation adịla njikere.",
"bn": "IlmStation-এর নতুন সংস্করণ প্রস্তুত।",
"ms": "Versi baharu IlmStation sudah sedia."
},
"Growth": {
"yo": "Ìdàgbàsókè",
"ig": "Uto",
"bn": "উন্নতি",
"ms": "Pertumbuhan"
},
"IlmStation / Memorisation": {
"yo": "IlmStation / Híhásórí",
"ig": "IlmStation / Iburu n'isi",
"bn": "IlmStation / হিফজ",
"ms": "IlmStation / Hafazan"
},
"Hifz workspace": {
"yo": "Ibi iṣẹ́ Hifz",
"ig": "Ebe ọrụ Hifz",
"bn": "হিফজ কর্মক্ষেত্র",
"ms": "Ruang kerja Hifz"
},
"Browser not supported": {
"yo": "Ẹ̀rọ aṣàwákiri kò ṣe é lò",
"ig": "Anaghị akwado ihe nchọgharị a",
"bn": "ব্রাউজার সমর্থিত নয়",
"ms": "Pelayar tidak disokong"
},
"Please open IlmStation in Chrome or Edge": {
"yo": "Jọ̀wọ́ ṣí IlmStation ní Chrome tàbí Edge",
"ig": "Biko mepee IlmStation na Chrome ma ọ bụ Edge",
"bn": "অনুগ্রহ করে Chrome বা Edge-এ IlmStation খুলুন",
"ms": "Sila buka IlmStation dalam Chrome atau Edge"
},
"Hifz listens to your recitation and checks it word by word, and that only works in Chrome or Edge on a laptop or an Android phone. iPhones and iPads are not supported yet.": {
"yo": "Hifz ń gbọ́ kíkà rẹ ó sì ń ṣàyẹ̀wò rẹ̀ ní ọ̀rọ̀-ọ̀rọ̀, èyí sì ń ṣiṣẹ́ ní Chrome tàbí Edge lórí kọ̀ǹpútà alágbèérìn tàbí fóònù Android nìkan. iPhone àti iPad kò tíì ṣe é lò.",
"ig": "Hifz na-ege ntị n'ọgụgụ gị ma na-elele ya okwu site n'okwu, nke a na-arụkwa ọrụ naanị na Chrome ma ọ bụ Edge na laptọọpụ ma ọ bụ ekwentị Android. A naghị akwado iPhone na iPad ma.",
"bn": "হিফজ আপনার তিলাওয়াত শুনে শব্দে শব্দে যাচাই করে, এবং এটি শুধু ল্যাপটপ বা Android ফোনে Chrome বা Edge-এ কাজ করে। iPhone ও iPad এখনো সমর্থিত নয়।",
"ms": "Hifz mendengar bacaan anda dan menyemaknya perkataan demi perkataan, dan ini hanya berfungsi dalam Chrome atau Edge pada komputer riba atau telefon Android. iPhone dan iPad belum disokong."
},
"Memorised": {
"yo": "Tí a ti há sórí",
"ig": "E buru n'isi",
"bn": "মুখস্থ হয়েছে",
"ms": "Dihafal"
},
"Today's goal": {
"yo": "Àfojúsùn òní",
"ig": "Ebumnuche taa",
"bn": "আজকের লক্ষ্য",
"ms": "Sasaran hari ini"
},
"Next session": {
"yo": "Ìpàdé tó kàn",
"ig": "Nnọkọ na-esote",
"bn": "পরবর্তী সেশন",
"ms": "Sesi seterusnya"
},
"Tomorrow at": {
"yo": "Ọ̀la ní",
"ig": "Echi n'elekere",
"bn": "আগামীকাল",
"ms": "Esok pada"
},
"Set your plan": {
"yo": "Ṣètò ètò rẹ",
"ig": "Tọọ atụmatụ gị",
"bn": "আপনার পরিকল্পনা ঠিক করুন",
"ms": "Tetapkan pelan anda"
},
"Start a streak today": {
"yo": "Bẹ̀rẹ̀ ọjọ́ tí kò já lónìí",
"ig": "Malite usoro ụbọchị taa",
"bn": "আজই একটি ধারা শুরু করুন",
"ms": "Mulakan rentetan hari ini"
},
"{n}.{n}% of the Qur'an": {
"yo": "{n}.{n}% ti Kùránì",
"ig": "{n}.{n}% nke Kur'an",
"bn": "কুরআনের {n}.{n}%",
"ms": "{n}.{n}% Al-Quran"
},
"Listening…": {
"yo": "Ó ń gbọ́…",
"ig": "Ọ na-ege ntị…",
"bn": "শুনছে…",
"ms": "Mendengar…"
},
"Listening...": {
"yo": "Ó ń gbọ́...",
"ig": "Ọ na-ege ntị...",
"bn": "শুনছে...",
"ms": "Mendengar..."
},
"Recite aloud": {
"yo": "Kà á sókè",
"ig": "Gụọ ya n'olu dara ụda",
"bn": "জোরে তিলাওয়াত করুন",
"ms": "Baca dengan kuat"
},
"Recite from memory": {
"yo": "Kà á láti orí",
"ig": "Gụọ ya site n'isi",
"bn": "মুখস্থ থেকে তিলাওয়াত করুন",
"ms": "Baca dari hafalan"
},
"{n} words to fix, in red": {
"yo": "Ọ̀rọ̀ {n} láti ṣàtúnṣe, ní pupa",
"ig": "Okwu {n} ị ga-edozi, na-acha uhie uhie",
"bn": "ঠিক করতে হবে {n}টি শব্দ, লাল রঙে",
"ms": "{n} perkataan perlu dibetulkan, berwarna merah"
},
"Next verse": {
"yo": "Àyá tó kàn",
"ig": "Amaokwu na-esote",
"bn": "পরবর্তী আয়াত",
"ms": "Ayat seterusnya"
},
"Hifz listens to your recitation and checks it word by word. Use Chrome or Edge on a computer or Android phone, or Safari on iPhone with Siri & Dictation turned on (Settings → Siri).": {
"yo": "Hifz ń gbọ́ kíkà rẹ ó sì ń ṣàyẹ̀wò rẹ̀ ní ọ̀rọ̀-ọ̀rọ̀. Lo Chrome tàbí Edge lórí kọ̀ǹpútà tàbí fóònù Android, tàbí Safari lórí iPhone pẹ̀lú Siri & Dictation ní títàn (Settings → Siri).",
"ig": "Hifz na-ege ntị n'ọgụgụ gị ma na-elele ya okwu site n'okwu. Jiri Chrome ma ọ bụ Edge na kọmputa ma ọ bụ ekwentị Android, ma ọ bụ Safari na iPhone ebe Siri & Dictation gbanyere (Settings → Siri).",
"bn": "হিফজ আপনার তিলাওয়াত শুনে শব্দে শব্দে যাচাই করে। কম্পিউটার বা Android ফোনে Chrome বা Edge ব্যবহার করুন, অথবা iPhone-এ Siri ও Dictation চালু রেখে Safari (Settings → Siri)।",
"ms": "Hifz mendengar bacaan anda dan menyemaknya perkataan demi perkataan. Gunakan Chrome atau Edge pada komputer atau telefon Android, atau Safari pada iPhone dengan Siri & Dictation dihidupkan (Settings → Siri)."
},
"Check the red words, then continue.": {
"yo": "Ṣàyẹ̀wò àwọn ọ̀rọ̀ pupa, lẹ́yìn náà tẹ̀síwájú.",
"ig": "Lelee okwu ndị na-acha uhie uhie, mgbe ahụ gaa n'ihu.",
"bn": "লাল শব্দগুলো দেখুন, তারপর চালিয়ে যান।",
"ms": "Semak perkataan merah, kemudian teruskan."
},
"My Hifz portion": {
"yo": "Ìpín Hifz mi",
"ig": "Akụkụ Hifz m",
"bn": "আমার হিফজ অংশ",
"ms": "Bahagian Hifz saya"
},
"Review what you’ve memorised in the app": {
"yo": "Ṣàtúnyẹ̀wò ohun tí o ti há sórí nínú áàpù",
"ig": "Tụgharịa ihe i buru n'isi n'ime ngwa",
"bn": "অ্যাপে যা মুখস্থ করেছেন তা রিভিশন দিন",
"ms": "Ulang kaji apa yang telah dihafal dalam aplikasi"
},
"Any part of the Qur’an": {
"yo": "Apá èyíkéyìí nínú Kùránì",
"ig": "Akụkụ ọ bụla nke Kur'an",
"bn": "কুরআনের যেকোনো অংশ",
"ms": "Mana-mana bahagian Al-Quran"
},
"Choose a surah and verses to revise from memory": {
"yo": "Yan sùúrà àti àyá láti ṣàtúnyẹ̀wò láti orí",
"ig": "Họrọ surah na amaokwu ị ga-atụgharị site n'isi",
"bn": "মুখস্থ থেকে রিভিশনের জন্য একটি সূরা ও আয়াত বেছে নিন",
"ms": "Pilih surah dan ayat untuk diulang kaji dari hafalan"
},
"Free revision": {
"yo": "Àtúnyẹ̀wò ọ̀fẹ́",
"ig": "Ntụgharị n'efu",
"bn": "মুক্ত রিভিশন",
"ms": "Ulang kaji bebas"
},
"Surah": {
"yo": "Sùúrà",
"ig": "Surah",
"bn": "সূরা",
"ms": "Surah"
},
"From verse": {
"yo": "Láti àyá",
"ig": "Site n'amaokwu",
"bn": "আয়াত থেকে",
"ms": "Dari ayat"
},
"To verse": {
"yo": "Sí àyá",
"ig": "Ruo n'amaokwu",
"bn": "আয়াত পর্যন্ত",
"ms": "Hingga ayat"
},
"Recite this verse from memory…": {
"yo": "Ka àyá yìí láti orí…",
"ig": "Gụọ amaokwu a site n'isi…",
"bn": "এই আয়াতটি মুখস্থ থেকে তিলাওয়াত করুন…",
"ms": "Baca ayat ini dari hafalan…"
},
"Not quite. Say it again.": {
"yo": "Kò tíì pé. Tún un sọ.",
"ig": "Ọ ziebeghị ezi. Kwuo ya ọzọ.",
"bn": "পুরোপুরি হয়নি। আবার বলুন।",
"ms": "Belum tepat. Sebut lagi."
},
"Listen again": {
"yo": "Tún gbọ́",
"ig": "Gee ntị ọzọ",
"bn": "আবার শুনুন",
"ms": "Dengar lagi"
},
"Again": {
"yo": "Lẹ́ẹ̀kan sí i",
"ig": "Ọzọ",
"bn": "আবার",
"ms": "Lagi"
},
"Choose another part": {
"yo": "Yan apá mìíràn",
"ig": "Họrọ akụkụ ọzọ",
"bn": "অন্য অংশ বেছে নিন",
"ms": "Pilih bahagian lain"
},
"Show page": {
"yo": "Fi ojú-ìwé hàn",
"ig": "Gosi peeji",
"bn": "পৃষ্ঠা দেখান",
"ms": "Tunjuk halaman"
},
"Hide page": {
"yo": "Fi ojú-ìwé pamọ́",
"ig": "Zoo peeji",
"bn": "পৃষ্ঠা লুকান",
"ms": "Sembunyi halaman"
},
"🎙️ Recite": {
"yo": "🎙️ Kà á",
"ig": "🎙️ Gụọ",
"bn": "🎙️ তিলাওয়াত",
"ms": "🎙️ Baca"
},
"🔒 Recite": {
"yo": "🔒 Kà á",
"ig": "🔒 Gụọ",
"bn": "🔒 তিলাওয়াত",
"ms": "🔒 Baca"
},
"■ Stop": {
"yo": "■ Dúró",
"ig": "■ Kwụsị",
"bn": "■ থামুন",
"ms": "■ Berhenti"
},
"Voice correction is Premium. Go Premium to revise by reciting.": {
"yo": "Àtúnṣe ohùn jẹ́ Premium. Lọ sí Premium láti ṣàtúnyẹ̀wò nípa kíkà.",
"ig": "Ndozi olu bụ Premium. Gaa Premium iji tụgharịa site n'ịgụ.",
"bn": "কণ্ঠ সংশোধন প্রিমিয়াম। তিলাওয়াত করে রিভিশন দিতে প্রিমিয়াম নিন।",
"ms": "Pembetulan suara ialah Premium. Langgan Premium untuk mengulang kaji dengan membaca."
},
"Check the red words, then recite the verse again.": {
"yo": "Ṣàyẹ̀wò àwọn ọ̀rọ̀ pupa, lẹ́yìn náà tún àyá náà kà.",
"ig": "Lelee okwu ndị na-acha uhie uhie, mgbe ahụ gụọ amaokwu ahụ ọzọ.",
"bn": "লাল শব্দগুলো দেখুন, তারপর আয়াতটি আবার তিলাওয়াত করুন।",
"ms": "Semak perkataan merah, kemudian baca ayat itu sekali lagi."
},
"Page complete. Masha’Allah!": {
"yo": "Ojú-ìwé ti parí. Masha'Allah!",
"ig": "Peeji agwụla. Masha'Allah!",
"bn": "পৃষ্ঠা সম্পূর্ণ। মাশাআল্লাহ!",
"ms": "Halaman selesai. Masya-Allah!"
},
"Listening · verse {n}": {
"yo": "Ó ń gbọ́ · àyá {n}",
"ig": "Ọ na-ege ntị · amaokwu {n}",
"bn": "শুনছে · আয়াত {n}",
"ms": "Mendengar · ayat {n}"
},
"Add this page to your memorised verses? It joins My Hifz portion and gets revision reminders.": {
"yo": "Ṣé o fẹ́ fi ojú-ìwé yìí kún àwọn àyá tí o ti há sórí? Yóò darapọ̀ mọ́ Ìpín Hifz mi, yóò sì máa gba ìrántí àtúnyẹ̀wò.",
"ig": "Tinye peeji a n'amaokwu i buru n'isi? Ọ ga-esonye n'Akụkụ Hifz m ma na-enweta ncheta ntụgharị.",
"bn": "এই পৃষ্ঠাটি আপনার মুখস্থ আয়াতে যোগ করবেন? এটি আমার হিফজ অংশে যুক্ত হবে এবং রিভিশনের রিমাইন্ডার পাবে।",
"ms": "Tambah halaman ini ke ayat hafalan anda? Ia akan masuk ke Bahagian Hifz saya dan mendapat peringatan ulang kaji."
},
"✅ Add to my memorised": {
"yo": "✅ Fi kún àwọn tí mo ti há sórí",
"ig": "✅ Tinye n'ihe m buru n'isi",
"bn": "✅ আমার মুখস্থে যোগ করুন",
"ms": "✅ Tambah ke hafalan saya"
},
"Added to your memorised verses": {
"yo": "A ti fi kún àwọn àyá tí o ti há sórí",
"ig": "Etinyela n'amaokwu i buru n'isi",
"bn": "আপনার মুখস্থ আয়াতে যোগ হয়েছে",
"ms": "Ditambah ke ayat hafalan anda"
},
"Next page": {
"yo": "Ojú-ìwé tó kàn",
"ig": "Peeji na-esote",
"bn": "পরবর্তী পৃষ্ঠা",
"ms": "Halaman seterusnya"
},
"🔊 Hear this verse": {
"yo": "🔊 Gbọ́ àyá yìí",
"ig": "🔊 Nụ amaokwu a",
"bn": "🔊 এই আয়াতটি শুনুন",
"ms": "🔊 Dengar ayat ini"
},
"Couldn't play the recitation.": {
"yo": "A kò lè ṣe kíkà náà.",
"ig": "Enweghị ike ịkpọ ọgụgụ ahụ.",
"bn": "তিলাওয়াত চালানো যায়নি।",
"ms": "Tidak dapat memainkan bacaan."
},
"Preparatory": {
"yo": "Ìpalẹ̀mọ́",
"ig": "Nkwadebe",
"bn": "প্রস্তুতিমূলক",
"ms": "Persediaan"
},
"Beginner {n}": {
"yo": "Beginner {n}",
"ig": "Beginner {n}",
"bn": "বিগিনার {n}",
"ms": "Permulaan {n}"
},
"Qira'ah": {
"yo": "Qira'ah",
"ig": "Qira'ah",
"bn": "কিরাআত",
"ms": "Qira'ah"
},
"Start ▶": {
"yo": "Bẹ̀rẹ̀ ▶",
"ig": "Malite ▶",
"bn": "শুরু ▶",
"ms": "Mula ▶"
},
"Continue ▶": {
"yo": "Tẹ̀síwájú ▶",
"ig": "Gaa n'ihu ▶",
"bn": "চালিয়ে যান ▶",
"ms": "Seterusnya ▶"
},
"Review": {
"yo": "Àtúnyẹ̀wò",
"ig": "Ntụgharị",
"bn": "পুনরালোচনা",
"ms": "Ulang Kaji"
},
"Aisha & Khadija": {
"yo": "Aisha àti Khadija",
"ig": "Aisha na Khadija",
"bn": "আয়েশা ও খাদিজা",
"ms": "Aisyah dan Khadijah"
},
"All {n} letters": {
"yo": "Gbogbo lẹ́tà {n}",
"ig": "Mkpụrụedemede {n} niile",
"bn": "সব {n}টি হরফ",
"ms": "Semua {n} huruf"
},
"Allah's Blessings": {
"yo": "Àwọn Ìbùkún Allah",
"ig": "Ngọzi Allah",
"bn": "আল্লাহর নেয়ামত",
"ms": "Nikmat-nikmat Allah"
},
"Allah's Greatness": {
"yo": "Títóbi Allah",
"ig": "Ịdị Ukwuu Allah",
"bn": "আল্লাহর মহত্ত্ব",
"ms": "Keagungan Allah"
},
"Alphabet Review": {
"yo": "Àtúnyẹ̀wò Álífábẹ́ẹ̀tì",
"ig": "Ntụgharị Mkpụrụedemede",
"bn": "বর্ণমালার পুনরালোচনা",
"ms": "Ulang Kaji Huruf Hijaiyah"
},
"Alphabet review": {
"yo": "Àtúnyẹ̀wò álífábẹ́ẹ̀tì",
"ig": "Ntụgharị mkpụrụedemede",
"bn": "বর্ণমালার পুনরালোচনা",
"ms": "Ulang Kaji huruf hijaiyah"
},
"Big Final Check": {
"yo": "Ìdánwò Ìkẹyìn Ńlá",
"ig": "Ule Ikpeazụ Dị Ukwuu",
"bn": "বড় চূড়ান্ত পরীক্ষা",
"ms": "Ujian Akhir Besar"
},
"Big Review {n}": {
"yo": "Àtúnyẹ̀wò Ńlá {n}",
"ig": "Ntụgharị Dị Ukwuu {n}",
"bn": "বড় পুনরালোচনা {n}",
"ms": "Ulang Kaji Besar {n}"
},
"Damma": {
"yo": "Damma",
"ig": "Damma",
"bn": "পেশ",
"ms": "Dhammah"
},
"Damma Words": {
"yo": "Ọ̀rọ̀ Damma",
"ig": "Okwu Damma",
"bn": "পেশের শব্দ",
"ms": "Kata-kata Dhammah"
},
"Damma Words in Two Steps": {
"yo": "Ọ̀rọ̀ Damma ní Ìgbésẹ̀ Méjì",
"ig": "Okwu Damma na Nzọụkwụ Abụọ",
"bn": "দুই ধাপে পেশের শব্দ",
"ms": "Kata-kata Dhammah dalam Dua Langkah"
},
"Fatha": {
"yo": "Fatha",
"ig": "Fatha",
"bn": "যবর",
"ms": "Fathah"
},
"First Words": {
"yo": "Ọ̀rọ̀ Àkọ́kọ́",
"ig": "Okwu Mbụ",
"bn": "প্রথম শব্দ",
"ms": "Kata-kata Pertama"
},
"Hamza in the Middle & at the End": {
"yo": "Hamza ní Àárín àti ní Òpin",
"ig": "Hamza n'Etiti na na Njedebe",
"bn": "মাঝে ও শেষে হামযা",
"ms": "Hamzah di Tengah dan di Akhir"
},
"Hamza in the Middle {n}": {
"yo": "Hamza ní Àárín {n}",
"ig": "Hamza n'Etiti {n}",
"bn": "মাঝে হামযা {n}",
"ms": "Hamzah di Tengah {n}"
},
"Hamzatul Wasl & the Moon Laam": {
"yo": "Hamzatul Wasl àti Laam Òṣùpá",
"ig": "Hamzatul Wasl na Laam Ọnwa",
"bn": "হামযাতুল ওয়াসল ও কামারি লাম",
"ms": "Hamzah Wasal dan Lam Qamariyah"
},
"Harakat Review": {
"yo": "Àtúnyẹ̀wò Harakat",
"ig": "Ntụgharị Harakat",
"bn": "হরকতের পুনরালোচনা",
"ms": "Ulang Kaji Harakat"
},
"Kasra": {
"yo": "Kasra",
"ig": "Kasra",
"bn": "যের",
"ms": "Kasrah"
},
"Kasra Phrases": {
"yo": "Gbólóhùn Kasra",
"ig": "Ahịrịokwu Kasra",
"bn": "যেরের বাক্যাংশ",
"ms": "Ayat Kasrah"
},
"Kasra Words": {
"yo": "Ọ̀rọ̀ Kasra",
"ig": "Okwu Kasra",
"bn": "যেরের শব্দ",
"ms": "Kata-kata Kasrah"
},
"Kasra Words in Two Steps": {
"yo": "Ọ̀rọ̀ Kasra ní Ìgbésẹ̀ Méjì",
"ig": "Okwu Kasra na Nzọụkwụ Abụọ",
"bn": "দুই ধাপে যেরের শব্দ",
"ms": "Kata-kata Kasrah dalam Dua Langkah"
},
"Letter Shapes": {
"yo": "Ìrísí Lẹ́tà",
"ig": "Ọdịdị Mkpụrụedemede",
"bn": "হরফের আকৃতি",
"ms": "Bentuk Huruf"
},
"Letters Read but Not Written": {
"yo": "Lẹ́tà tí a ń kà ṣùgbọ́n a kò kọ",
"ig": "Mkpụrụedemede A Na-agụ mana A Naghị Ede",
"bn": "যে হরফ পড়া হয় কিন্তু লেখা হয় না",
"ms": "Huruf yang Dibaca tapi Tidak Ditulis"
},
"Look-alike Letters": {
"yo": "Lẹ́tà Tó Jọra",
"ig": "Mkpụrụedemede Yiri Onwe Ha",
"bn": "একই রকম হরফ",
"ms": "Huruf yang Serupa"
},
"Madd Practice": {
"yo": "Ìdánrawò Madd",
"ig": "Mmega Madd",
"bn": "মাদ অনুশীলন",
"ms": "Latihan Mad"
},
"Madd Review {n}": {
"yo": "Àtúnyẹ̀wò Madd {n}",
"ig": "Ntụgharị Madd {n}",
"bn": "মাদের পুনরালোচনা {n}",
"ms": "Ulang Kaji Mad {n}"
},
"Madd with Alif": {
"yo": "Madd pẹ̀lú Alif",
"ig": "Madd na Alif",
"bn": "আলিফের মাদ",
"ms": "Mad dengan Alif"
},
"Madd with Waw": {
"yo": "Madd pẹ̀lú Waw",
"ig": "Madd na Waw",
"bn": "ওয়াও-এর মাদ",
"ms": "Mad dengan Wau"
},
"Madd with Yaa": {
"yo": "Madd pẹ̀lú Yaa",
"ig": "Madd na Yaa",
"bn": "ইয়া-এর মাদ",
"ms": "Mad dengan Ya"
},
"Meem Sakinah & Ghunnah": {
"yo": "Meem Sakinah àti Ghunnah",
"ig": "Meem Sakinah na Ghunnah",
"bn": "মীম সাকিন ও গুন্নাহ",
"ms": "Mim Sukun dan Ghunnah"
},
"Meet the letters": {
"yo": "Pàdé àwọn lẹ́tà",
"ig": "Zute mkpụrụedemede",
"bn": "হরফগুলোর সাথে পরিচিত হও",
"ms": "Kenali huruf-hurufnya"
},
"More Tajweed Rules": {
"yo": "Àwọn Òfin Tajweed Mìíràn",
"ig": "Iwu Tajweed Ndị Ọzọ",
"bn": "তাজবীদের আরও নিয়ম",
"ms": "Hukum Tajwid Lainnya"
},
"More Words": {
"yo": "Ọ̀rọ̀ Mìíràn",
"ig": "Okwu Ndị Ọzọ",
"bn": "আরও শব্দ",
"ms": "Kata-kata Lagi"
},
"More letters": {
"yo": "Lẹ́tà mìíràn",
"ig": "Mkpụrụedemede ndị ọzọ",
"bn": "আরও হরফ",
"ms": "Huruf lainnya"
},
"Noon Sakinah & Tanween {n}": {
"yo": "Noon Sakinah àti Tanween {n}",
"ig": "Noon Sakinah na Tanween {n}",
"bn": "নূন সাকিন ও তানবীন {n}",
"ms": "Nun Sukun dan Tanwin {n}"
},
"Noon Sakinah Practice": {
"yo": "Ìdánrawò Noon Sakinah",
"ig": "Mmega Noon Sakinah",
"bn": "নূন সাকিনের অনুশীলন",
"ms": "Latihan Nun Sukun"
},
"Preparatory Final Exam": {
"yo": "Ìdánwò Ìkẹyìn Ìpalẹ̀mọ́",
"ig": "Ule Ikpeazụ Nkwadebe",
"bn": "প্রস্তুতিমূলক স্তরের চূড়ান্ত পরীক্ষা",
"ms": "Ujian Akhir Tahap Persediaan"
},
"Qur'anic and everyday spelling": {
"yo": "Akọ̀tọ́ Kùránì àti ti ojoojúmọ́",
"ig": "Ederede Kur'an na nke kwa ụbọchị",
"bn": "কুরআনি ও সাধারণ বানান",
"ms": "Tulisan Al-Quran dan imla'i"
},
"Qur'anic phrases": {
"yo": "Gbólóhùn Kùránì",
"ig": "Ahịrịokwu Kur'an",
"bn": "কুরআনের বাক্যাংশ",
"ms": "Ayat Al-Quran"
},
"Qur'anic verses": {
"yo": "Àyá Kùránì",
"ig": "Amaokwu Kur'an",
"bn": "কুরআনের আয়াত",
"ms": "Ayat-ayat Al-Quran"
},
"Qur'anic vs Everyday Spelling": {
"yo": "Akọ̀tọ́ Kùránì àti Akọ̀tọ́ Ojoojúmọ́",
"ig": "Ederede Kur'an na Ederede Kwa Ụbọchị",
"bn": "কুরআনি বানান ও সাধারণ বানান",
"ms": "Tulisan Al-Quran dan Tulisan Biasa"
},
"Qur'anic words": {
"yo": "Ọ̀rọ̀ Kùránì",
"ig": "Okwu Kur'an",
"bn": "কুরআনের শব্দ",
"ms": "Kata-kata Al-Quran"
},
"Review Practice {n}": {
"yo": "Ìdánrawò Àtúnyẹ̀wò {n}",
"ig": "Mmega Ntụgharị {n}",
"bn": "পুনরালোচনা অনুশীলন {n}",
"ms": "Latihan Ulang Kaji {n}"
},
"Sami & Yusuf": {
"yo": "Sami àti Yusuf",
"ig": "Sami na Yusuf",
"bn": "সামি ও ইউসুফ",
"ms": "Sami dan Yusuf"
},
"Shadda Phrases {n}": {
"yo": "Gbólóhùn Shadda {n}",
"ig": "Ahịrịokwu Shadda {n}",
"bn": "তাশদীদের বাক্যাংশ {n}",
"ms": "Ayat Syaddah {n}"
},
"Shadda Review": {
"yo": "Àtúnyẹ̀wò Shadda",
"ig": "Ntụgharị Shadda",
"bn": "তাশদীদের পুনরালোচনা",
"ms": "Ulang Kaji Syaddah"
},
"Shadda with Damma": {
"yo": "Shadda pẹ̀lú Damma",
"ig": "Shadda na Damma",
"bn": "পেশসহ তাশদীদ",
"ms": "Syaddah dengan Dhammah"
},
"Shadda with Fatha": {
"yo": "Shadda pẹ̀lú Fatha",
"ig": "Shadda na Fatha",
"bn": "যবরসহ তাশদীদ",
"ms": "Syaddah dengan Fathah"
},
"Shadda with Kasra": {
"yo": "Shadda pẹ̀lú Kasra",
"ig": "Shadda na Kasra",
"bn": "যেরসহ তাশদীদ",
"ms": "Syaddah dengan Kasrah"
},
"Shadda with Tanween": {
"yo": "Shadda pẹ̀lú Tanween",
"ig": "Shadda na Tanween",
"bn": "তানবীনসহ তাশদীদ",
"ms": "Syaddah dengan Tanwin"
},
"Short Phrases": {
"yo": "Gbólóhùn Kúkúrú",
"ig": "Ahịrịokwu Dị Mkpụmkpụ",
"bn": "ছোট বাক্যাংশ",
"ms": "Ayat Pendek"
},
"Similar Letters Meeting": {
"yo": "Ìpàdé Lẹ́tà Tó Jọra",
"ig": "Nzukọ Mkpụrụedemede Yiri Onwe Ha",
"bn": "একই রকম হরফের মিলন",
"ms": "Pertemuan Huruf yang Serupa"
},
"Sukun": {
"yo": "Sukun",
"ig": "Sukun",
"bn": "সুকুন",
"ms": "Sukun"
},
"Sukun Phrases {n}": {
"yo": "Gbólóhùn Sukun {n}",
"ig": "Ahịrịokwu Sukun {n}",
"bn": "সুকুনের বাক্যাংশ {n}",
"ms": "Ayat Sukun {n}"
},
"Tajweed Review": {
"yo": "Àtúnyẹ̀wò Tajweed",
"ig": "Ntụgharị Tajweed",
"bn": "তাজবীদের পুনরালোচনা",
"ms": "Ulang Kaji Tajwid"
},
"Tanween Damm": {
"yo": "Tanween Damm",
"ig": "Tanween Damm",
"bn": "দুই পেশের তানবীন",
"ms": "Tanwin Dhammah"
},
"Tanween Fath": {
"yo": "Tanween Fath",
"ig": "Tanween Fath",
"bn": "দুই যবরের তানবীন",
"ms": "Tanwin Fathah"
},
"Tanween Kasr": {
"yo": "Tanween Kasr",
"ig": "Tanween Kasr",
"bn": "দুই যেরের তানবীন",
"ms": "Tanwin Kasrah"
},
"The Adhan": {
"yo": "Àdhàn",
"ig": "Adhan",
"bn": "আজান",
"ms": "Azan"
},
"The Alphabet": {
"yo": "Álífábẹ́ẹ̀tì",
"ig": "Mkpụrụedemede",
"bn": "বর্ণমালা",
"ms": "Huruf Hijaiyah"
},
"The Creation of Man": {
"yo": "Ìṣẹ̀dá Ènìyàn",
"ig": "Okike Mmadụ",
"bn": "মানুষের সৃষ্টি",
"ms": "Penciptaan Manusia"
},
"The Day of Eid": {
"yo": "Ọjọ́ Ọdún",
"ig": "Ụbọchị Eid",
"bn": "ঈদের দিন",
"ms": "Hari Raya"
},
"The Farmer": {
"yo": "Àgbẹ̀",
"ig": "Onye Ọrụ Ugbo",
"bn": "কৃষক",
"ms": "Petani"
},
"The Muslim": {
"yo": "Mùsùlùmí",
"ig": "Onye Alakụba",
"bn": "মুসলিম",
"ms": "Muslim"
},
"The Qur'an": {
"yo": "Kùránì",
"ig": "Kur'an",
"bn": "কুরআন",
"ms": "Al-Quran"
},
"The Small Alif": {
"yo": "Alif Kékeré",
"ig": "Obere Alif",
"bn": "ছোট আলিফ",
"ms": "Alif Kecil"
},
"The Small Waw": {
"yo": "Waw Kékeré",
"ig": "Obere Waw",
"bn": "ছোট ওয়াও",
"ms": "Wau Kecil"
},
"The Small Yaa": {
"yo": "Yaa Kékeré",
"ig": "Obere Yaa",
"bn": "ছোট ইয়া",
"ms": "Ya Kecil"
},
"The Sparrow": {
"yo": "Ẹyẹ Ológoṣẹ́",
"ig": "Nnụnụ Nta",
"bn": "চড়ুই পাখি",
"ms": "Burung Pipit"
},
"The Stars": {
"yo": "Àwọn Ìràwọ̀",
"ig": "Kpakpando",
"bn": "তারকারাজি",
"ms": "Bintang-bintang"
},
"The Sun Laam": {
"yo": "Laam Oòrùn",
"ig": "Laam Anyanwụ",
"bn": "শামসি লাম",
"ms": "Lam Syamsiyah"
},
"The last letters": {
"yo": "Àwọn lẹ́tà ìkẹyìn",
"ig": "Mkpụrụedemede ikpeazụ",
"bn": "শেষ হরফগুলো",
"ms": "Huruf-huruf terakhir"
},
"Two Passages": {
"yo": "Àyọkà Méjì",
"ig": "Ederede Abụọ",
"bn": "দুটি অনুচ্ছেদ",
"ms": "Dua Bacaan"
},
"Two Short Stories": {
"yo": "Ìtàn Kúkúrú Méjì",
"ig": "Akụkọ Mkpụmkpụ Abụọ",
"bn": "দুটি ছোট গল্প",
"ms": "Dua Cerita Pendek"
},
"Types of Madd {n}": {
"yo": "Oríṣi Madd {n}",
"ig": "Ụdị Madd {n}",
"bn": "মাদের প্রকার {n}",
"ms": "Jenis-jenis Mad {n}"
},
"Umar and Karam": {
"yo": "Umar àti Karam",
"ig": "Umar na Karam",
"bn": "উমর ও কারাম",
"ms": "Umar dan Karam"
},
"Whole Words": {
"yo": "Ọ̀rọ̀ Pípé",
"ig": "Okwu Zuru Ezu",
"bn": "পূর্ণ শব্দ",
"ms": "Kata Utuh"
},
"Words in Two Steps": {
"yo": "Ọ̀rọ̀ ní Ìgbésẹ̀ Méjì",
"ig": "Okwu na Nzọụkwụ Abụọ",
"bn": "দুই ধাপে শব্দ",
"ms": "Kata dalam Dua Langkah"
},
"and Qur'anic words": {
"yo": "àti ọ̀rọ̀ Kùránì",
"ig": "na okwu Kur'an",
"bn": "এবং কুরআনের শব্দ",
"ms": "dan kata-kata Al-Quran"
},
"damma": {
"yo": "damma",
"ig": "damma",
"bn": "পেশ",
"ms": "dhammah"
},
"end": {
"yo": "òpin",
"ig": "njedebe",
"bn": "শেষ",
"ms": "akhir"
},
"fatha": {
"yo": "fatha",
"ig": "fatha",
"bn": "যবর",
"ms": "fathah"
},
"from the Mushaf": {
"yo": "láti inú Mus'hafi",
"ig": "si na Mushaf",
"bn": "মুসহাফ থেকে",
"ms": "dari mushaf"
},
"kasra": {
"yo": "kasra",
"ig": "kasra",
"bn": "যের",
"ms": "kasrah"
},
"letter by letter, then joined": {
"yo": "lẹ́tà-lẹ́tà, lẹ́yìn náà papọ̀",
"ig": "mkpụrụedemede site na mkpụrụedemede, mgbe ahụ jikọtara",
"bn": "হরফে হরফে, তারপর মিলিয়ে",
"ms": "huruf demi huruf, kemudian digabung"
},
"madd": {
"yo": "madd",
"ig": "madd",
"bn": "মাদ",
"ms": "mad"
},
"middle": {
"yo": "àárín",
"ig": "etiti",
"bn": "মাঝ",
"ms": "tengah"
},
"more Qur'anic phrases": {
"yo": "gbólóhùn Kùránì sí i",
"ig": "ahịrịokwu Kur'an ndị ọzọ",
"bn": "আরও কুরআনের বাক্যাংশ",
"ms": "ayat Al-Quran lainnya"
},
"review & shadda": {
"yo": "àtúnyẹ̀wò àti shadda",
"ig": "ntụgharị na shadda",
"bn": "পুনরালোচনা ও তাশদীদ",
"ms": "ulang kaji dan syaddah"
},
"shadda": {
"yo": "shadda",
"ig": "shadda",
"bn": "তাশদীদ",
"ms": "syaddah"
},
"start": {
"yo": "ìbẹ̀rẹ̀",
"ig": "mmalite",
"bn": "শুরু",
"ms": "awal"
},
"sukun": {
"yo": "sukun",
"ig": "sukun",
"bn": "সুকুন",
"ms": "sukun"
},
"sukun & tanween": {
"yo": "sukun àti tanween",
"ig": "sukun na tanween",
"bn": "সুকুন ও তানবীন",
"ms": "sukun dan tanwin"
},
"tajweed & spelling": {
"yo": "tajweed àti akọ̀tọ́",
"ig": "tajweed na ederede",
"bn": "তাজবীদ ও বানান",
"ms": "tajwid dan tulisan"
},
"the whole book!": {
"yo": "gbogbo ìwé náà!",
"ig": "akwụkwọ niile!",
"bn": "পুরো বই!",
"ms": "seluruh buku!"
},
"two letters, then the third": {
"yo": "lẹ́tà méjì, lẹ́yìn náà ẹ̀kẹta",
"ig": "mkpụrụedemede abụọ, mgbe ahụ nke atọ",
"bn": "দুটি হরফ, তারপর তৃতীয়টি",
"ms": "dua huruf, kemudian yang ketiga"
},
"ـًا  = an": {
"yo": "ـًا  = an",
"ig": "ـًا  = an",
"bn": "ـًا  = আন",
"ms": "ـًا  = an"
},
"ـٌ  = un": {
"yo": "ـٌ  = un",
"ig": "ـٌ  = un",
"bn": "ـٌ  = উন",
"ms": "ـٌ  = un"
},
"ـٍ  = in": {
"yo": "ـٍ  = in",
"ig": "ـٍ  = in",
"bn": "ـٍ  = ইন",
"ms": "ـٍ  = in"
},
"ـُۥ in the Mushaf": {
"yo": "ـُۥ nínú Mus'hafi",
"ig": "ـُۥ na Mushaf",
"bn": "মুসহাফে ـُۥ",
"ms": "ـُۥ dalam mushaf"
},
"ـِۦ in the Mushaf": {
"yo": "ـِۦ nínú Mus'hafi",
"ig": "ـِۦ na Mushaf",
"bn": "মুসহাফে ـِۦ",
"ms": "ـِۦ dalam mushaf"
},
"ـٰ in the Mushaf": {
"yo": "ـٰ nínú Mus'hafi",
"ig": "ـٰ na Mushaf",
"bn": "মুসহাফে ـٰ",
"ms": "ـٰ dalam mushaf"
},
"Preparatory {n}": {
"yo": "Ìpalẹ̀mọ́ {n}",
"ig": "Nkwadebe {n}",
"bn": "প্রস্তুতিমূলক {n}",
"ms": "Persediaan {n}"
},
"Beginner": {
"yo": "Beginner",
"ig": "Beginner",
"bn": "বিগিনার",
"ms": "Permulaan"
},
"Intermediate": {
"yo": "Àárín",
"ig": "Etiti",
"bn": "মধ্যবর্তী",
"ms": "Pertengahan"
},
"Intermediate {n}": {
"yo": "Àárín {n}",
"ig": "Etiti {n}",
"bn": "মধ্যবর্তী {n}",
"ms": "Pertengahan {n}"
},
"Advanced": {
"yo": "Ìlọsíwájú",
"ig": "Elu",
"bn": "উচ্চতর",
"ms": "Lanjutan"
},
"Advanced {n}": {
"yo": "Ìlọsíwájú {n}",
"ig": "Elu {n}",
"bn": "উচ্চতর {n}",
"ms": "Lanjutan {n}"
},
"Alif Madd": {
"yo": "Madd Alif",
"ig": "Madd Alif",
"bn": "আলিফের মাদ",
"ms": "Mad Alif"
},
"Beginner {n} Final Exam": {
"yo": "Ìdánwò Ìkẹyìn Beginner {n}",
"ig": "Ule Ikpeazụ Beginner {n}",
"bn": "বিগিনার {n}-এর চূড়ান্ত পরীক্ষা",
"ms": "Ujian Akhir Permulaan {n}"
},
"Certificate earned": {
"yo": "O ti gba ìwé-ẹ̀rí",
"ig": "I nwetala asambodo",
"bn": "সনদ অর্জিত",
"ms": "Sijil diperoleh"
},
"Completed": {
"yo": "Ó ti parí",
"ig": "Emechaala",
"bn": "সম্পন্ন",
"ms": "Selesai"
},
"Completed ✓": {
"yo": "Ó ti parí ✓",
"ig": "Emechaala ✓",
"bn": "সম্পন্ন ✓",
"ms": "Selesai ✓"
},
"Creativity": {
"yo": "Àtinúdá",
"ig": "Ihe okike",
"bn": "সৃজনশীলতা",
"ms": "Kreativiti"
},
"Development": {
"yo": "Ìdàgbàsókè",
"ig": "Mmepe",
"bn": "উন্নয়ন",
"ms": "Pembangunan"
},
"Each subject moves up on its own: finish a subject's level, and its next level opens. Every completed level earns a certificate.": {
"yo": "Ẹ̀kọ́ kọ̀ọ̀kan ń gòkè fúnra rẹ̀: parí ìpele ẹ̀kọ́ kan, ìpele rẹ̀ tó kàn yóò sì ṣí. Ìpele kọ̀ọ̀kan tí o bá parí ń fún ọ ní ìwé-ẹ̀rí.",
"ig": "Isiokwu ọ bụla na-arịgo n'onwe ya: mechaa ọkwa isiokwu, ọkwa ya na-esote ga-emeghe. Ọkwa ọ bụla emechara na-enye asambodo.",
"bn": "প্রতিটি বিষয় নিজে নিজে এগোয়: একটি বিষয়ের স্তর শেষ করলে তার পরের স্তর খুলে যায়। প্রতিটি সম্পন্ন স্তরে একটি সনদ মেলে।",
"ms": "Setiap subjek naik sendiri: selesaikan tahap subjek itu, dan tahap seterusnya dibuka. Setiap tahap yang selesai mendapat sijil."
},
"Everyday Spelling": {
"yo": "Akọ̀tọ́ Ojoojúmọ́",
"ig": "Ederede Kwa Ụbọchị",
"bn": "সাধারণ বানান",
"ms": "Tulisan Biasa"
},
"everyday spelling": {
"yo": "akọ̀tọ́ ojoojúmọ́",
"ig": "ederede kwa ụbọchị",
"bn": "সাধারণ বানান",
"ms": "tulisan biasa"
},
"Fast": {
"yo": "Kíákíá",
"ig": "Ngwa ngwa",
"bn": "দ্রুত",
"ms": "Pantas"
},
"Final exam · opens the next level": {
"yo": "Ìdánwò ìkẹyìn · ó ń ṣí ìpele tó kàn",
"ig": "Ule ikpeazụ · ọ na-emeghe ọkwa na-esote",
"bn": "চূড়ান্ত পরীক্ষা · পরের স্তর খোলে",
"ms": "Ujian akhir · membuka tahap seterusnya"
},
"Finish all the lessons to unlock the exam.": {
"yo": "Parí gbogbo ẹ̀kọ́ láti ṣí ìdánwò náà.",
"ig": "Mechaa ihe ọmụmụ niile iji meghee ule ahụ.",
"bn": "পরীক্ষা খুলতে সব পাঠ শেষ করুন।",
"ms": "Selesaikan semua pelajaran untuk membuka ujian."
},
"Islamic education, step by step.": {
"yo": "Ẹ̀kọ́ Ìsìláàmù, ní ìgbésẹ̀-ìgbésẹ̀.",
"ig": "Agụmakwụkwọ Alakụba, nzọụkwụ site na nzọụkwụ.",
"bn": "ইসলামী শিক্ষা, ধাপে ধাপে।",
"ms": "Pendidikan Islam, langkah demi langkah."
},
"Languages": {
"yo": "Àwọn èdè",
"ig": "Asụsụ",
"bn": "ভাষা",
"ms": "Bahasa"
},
"Learn new languages.": {
"yo": "Kọ́ èdè tuntun.",
"ig": "Mụta asụsụ ọhụrụ.",
"bn": "নতুন ভাষা শিখুন।",
"ms": "Belajar bahasa baharu."
},
"Personal, professional and technical growth.": {
"yo": "Ìdàgbàsókè ara ẹni, iṣẹ́ àti ìmọ̀ ẹ̀rọ.",
"ig": "Uto onwe, ọrụ na teknụzụ.",
"bn": "ব্যক্তিগত, পেশাগত ও প্রযুক্তিগত উন্নতি।",
"ms": "Pertumbuhan peribadi, profesional dan teknikal."
},
"Creative skills and practical talents.": {
"yo": "Ọgbọ́n àtinúdá àti ẹ̀bùn iṣẹ́-ọwọ́.",
"ig": "Nka okike na onyinye bara uru.",
"bn": "সৃজনশীল দক্ষতা ও ব্যবহারিক প্রতিভা।",
"ms": "Kemahiran kreatif dan bakat praktikal."
},
"Lesson {n} · {n} min": {
"yo": "Ẹ̀kọ́ {n} · ìṣẹ́jú {n}",
"ig": "Ihe ọmụmụ {n} · nkeji {n}",
"bn": "পাঠ {n} · {n} মিনিট",
"ms": "Pelajaran {n} · {n} minit"
},
"Lessons": {
"yo": "Àwọn ẹ̀kọ́",
"ig": "Ihe ọmụmụ",
"bn": "পাঠসমূহ",
"ms": "Pelajaran"
},
"Lessons are being prepared. Check back soon.": {
"yo": "A ń palẹ̀ àwọn ẹ̀kọ́ mọ́. Padà wá láìpẹ́.",
"ig": "A na-akwado ihe ọmụmụ. Lọghachi n'oge na-adịghị anya.",
"bn": "পাঠ প্রস্তুত হচ্ছে। শীঘ্রই আবার দেখুন।",
"ms": "Pelajaran sedang disediakan. Kembali tidak lama lagi."
},
"Madrasah": {
"yo": "Ilé-kéú",
"ig": "Madrasah",
"bn": "মাদ্রাসা",
"ms": "Madrasah"
},
"Open →": {
"yo": "Ṣí i →",
"ig": "Mepee →",
"bn": "খুলুন →",
"ms": "Buka →"
},
"Open ▶": {
"yo": "Ṣí i ▶",
"ig": "Mepee ▶",
"bn": "খুলুন ▶",
"ms": "Buka ▶"
},
"Opening…": {
"yo": "Ó ń ṣí…",
"ig": "Ọ na-emeghe…",
"bn": "খুলছে…",
"ms": "Membuka…"
},
"Pass the final exam to earn it.": {
"yo": "Yege ìdánwò ìkẹyìn láti gbà á.",
"ig": "Gafee ule ikpeazụ iji nweta ya.",
"bn": "এটি পেতে চূড়ান্ত পরীক্ষায় পাস করুন।",
"ms": "Lulus ujian akhir untuk memperolehnya."
},
"Passed. The next stage is open.": {
"yo": "O yege. Ìpele tó kàn ti ṣí.",
"ig": "Ị gafere. Ọkwa na-esote emeghela.",
"bn": "পাস করেছেন। পরের ধাপ খোলা।",
"ms": "Lulus. Tahap seterusnya dibuka."
},
"Phrases": {
"yo": "Gbólóhùn",
"ig": "Ahịrịokwu",
"bn": "বাক্যাংশ",
"ms": "Frasa"
},
"Plan your pace": {
"yo": "Ṣètò ìyára rẹ",
"ig": "Hazie ọsọ gị",
"bn": "আপনার গতি পরিকল্পনা করুন",
"ms": "Rancang rentak anda"
},
"Promotion exam": {
"yo": "Ìdánwò ìgbéga",
"ig": "Ule nkwalite",
"bn": "উত্তরণ পরীক্ষা",
"ms": "Ujian kenaikan"
},
"Qur'anic Words": {
"yo": "Ọ̀rọ̀ Kùránì",
"ig": "Okwu Kur'an",
"bn": "কুরআনের শব্দ",
"ms": "Kata-kata Al-Quran"
},
"Qur'anic Words {n}": {
"yo": "Ọ̀rọ̀ Kùránì {n}",
"ig": "Okwu Kur'an {n}",
"bn": "কুরআনের শব্দ {n}",
"ms": "Kata-kata Al-Quran {n}"
},
"Relaxed": {
"yo": "Ìdẹ̀rọ̀",
"ig": "Nwayọọ",
"bn": "ধীরস্থির",
"ms": "Santai"
},
"Review →": {
"yo": "Àtúnyẹ̀wò →",
"ig": "Tụgharịa →",
"bn": "পুনরালোচনা →",
"ms": "Ulang kaji →"
},
"Save my plan": {
"yo": "Fi ètò mi pamọ́",
"ig": "Chekwaa atụmatụ m",
"bn": "আমার পরিকল্পনা সংরক্ষণ করুন",
"ms": "Simpan rancangan saya"
},
"Shadda": {
"yo": "Shadda",
"ig": "Shadda",
"bn": "তাশদীদ",
"ms": "Syaddah"
},
"Short and Long": {
"yo": "Kúkúrú àti Gígùn",
"ig": "Mkpụmkpụ na Ogologo",
"bn": "ছোট ও দীর্ঘ",
"ms": "Pendek dan Panjang"
},
"Skip ahead": {
"yo": "Fò síwájú",
"ig": "Wụfee n'ihu",
"bn": "এগিয়ে যান",
"ms": "Langkau ke hadapan"
},
"Start here": {
"yo": "Bẹ̀rẹ̀ níbí",
"ig": "Malite ebe a",
"bn": "এখান থেকে শুরু করুন",
"ms": "Mula di sini"
},
"Start →": {
"yo": "Bẹ̀rẹ̀ →",
"ig": "Malite →",
"bn": "শুরু →",
"ms": "Mula →"
},
"Steady": {
"yo": "Déédéé",
"ig": "Kwụsiri ike",
"bn": "নিয়মিত",
"ms": "Tetap"
},
"Syllabus": {
"yo": "Ètò ẹ̀kọ́",
"ig": "Usoro ọmụmụ",
"bn": "পাঠ্যসূচি",
"ms": "Sukatan pelajaran"
},
"Take the exam": {
"yo": "Ṣe ìdánwò náà",
"ig": "Mee ule ahụ",
"bn": "পরীক্ষা দিন",
"ms": "Ambil ujian"
},
"Test": {
"yo": "Ìdánwò",
"ig": "Nnwale",
"bn": "টেস্ট",
"ms": "Uji"
},
"Test mode ON": {
"yo": "Ipò ìdánwò WÀ NÍ TÍTÀN",
"ig": "Ọnọdụ nnwale GBANYERE",
"bn": "টেস্ট মোড চালু",
"ms": "Mod uji HIDUP"
},
"This lesson is for Premium members.": {
"yo": "Ẹ̀kọ́ yìí wà fún àwọn ọmọ ẹgbẹ́ Premium.",
"ig": "Ihe ọmụmụ a bụ maka ndị otu Premium.",
"bn": "এই পাঠটি প্রিমিয়াম সদস্যদের জন্য।",
"ms": "Pelajaran ini untuk ahli Premium."
},
"Verses & Hadith {n}": {
"yo": "Àyá àti Hadith {n}",
"ig": "Amaokwu na Hadith {n}",
"bn": "আয়াত ও হাদিস {n}",
"ms": "Ayat dan Hadis {n}"
},
"Waw Madd": {
"yo": "Madd Waw",
"ig": "Madd Waw",
"bn": "ওয়াও-এর মাদ",
"ms": "Mad Wau"
},
"What will you learn today?": {
"yo": "Kí ni wàá kọ́ lónìí?",
"ig": "Gịnị ka ị ga-amụta taa?",
"bn": "আজ আপনি কী শিখবেন?",
"ms": "Apa yang akan anda pelajari hari ini?"
},
"Words": {
"yo": "Ọ̀rọ̀",
"ig": "Okwu",
"bn": "শব্দ",
"ms": "Perkataan"
},
"words": {
"yo": "ọ̀rọ̀",
"ig": "okwu",
"bn": "শব্দ",
"ms": "perkataan"
},
"Words & Phrases": {
"yo": "Ọ̀rọ̀ àti Gbólóhùn",
"ig": "Okwu na Ahịrịokwu",
"bn": "শব্দ ও বাক্যাংশ",
"ms": "Perkataan dan Frasa"
},
"Yaa Madd": {
"yo": "Madd Yaa",
"ig": "Madd Yaa",
"bn": "ইয়া-এর মাদ",
"ms": "Mad Ya"
},
"all harakat": {
"yo": "gbogbo harakat",
"ig": "harakat niile",
"bn": "সব হরকত",
"ms": "semua harakat"
},
"all letters with damma": {
"yo": "gbogbo lẹ́tà pẹ̀lú damma",
"ig": "mkpụrụedemede niile na damma",
"bn": "পেশসহ সব হরফ",
"ms": "semua huruf dengan dhammah"
},
"all letters with kasra": {
"yo": "gbogbo lẹ́tà pẹ̀lú kasra",
"ig": "mkpụrụedemede niile na kasra",
"bn": "যেরসহ সব হরফ",
"ms": "semua huruf dengan kasrah"
},
"all madd": {
"yo": "gbogbo madd",
"ig": "madd niile",
"bn": "সব মাদ",
"ms": "semua mad"
},
"all the madd letters": {
"yo": "gbogbo lẹ́tà madd",
"ig": "mkpụrụedemede madd niile",
"bn": "সব মাদের হরফ",
"ms": "semua huruf mad"
},
"all three madd letters": {
"yo": "gbogbo lẹ́tà madd mẹ́ta",
"ig": "mkpụrụedemede madd atọ niile",
"bn": "তিনটি মাদের হরফ",
"ms": "ketiga-tiga huruf mad"
},
"and phrases": {
"yo": "àti gbólóhùn",
"ig": "na ahịrịokwu",
"bn": "এবং বাক্যাংশ",
"ms": "dan frasa"
},
"in shape and in sound": {
"yo": "ní ìrísí àti ní ìró",
"ig": "n'ọdịdị na n'ụda",
"bn": "আকৃতিতে ও ধ্বনিতে",
"ms": "dari segi bentuk dan bunyi"
},
"longer phrases": {
"yo": "gbólóhùn gígùn",
"ig": "ahịrịokwu toro ogologo",
"bn": "দীর্ঘ বাক্যাংশ",
"ms": "frasa lebih panjang"
},
"longer words": {
"yo": "ọ̀rọ̀ gígùn",
"ig": "okwu toro ogologo",
"bn": "দীর্ঘ শব্দ",
"ms": "perkataan lebih panjang"
},
"meem": {
"yo": "meem",
"ig": "meem",
"bn": "মীম",
"ms": "mim"
},
"noon": {
"yo": "noon",
"ig": "noon",
"bn": "নূন",
"ms": "nun"
},
"raa": {
"yo": "raa",
"ig": "raa",
"bn": "রা",
"ms": "ra"
},
"tanween": {
"yo": "tanween",
"ig": "tanween",
"bn": "তানবীন",
"ms": "tanwin"
},
"on waw": {
"yo": "lórí waw",
"ig": "n'elu waw",
"bn": "ওয়াও-এর উপর",
"ms": "di atas wau"
},
"on yaa": {
"yo": "lórí yaa",
"ig": "n'elu yaa",
"bn": "ইয়া-এর উপর",
"ms": "di atas ya"
},
"phrases with all harakat": {
"yo": "gbólóhùn pẹ̀lú gbogbo harakat",
"ig": "ahịrịokwu nwere harakat niile",
"bn": "সব হরকতসহ বাক্যাংশ",
"ms": "frasa dengan semua harakat"
},
"read a whole phrase": {
"yo": "ka gbogbo gbólóhùn kan",
"ig": "gụọ ahịrịokwu zuru ezu",
"bn": "পুরো বাক্যাংশ পড়ুন",
"ms": "baca satu frasa penuh"
},
"read in one go": {
"yo": "kà á ní ẹ̀ẹ̀kan",
"ig": "gụọ ya otu mgbe",
"bn": "একবারে পড়ুন",
"ms": "baca sekali gus"
},
"read letter by letter": {
"yo": "kà á lẹ́tà-lẹ́tà",
"ig": "gụọ mkpụrụedemede site na mkpụrụedemede",
"bn": "হরফে হরফে পড়ুন",
"ms": "baca huruf demi huruf"
},
"sentences": {
"yo": "gbólóhùn",
"ig": "ahịrịokwu",
"bn": "বাক্য",
"ms": "ayat"
},
"silent letters": {
"yo": "lẹ́tà tí kì í dún",
"ig": "mkpụrụedemede anaghị ada ụda",
"bn": "উচ্চারিত না হওয়া হরফ",
"ms": "huruf senyap"
},
"the closed letter": {
"yo": "lẹ́tà tó ti pa",
"ig": "mkpụrụedemede mechiri emechi",
"bn": "বন্ধ হরফ",
"ms": "huruf tertutup"
},
"the disjoined letters": {
"yo": "àwọn lẹ́tà tí a yà sọ́tọ̀",
"ig": "mkpụrụedemede ekewapụrụ",
"bn": "হুরুফে মুকাত্তাআত",
"ms": "huruf muqatta'ah"
},
"the marks": {
"yo": "àwọn àmì",
"ig": "akara ndị ahụ",
"bn": "চিহ্নগুলো",
"ms": "tanda-tandanya"
},
"two and three words": {
"yo": "ọ̀rọ̀ méjì àti mẹ́ta",
"ig": "okwu abụọ na atọ",
"bn": "দুই ও তিন শব্দ",
"ms": "dua dan tiga perkataan"
},
"with fatha": {
"yo": "pẹ̀lú fatha",
"ig": "na fatha",
"bn": "যবরসহ",
"ms": "dengan fathah"
},
"with the qalqalah letters": {
"yo": "pẹ̀lú àwọn lẹ́tà qalqalah",
"ig": "na mkpụrụedemede qalqalah",
"bn": "কলকলার হরফসহ",
"ms": "dengan huruf qalqalah"
},
"words and phrases": {
"yo": "ọ̀rọ̀ àti gbólóhùn",
"ig": "okwu na ahịrịokwu",
"bn": "শব্দ ও বাক্যাংশ",
"ms": "perkataan dan frasa"
},
"{n} min": {
"yo": "ìṣẹ́jú {n}",
"ig": "nkeji {n}",
"bn": "{n} মিনিট",
"ms": "{n} minit"
},
"{n} of {n} done": {
"yo": "{n} nínú {n} ti parí",
"ig": "{n} n'ime {n} emechaala",
"bn": "{n} / {n} সম্পন্ন",
"ms": "{n} daripada {n} selesai"
},
"{n} of {n} done ⭐": {
"yo": "{n} nínú {n} ti parí ⭐",
"ig": "{n} n'ime {n} emechaala ⭐",
"bn": "{n} / {n} সম্পন্ন ⭐",
"ms": "{n} daripada {n} selesai ⭐"
},
"{n} of {n} lessons": {
"yo": "{n} nínú ẹ̀kọ́ {n}",
"ig": "{n} n'ime ihe ọmụmụ {n}",
"bn": "{n} / {n}টি পাঠ",
"ms": "{n} daripada {n} pelajaran"
},
"{n} subject": {
"yo": "ẹ̀kọ́ {n}",
"ig": "isiokwu {n}",
"bn": "{n}টি বিষয়",
"ms": "{n} subjek"
},
"{n} subjects": {
"yo": "ẹ̀kọ́ {n}",
"ig": "isiokwu {n}",
"bn": "{n}টি বিষয়",
"ms": "{n} subjek"
},
"Qiraha": {
"yo": "Qira'ah",
"ig": "Qira'ah",
"bn": "কিরাআত",
"ms": "Qira'ah"
},
"'arid": {
"yo": "'arid",
"ig": "'arid",
"bn": "আরিদ",
"ms": "'aridh"
},
"badal": {
"yo": "badal",
"ig": "badal",
"bn": "বাদাল",
"ms": "badal"
},
"idgham": {
"yo": "idgham",
"ig": "idgham",
"bn": "ইদগাম",
"ms": "idgham"
},
"ikhfa": {
"yo": "ikhfa",
"ig": "ikhfa",
"bn": "ইখফা",
"ms": "ikhfa'"
},
"iqlab": {
"yo": "iqlab",
"ig": "iqlab",
"bn": "ইকলাব",
"ms": "iqlab"
},
"izhar": {
"yo": "izhar",
"ig": "izhar",
"bn": "ইযহার",
"ms": "izhar"
},
"izhar shafawi": {
"yo": "izhar shafawi",
"ig": "izhar shafawi",
"bn": "ইযহারে শাফাভি",
"ms": "izhar syafawi"
},
"lazim": {
"yo": "lazim",
"ig": "lazim",
"bn": "লাযিম",
"ms": "lazim"
},
"mithlain": {
"yo": "mithlain",
"ig": "mithlain",
"bn": "মিসলাইন",
"ms": "mithlain"
},
"munfasil": {
"yo": "munfasil",
"ig": "munfasil",
"bn": "মুনফাসিল",
"ms": "munfasil"
},
"mutajanisain": {
"yo": "mutajanisain",
"ig": "mutajanisain",
"bn": "মুতাজানিসাইন",
"ms": "mutajanisain"
},
"mutaqaribain": {
"yo": "mutaqaribain",
"ig": "mutaqaribain",
"bn": "মুতাকারিবাইন",
"ms": "mutaqaribain"
},
"muttasil": {
"yo": "muttasil",
"ig": "muttasil",
"bn": "মুত্তাসিল",
"ms": "muttasil"
},
"silah": {
"yo": "silah",
"ig": "silah",
"bn": "সিলাহ",
"ms": "silah"
},
"wasl": {
"yo": "wasl",
"ig": "wasl",
"bn": "ওয়াসল",
"ms": "wasal"
},
"qalqalah": {
"yo": "qalqalah",
"ig": "qalqalah",
"bn": "কলকলা",
"ms": "qalqalah"
},
"pp.{n}–{n}": {
"yo": "ojú-ìwé {n}–{n}",
"ig": "p. {n}–{n}",
"bn": "পৃ. {n}–{n}",
"ms": "ms. {n}–{n}"
}
};
for (const [k, v] of Object.entries(MORE)) DICT[k] = { ...(DICT[k] ?? {}), ...v };

// header language menu, notifications, profile
const EXTRA2: Record<string, T> = {
  "My profile": { ar: "ملفي الشخصي", fr: "Mon profil", ur: "میری پروفائل", ha: "Bayanina", id: "Profil saya", tl: "Aking profile", yo: "Profaili mi", ig: "Profaịlụ m", bn: "আমার প্রোফাইল", ms: "Profil saya" },
  "Friend request": { ar: "طلب صداقة", fr: "Demande d'ami", ur: "دوستی کی درخواست", ha: "Buƙatar abota", id: "Permintaan pertemanan", tl: "Kahilingan sa pakikipagkaibigan", yo: "Ìbéèrè ọ̀rẹ́", ig: "Arịrịọ enyi", bn: "বন্ধুত্বের অনুরোধ", ms: "Permintaan rakan" },
  "Challenge · {x}": {},
  "Tap one to answer it.": { ar: "اضغط على أحدها للرد.", fr: "Touche-en une pour répondre.", ur: "جواب دینے کے لیے کسی ایک کو دبائیں۔", ha: "Danna ɗaya don ka amsa.", id: "Ketuk salah satu untuk menjawab.", tl: "I-tap ang isa para sagutin.", yo: "Tẹ ọ̀kan láti dáhùn.", ig: "Pịa otu ka ị zaa ya.", bn: "উত্তর দিতে একটিতে চাপুন।", ms: "Ketik salah satu untuk menjawab." },
  "Nothing new right now.": { ar: "لا جديد الآن.", fr: "Rien de nouveau pour l'instant.", ur: "ابھی کچھ نیا نہیں۔", ha: "Babu sabon abu yanzu.", id: "Belum ada yang baru.", tl: "Wala pang bago ngayon.", yo: "Kò sí nǹkan tuntun báyìí.", ig: "Ọ dịghị ihe ọhụrụ ugbu a.", bn: "এখন নতুন কিছু নেই।", ms: "Tiada yang baharu sekarang." },
  "Choose language": { ar: "اختر اللغة", fr: "Choisir la langue", ur: "زبان منتخب کریں", ha: "Zaɓi harshe", id: "Pilih bahasa", tl: "Pumili ng wika", yo: "Yan èdè", ig: "Họrọ asụsụ", bn: "ভাষা বেছে নিন", ms: "Pilih bahasa" },
  "until {n}/{n}/{n}": { ar: "حتى {n}/{n}/{n}", fr: "jusqu'au {n}/{n}/{n}", ur: "{n}/{n}/{n} تک", ha: "har zuwa {n}/{n}/{n}", id: "hingga {n}/{n}/{n}", tl: "hanggang {n}/{n}/{n}", yo: "títí dé {n}/{n}/{n}", ig: "ruo {n}/{n}/{n}", bn: "{n}/{n}/{n} পর্যন্ত", ms: "hingga {n}/{n}/{n}" },
  "until {n}.{n}.{n}": { ar: "حتى {n}.{n}.{n}", fr: "jusqu'au {n}.{n}.{n}", ur: "{n}.{n}.{n} تک", ha: "har zuwa {n}.{n}.{n}", id: "hingga {n}.{n}.{n}", tl: "hanggang {n}.{n}.{n}", yo: "títí dé {n}.{n}.{n}", ig: "ruo {n}.{n}.{n}", bn: "{n}.{n}.{n} পর্যন্ত", ms: "hingga {n}.{n}.{n}" },
  "{n} points · swap for Premium": { ar: "{n} نقطة · استبدلها ببريميوم", fr: "{n} points · échange-les contre Premium", ur: "{n} پوائنٹس · پریمیم کے لیے بدلیں", ha: "maki {n} · musanya da Premium", id: "{n} poin · tukar dengan Premium", tl: "{n} puntos · ipalit sa Premium", yo: "àmì {n} · pààrọ̀ wọn fún Premium", ig: "akara {n} · gbanwere ha maka Premium", bn: "{n} পয়েন্ট · প্রিমিয়ামের সাথে বদলান", ms: "{n} mata · tukar untuk Premium" },
};
delete EXTRA2["Challenge · {x}"];
for (const [k, v] of Object.entries(EXTRA2)) DICT[k] = { ...(DICT[k] ?? {}), ...v };
DICT["Live a Muslim life in Lagos and Ilorin."] = { ar: "عِش حياة المسلم في لاغوس وإيلورين.", fr: "Vis une vie de musulman à Lagos et Ilorin.", ur: "لاگوس اور الورن میں مسلمان زندگی گزاریں۔", ha: "Yi rayuwar Musulmi a Legas da Ilorin.", id: "Jalani kehidupan Muslim di Lagos dan Ilorin.", tl: "Mamuhay bilang Muslim sa Lagos at Ilorin.", yo: "Gbé ìgbésí ayé Mùsùlùmí ní Èkó àti Ìlọrin.", ig: "Bie ndụ Alakụba na Legọs na Ilorin.", bn: "লাগোস ও ইলোরিনে মুসলিম জীবন যাপন করুন।", ms: "Jalani kehidupan Muslim di Lagos dan Ilorin." };

// Medina (kids 3D game world) cards on kids Home and Games
const MEDINA_CARDS: Record<string, T> = {
  "Medina": { ar: "المدينة", fr: "Médine", ur: "مدینہ", ha: "Madina", id: "Madinah", tl: "Madinah", yo: "Mẹdina", ig: "Medina", bn: "মদিনা", ms: "Madinah" },
  "{n} games · {n} levels · run, fly, build and learn!": { ar: "{n} ألعاب · {n} مرحلة · اركض وطِر وابنِ وتعلّم!", fr: "{n} jeux · {n} niveaux · cours, vole, construis et apprends !", ur: "{n} کھیل · {n} لیولز · دوڑو، اُڑو، بناؤ اور سیکھو!", ha: "Wasanni {n} · matakai {n} · gudu, tashi sama, gina ka koya!", id: "{n} permainan · {n} level · lari, terbang, bangun, dan belajar!", tl: "{n} laro · {n} level · tumakbo, lumipad, magtayo at matuto!", yo: "Eré {n} · ìpele {n} · sáré, fò, kọ́lé kí o sì kọ́ ẹ̀kọ́!", ig: "Egwuregwu {n} · ọkwa {n} · gbaa ọsọ, fee, wuo ma mụta!", bn: "{n}টি খেলা · {n}টি লেভেল · দৌড়াও, ওড়ো, বানাও আর শেখো!", ms: "{n} permainan · {n} tahap · lari, terbang, bina dan belajar!" },
  "{n} games · {n} levels · tap to play": { ar: "{n} ألعاب · {n} مرحلة · اضغط لتلعب", fr: "{n} jeux · {n} niveaux · touche pour jouer", ur: "{n} کھیل · {n} لیولز · کھیلنے کے لیے دبائیں", ha: "Wasanni {n} · matakai {n} · danna don ka yi wasa", id: "{n} permainan · {n} level · ketuk untuk main", tl: "{n} laro · {n} level · i-tap para maglaro", yo: "Eré {n} · ìpele {n} · tẹ̀ láti ṣeré", ig: "Egwuregwu {n} · ọkwa {n} · pịa ka ị kpọọ", bn: "{n}টি খেলা · {n}টি লেভেল · খেলতে চাপুন", ms: "{n} permainan · {n} tahap · ketik untuk main" },
  "Your daily chest is ready! Tap to open it": { ar: "صندوقك اليومي جاهز! اضغط لتفتحه", fr: "Ton coffre du jour est prêt ! Touche pour l'ouvrir", ur: "آپ کا روزانہ کا صندوق تیار ہے! کھولنے کے لیے دبائیں", ha: "Akwatin yau naka ya shirya! Danna don ka buɗe shi", id: "Peti harianmu sudah siap! Ketuk untuk membukanya", tl: "Handa na ang araw-araw mong kahon! I-tap para buksan", yo: "Àpótí ojoojúmọ́ rẹ ti ṣetán! Tẹ̀ láti ṣí i", ig: "Igbe ụbọchị gị dị njikere! Pịa ka imeghe ya", bn: "তোমার আজকের বাক্স তৈরি! খুলতে চাপুন", ms: "Peti harian kamu sudah sedia! Ketik untuk membukanya" },
};
for (const [k, v] of Object.entries(MEDINA_CARDS)) DICT[k] = { ...(DICT[k] ?? {}), ...v };

// Subjects of the kids HTML games (Quizzes, Puzzles, Memory games)
const KIDS_GAME_SUBJECTS: Record<string, T> = {
  "Good Manners": { ar: "الأخلاق الحسنة", id: "Adab yang Baik", tl: "Mabuting Asal" },
  "5 Pillars": { ar: "أركان الإسلام", id: "Rukun Islam", tl: "5 Haligi" },
  "Salah & Wudu": { ar: "الصلاة والوضوء", id: "Shalat & Wudhu", tl: "Salah at Wudu" },
  "The Prophets": { ar: "الأنبياء", id: "Para Nabi", tl: "Ang mga Propeta" },
  "Prophets": { ar: "الأنبياء", id: "Para Nabi", tl: "Mga Propeta" },
  "The Quran": { ar: "القرآن", id: "Al-Qur'an", tl: "Ang Quran" },
  "Ramadan & Eid": { ar: "رمضان والعيد", id: "Ramadhan & Idul Fitri", tl: "Ramadan at Eid" },
  "Arabic Letters": { ar: "الحروف العربية", id: "Huruf Arab", tl: "Mga Titik Arabe" },
  "Makkah & Madinah": { ar: "مكة والمدينة", id: "Makkah & Madinah", tl: "Makkah at Madinah" },
  "Holy Places": { ar: "الأماكن المقدسة", id: "Tempat Suci", tl: "Mga Banal na Lugar" },
  "Allah's Creation": { ar: "من خلق الله", id: "Ciptaan Allah", tl: "Nilikha ng Allah" },
  "Duas": { ar: "الأدعية والأذكار", id: "Doa & Dzikir", tl: "Mga Dua" },
  "Numbers": { ar: "الأرقام", id: "Angka", tl: "Mga Numero" },
};
for (const [k, v] of Object.entries(KIDS_GAME_SUBJECTS)) DICT[k] = { ...v, ...(DICT[k] ?? {}) };
