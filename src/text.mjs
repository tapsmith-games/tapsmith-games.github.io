// Тексты сайта на двух языках. Юридические документы — в content/<игра>/*.md, здесь — только оболочка
// страниц и описания игр.

export const LANGS = ["en", "ru"];

export const UI = {
  en: {
    langName: "English",
    eyebrow: "Mobile game studio",
    supportNote: "Questions, purchases, lost progress",
    privacyNote: "What data the game collects and why",
    termsNote: "Rules for players and purchases",
    deleteNote: "In the game or by email",
    tagline: "We make mobile games: short sessions, long progress.",
    games: "Games",
    soon: "Coming soon to Google Play",
    gamePage: "About the game",
    support: "Support",
    privacy: "Privacy policy",
    terms: "Terms of use",
    deleteAccount: "Delete account",
    help: "Help and legal",
    contact: "Questions about a game? Write to",
    contactNoEmail: "Contact details will appear here before release.",
    effective: "In effect from",
    notFound: "This page doesn't exist.",
    toHome: "Go to the home page",
    skip: "Skip to content",
    allGames: "All games",
  },
  ru: {
    langName: "Русский",
    eyebrow: "Студия мобильных игр",
    supportNote: "Вопросы, покупки, потерянный прогресс",
    privacyNote: "Какие данные собирает игра и зачем",
    termsNote: "Правила для игроков и покупок",
    deleteNote: "В игре или по почте",
    tagline: "Мы делаем мобильные игры: короткие заходы, долгий прогресс.",
    games: "Игры",
    soon: "Скоро в Google Play",
    gamePage: "Об игре",
    support: "Поддержка",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    deleteAccount: "Удаление аккаунта",
    help: "Помощь и документы",
    contact: "Вопросы по игре? Пишите на",
    contactNoEmail: "Контакты появятся здесь до выхода игры.",
    effective: "Действует с",
    notFound: "Такой страницы нет.",
    toHome: "На главную",
    skip: "К содержимому",
    allGames: "Все игры",
  },
};

/** Поддержка: вопросы и ответы. {email}, {delete}, {privacy} подставляет сборка. */
export const SUPPORT = {
  en: {
    title: "Support",
    lead: "Write to {email}. Add your player ID so we can find your account: open the game, tap your avatar, the ID is under your name.",
    leadNoEmail: "The support address will appear here before release.",
    faq: [
      ["How do I delete my account?", "In the game: Profile → Settings → Delete account. Without the game: see {delete}."],
      ["A purchase didn't arrive", "Restart the game first: purchases are credited when it connects. If it's still missing, send us your player ID and the order number from the Google Play receipt."],
      ["I reinstalled the game and lost my progress", "Your account lives on the device that created it. Account linking isn't available yet, so write to us with your player ID or in-game name and roughly when you last played — we'll try to help."],
      ["Report a player or a clan", "Send the player's or clan's name and what happened. Screenshots help."],
      ["What data do the games collect?", "See the privacy policy of each game: {privacy}."],
    ],
  },
  ru: {
    title: "Поддержка",
    lead: "Пишите на {email}. Укажите ID игрока, чтобы мы нашли аккаунт: откройте игру, нажмите на аватар — ID под именем.",
    leadNoEmail: "Адрес поддержки появится здесь до выхода игры.",
    faq: [
      ["Как удалить аккаунт?", "В игре: Профиль → Настройки → Удалить аккаунт. Без игры — см. {delete}."],
      ["Не пришла покупка", "Сначала перезапустите игру: покупки зачисляются при подключении. Если покупки всё ещё нет, пришлите ID игрока и номер заказа из чека Google Play."],
      ["Переустановил игру, и прогресс пропал", "Аккаунт привязан к устройству, на котором создан. Привязки аккаунта пока нет, поэтому напишите нам ID игрока или имя в игре и когда примерно играли последний раз — попробуем помочь."],
      ["Пожаловаться на игрока или клан", "Пришлите имя игрока или клана и что случилось. Скриншоты помогают."],
      ["Какие данные собирают игры?", "Смотрите политику конфиденциальности игры: {privacy}."],
    ],
  },
};

export const GAMES = [
  {
    slug: "ninja-elements",
    name: "Ninja Elements: Idle RPG",
    shortName: "Ninja Elements",
    googlePlay: null, // ссылка на страницу в Google Play после публикации
    docs: { privacy: "privacy-policy", terms: "terms", "delete-account": "delete-account" },
    text: {
      en: {
        short: "Build five ninja squads, master the elements and win idle battles even offline.",
        about:
          "Five schools of ninja, one hero to lead them. Each element has its own base, squad and ten leagues to climb. Battles run by themselves, and income keeps coming while you're away.",
        cycleTitle: "Five elements, one cycle",
        cycleText: "Each element beats the next one, and Water beats Fire. In PvP you see the elements of every round before the fight.",
        elements: ["Fire", "Wind", "Lightning", "Earth", "Water"],
        facts: [
          ["5", "elements, each with its own base and squad"],
          ["10", "leagues to climb in every element"],
          ["PvP", "arena, hero duels and a weekly tournament"],
          ["12", "languages"],
        ],
        modesTitle: "Play with others, every week",
        modes: [
          ["clanbattle", "Pagoda Siege", "Your clan storms the enemy pagoda twice a week."],
          ["rush", "Trial of the Abyss", "A three-day race from scratch against other players."],
          ["lottery", "Chest of Fortune", "Ten prizes, and each one drops only once."],
        ],
      },
      ru: {
        short: "Собери пять отрядов ниндзя, освой стихии и побеждай даже без игры.",
        about:
          "Пять школ ниндзя и один герой во главе. У каждой стихии своя база, свой отряд и десять лиг. Бои идут сами, а доход копится, пока вас нет в игре.",
        cycleTitle: "Пять стихий, один круг",
        cycleText: "Каждая стихия сильнее следующей, а Вода — сильнее Огня. В PvP стихии каждого раунда видны до боя.",
        elements: ["Огонь", "Ветер", "Молния", "Земля", "Вода"],
        facts: [
          ["5", "стихий, у каждой своя база и отряд"],
          ["10", "лиг в каждой стихии"],
          ["PvP", "арена, дуэли героев и турнир каждую неделю"],
          ["12", "языков"],
        ],
        modesTitle: "Каждую неделю — с другими игроками",
        modes: [
          ["clanbattle", "Битва за пагоду", "Клан штурмует пагоду соперников дважды в неделю."],
          ["rush", "Испытание бездны", "Трёхдневная гонка с нуля против других игроков."],
          ["lottery", "Сундук фортуны", "Десять призов, каждый выпадает один раз."],
        ],
      },
    },
  },
];
