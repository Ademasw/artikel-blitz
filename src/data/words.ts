import type { Article, Level, RuleType, WordItem } from '../types/game';

type Extra = Partial<Pick<WordItem, 'id' | 'highlight' | 'ruleHint' | 'alwaysShowTranslation'>>;

function slug(word: string): string {
  return word
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/é/g, 'e')
    .replace(/[^a-z0-9]+/g, '-');
}

function w(
  article: Article,
  word: string,
  plural: string | null,
  translation: string,
  level: Level,
  ruleType: RuleType,
  extra: Extra = {},
): WordItem {
  return { id: extra.id ?? slug(word), word, article, plural, translation, level, ruleType, ...extra };
}

/** Слово с правилом окончания: highlight = окончание, хинт общий для правила. */
function sfx(
  article: Article,
  word: string,
  plural: string | null,
  translation: string,
  level: Level,
  highlight: string,
  ruleHint?: string,
): WordItem {
  return w(article, word, plural, translation, level, 'suffix', {
    highlight,
    ruleHint: ruleHint ?? `Окончание -${highlight} → ${article}`,
  });
}

const H = {
  ling: 'Окончание -ling → всегда der',
  ismus: 'Окончание -ismus → всегда der',
  or: 'Окончание -or (лица и механизмы) → der',
  ant: 'Окончание -ant (лица и животные) → der',
  ist: 'Окончание -ist → всегда der',
  ich: 'Окончание -ich → der',
  ig: 'Окончание -ig → der',
  ung: 'Окончание -ung → всегда die',
  heit: 'Окончание -heit → всегда die',
  keit: 'Окончание -keit → всегда die',
  schaft: 'Окончание -schaft → всегда die',
  tion: 'Окончание -tion → всегда die',
  tat: 'Окончание -tät → всегда die',
  ik: 'Окончание -ik → die',
  ei: 'Окончание -ei → die',
  in: 'Суффикс -in (женщина по профессии/роли) → die',
  e: 'Большинство слов на -e → die',
  ur: 'Окончание -ur → обычно die',
  chen: 'Уменьшительное -chen → всегда das',
  lein: 'Уменьшительное -lein → всегда das',
  ment: 'Окончание -ment → обычно das',
  um: 'Окончание -um (латинские слова) → das',
  tum: 'Окончание -tum → das (кроме der Irrtum, der Reichtum)',
  nis: 'Окончание -nis → обычно das',
  o: 'Слова на -o → обычно das',
  days: 'Дни недели → der',
  months: 'Месяцы → der',
  seasons: 'Времена года → der',
  weather: 'Осадки и погодные явления → der',
  compass: 'Стороны света → der',
  alcohol: 'Алкогольные напитки → der (но das Bier)',
  cars: 'Марки машин → der (der Wagen)',
  male: 'Лица мужского пола → der',
  female: 'Лица женского пола → die',
  numbers: 'Числа как существительные → die',
  colors: 'Цвета как существительные → das',
  metals: 'Металлы → das (кроме die Bronze)',
  languages: 'Языки как существительные → das',
  places: 'Hotel, Café, Kino… → das',
  infinitive: 'Глагол в роли существительного → das',
  fractions: 'Дроби (-tel) → das',
  young: 'Детёныши животных → обычно das',
  ge: 'Собирательные и отглагольные на Ge- → обычно das',
} as const;

const DER: WordItem[] = [
  // Суффиксы
  sfx('der', 'Frühling', 'Frühlinge', 'весна', 'A2', 'ling', H.ling),
  sfx('der', 'Schmetterling', 'Schmetterlinge', 'бабочка', 'B1', 'ling', H.ling),
  sfx('der', 'Lehrling', 'Lehrlinge', 'ученик (на производстве)', 'B1', 'ling', H.ling),
  sfx('der', 'Liebling', 'Lieblinge', 'любимец', 'A2', 'ling', H.ling),
  sfx('der', 'Zwilling', 'Zwillinge', 'близнец', 'B1', 'ling', H.ling),
  sfx('der', 'Tourismus', null, 'туризм', 'B1', 'ismus', H.ismus),
  sfx('der', 'Optimismus', null, 'оптимизм', 'B2', 'ismus', H.ismus),
  sfx('der', 'Motor', 'Motoren', 'мотор', 'A2', 'or', H.or),
  sfx('der', 'Doktor', 'Doktoren', 'доктор', 'A1', 'or', H.or),
  sfx('der', 'Professor', 'Professoren', 'профессор', 'A2', 'or', H.or),
  sfx('der', 'Autor', 'Autoren', 'автор', 'B1', 'or', H.or),
  sfx('der', 'Traktor', 'Traktoren', 'трактор', 'B1', 'or', H.or),
  sfx('der', 'Monitor', 'Monitore', 'монитор', 'B1', 'or', H.or),
  sfx('der', 'Elefant', 'Elefanten', 'слон', 'A2', 'ant', H.ant),
  sfx('der', 'Praktikant', 'Praktikanten', 'стажёр', 'B1', 'ant', H.ant),
  sfx('der', 'Lieferant', 'Lieferanten', 'поставщик', 'B2', 'ant', H.ant),
  sfx('der', 'Diamant', 'Diamanten', 'алмаз', 'B2', 'ant', H.ant),
  sfx('der', 'Polizist', 'Polizisten', 'полицейский', 'A2', 'ist', H.ist),
  sfx('der', 'Tourist', 'Touristen', 'турист', 'A2', 'ist', H.ist),
  sfx('der', 'Journalist', 'Journalisten', 'журналист', 'B1', 'ist', H.ist),
  sfx('der', 'Pianist', 'Pianisten', 'пианист', 'B2', 'ist', H.ist),
  sfx('der', 'Teppich', 'Teppiche', 'ковёр', 'A2', 'ich', H.ich),
  sfx('der', 'Pfirsich', 'Pfirsiche', 'персик', 'B1', 'ich', H.ich),
  sfx('der', 'Kranich', 'Kraniche', 'журавль', 'B2', 'ich', H.ich),
  sfx('der', 'Rettich', 'Rettiche', 'редька', 'B2', 'ich', H.ich),
  sfx('der', 'Honig', 'Honige', 'мёд', 'A2', 'ig', H.ig),
  sfx('der', 'König', 'Könige', 'король', 'A2', 'ig', H.ig),
  sfx('der', 'Essig', 'Essige', 'уксус', 'B2', 'ig', H.ig),
  sfx('der', 'Käfig', 'Käfige', 'клетка (для животных)', 'B2', 'ig', H.ig),

  // Смысловые группы
  w('der', 'Montag', 'Montage', 'понедельник', 'A1', 'semantic', { ruleHint: H.days }),
  w('der', 'Mittwoch', 'Mittwoche', 'среда', 'A1', 'semantic', { ruleHint: H.days }),
  w('der', 'Sonntag', 'Sonntage', 'воскресенье', 'A1', 'semantic', { ruleHint: H.days }),
  w('der', 'Januar', 'Januare', 'январь', 'A1', 'semantic', { ruleHint: H.months }),
  w('der', 'August', 'Auguste', 'август', 'A1', 'semantic', { ruleHint: H.months }),
  w('der', 'Dezember', 'Dezember', 'декабрь', 'A1', 'semantic', { ruleHint: H.months }),
  w('der', 'Sommer', 'Sommer', 'лето', 'A1', 'semantic', { ruleHint: H.seasons }),
  w('der', 'Winter', 'Winter', 'зима', 'A1', 'semantic', { ruleHint: H.seasons }),
  w('der', 'Herbst', 'Herbste', 'осень', 'A1', 'semantic', { ruleHint: H.seasons }),
  w('der', 'Regen', null, 'дождь', 'A1', 'semantic', { ruleHint: H.weather }),
  w('der', 'Schnee', null, 'снег', 'A1', 'semantic', { ruleHint: H.weather }),
  w('der', 'Hagel', null, 'град', 'B2', 'semantic', { ruleHint: H.weather }),
  w('der', 'Nebel', 'Nebel', 'туман', 'A2', 'semantic', { ruleHint: H.weather }),
  w('der', 'Norden', null, 'север', 'A2', 'semantic', { ruleHint: H.compass }),
  w('der', 'Süden', null, 'юг', 'A2', 'semantic', { ruleHint: H.compass }),
  w('der', 'Osten', null, 'восток', 'A2', 'semantic', { ruleHint: H.compass }),
  w('der', 'Wein', 'Weine', 'вино', 'A1', 'semantic', { ruleHint: H.alcohol }),
  w('der', 'Wodka', 'Wodkas', 'водка', 'A2', 'semantic', { ruleHint: H.alcohol }),
  w('der', 'Schnaps', 'Schnäpse', 'шнапс', 'B1', 'semantic', { ruleHint: H.alcohol }),
  w('der', 'Sekt', 'Sekte', 'игристое вино', 'B1', 'semantic', { ruleHint: H.alcohol }),
  w('der', 'BMW', 'BMWs', 'BMW (машина)', 'A2', 'semantic', { ruleHint: H.cars }),
  w('der', 'Vater', 'Väter', 'отец', 'A1', 'semantic', { ruleHint: H.male }),
  w('der', 'Bruder', 'Brüder', 'брат', 'A1', 'semantic', { ruleHint: H.male }),

  // Исключения
  w('der', 'Name', 'Namen', 'имя', 'A1', 'exception', { highlight: 'e', ruleHint: 'На -e, но der' }),
  w('der', 'Käse', 'Käse', 'сыр', 'A1', 'exception', { highlight: 'e', ruleHint: 'На -e, но der' }),
  w('der', 'Junge', 'Jungen', 'мальчик', 'A1', 'exception', {
    highlight: 'e',
    ruleHint: 'На -e, но мужчина → der',
  }),
  w('der', 'Kollege', 'Kollegen', 'коллега (м.)', 'A2', 'exception', {
    highlight: 'e',
    ruleHint: 'На -e, но мужчина → der',
  }),
  w('der', 'Affe', 'Affen', 'обезьяна', 'A2', 'exception', {
    highlight: 'e',
    ruleHint: 'На -e, но самец/животное м. р. → der',
  }),
  w('der', 'Moment', 'Momente', 'момент', 'A2', 'exception', {
    highlight: 'ment',
    ruleHint: 'На -ment, но der Moment',
  }),
  w('der', 'Zement', 'Zemente', 'цемент', 'B2', 'exception', {
    highlight: 'ment',
    ruleHint: 'На -ment, но der Zement',
  }),
  w('der', 'Irrtum', 'Irrtümer', 'заблуждение', 'B2', 'exception', {
    highlight: 'tum',
    ruleHint: '-tum обычно das, но der Irrtum',
  }),
  w('der', 'Reichtum', 'Reichtümer', 'богатство', 'B2', 'exception', {
    highlight: 'tum',
    ruleHint: '-tum обычно das, но der Reichtum',
  }),
  w('der', 'Termin', 'Termine', 'назначенная встреча', 'A2', 'exception', {
    highlight: 'in',
    ruleHint: '-in → die только у женщин; der Termin',
  }),
  w('der', 'Sauerstoff', null, 'кислород', 'B2', 'exception', {
    ruleHint: 'Химэлементы обычно das, но der Sauerstoff',
  }),
  w('der', 'Wasserstoff', null, 'водород', 'B2', 'exception', {
    ruleHint: 'Химэлементы обычно das, но der Wasserstoff',
  }),

  // Омонимы
  w('der', 'See', 'Seen', 'озеро', 'A2', 'none', {
    id: 'see-m',
    alwaysShowTranslation: true,
    ruleHint: 'der See = озеро, die See = море',
  }),
  w('der', 'Teil', 'Teile', 'часть (целого)', 'B1', 'none', {
    id: 'teil-m',
    alwaysShowTranslation: true,
    ruleHint: 'der Teil = часть целого, das Teil = деталь',
  }),
  w('der', 'Leiter', 'Leiter', 'руководитель', 'B1', 'none', {
    id: 'leiter-m',
    alwaysShowTranslation: true,
    ruleHint: 'der Leiter = руководитель, die Leiter = лестница',
  }),
  w('der', 'Band', 'Bände', 'том (книги)', 'B2', 'none', {
    id: 'band-m',
    alwaysShowTranslation: true,
    ruleHint: 'der Band = том, das Band = лента, die Band = группа',
  }),

  // Без правила
  w('der', 'Tisch', 'Tische', 'стол', 'A1', 'none'),
  w('der', 'Vertrag', 'Verträge', 'договор', 'B2', 'none'),
];

const DIE: WordItem[] = [
  sfx('die', 'Zeitung', 'Zeitungen', 'газета', 'A1', 'ung', H.ung),
  sfx('die', 'Wohnung', 'Wohnungen', 'квартира', 'A1', 'ung', H.ung),
  sfx('die', 'Übung', 'Übungen', 'упражнение', 'A2', 'ung', H.ung),
  sfx('die', 'Meinung', 'Meinungen', 'мнение', 'B1', 'ung', H.ung),
  sfx('die', 'Erfahrung', 'Erfahrungen', 'опыт', 'B1', 'ung', H.ung),
  sfx('die', 'Entscheidung', 'Entscheidungen', 'решение', 'B1', 'ung', H.ung),
  sfx('die', 'Vereinbarung', 'Vereinbarungen', 'соглашение', 'B2', 'ung', H.ung),
  sfx('die', 'Gesundheit', null, 'здоровье', 'A2', 'heit', H.heit),
  sfx('die', 'Krankheit', 'Krankheiten', 'болезнь', 'A2', 'heit', H.heit),
  sfx('die', 'Freiheit', 'Freiheiten', 'свобода', 'B1', 'heit', H.heit),
  sfx('die', 'Sicherheit', 'Sicherheiten', 'безопасность', 'B1', 'heit', H.heit),
  sfx('die', 'Gelegenheit', 'Gelegenheiten', 'возможность, случай', 'B2', 'heit', H.heit),
  sfx('die', 'Möglichkeit', 'Möglichkeiten', 'возможность', 'B1', 'keit', H.keit),
  sfx('die', 'Süßigkeit', 'Süßigkeiten', 'сладость', 'A2', 'keit', H.keit),
  sfx('die', 'Schwierigkeit', 'Schwierigkeiten', 'трудность', 'B1', 'keit', H.keit),
  sfx('die', 'Fähigkeit', 'Fähigkeiten', 'способность', 'B2', 'keit', H.keit),
  sfx('die', 'Geschwindigkeit', 'Geschwindigkeiten', 'скорость', 'B2', 'keit', H.keit),
  sfx('die', 'Freundschaft', 'Freundschaften', 'дружба', 'A2', 'schaft', H.schaft),
  sfx('die', 'Mannschaft', 'Mannschaften', 'команда', 'B1', 'schaft', H.schaft),
  sfx('die', 'Gesellschaft', 'Gesellschaften', 'общество', 'B1', 'schaft', H.schaft),
  sfx('die', 'Landschaft', 'Landschaften', 'ландшафт', 'B1', 'schaft', H.schaft),
  sfx('die', 'Wissenschaft', 'Wissenschaften', 'наука', 'B2', 'schaft', H.schaft),
  sfx('die', 'Information', 'Informationen', 'информация', 'A1', 'tion', H.tion),
  sfx('die', 'Station', 'Stationen', 'станция', 'A2', 'tion', H.tion),
  sfx('die', 'Situation', 'Situationen', 'ситуация', 'B1', 'tion', H.tion),
  sfx('die', 'Nation', 'Nationen', 'нация', 'B1', 'tion', H.tion),
  sfx('die', 'Universität', 'Universitäten', 'университет', 'A2', 'tät', H.tat),
  sfx('die', 'Nationalität', 'Nationalitäten', 'национальность', 'A2', 'tät', H.tat),
  sfx('die', 'Qualität', 'Qualitäten', 'качество', 'B1', 'tät', H.tat),
  sfx('die', 'Realität', 'Realitäten', 'реальность', 'B2', 'tät', H.tat),
  sfx('die', 'Identität', 'Identitäten', 'личность, идентичность', 'B2', 'tät', H.tat),
  sfx('die', 'Musik', null, 'музыка', 'A1', 'ik', H.ik),
  sfx('die', 'Grammatik', 'Grammatiken', 'грамматика', 'A2', 'ik', H.ik),
  sfx('die', 'Politik', null, 'политика', 'B1', 'ik', H.ik),
  sfx('die', 'Technik', 'Techniken', 'техника', 'B1', 'ik', H.ik),
  sfx('die', 'Fabrik', 'Fabriken', 'фабрика', 'B1', 'ik', H.ik),
  sfx('die', 'Kritik', 'Kritiken', 'критика', 'B2', 'ik', H.ik),
  sfx('die', 'Bäckerei', 'Bäckereien', 'пекарня', 'A2', 'ei', H.ei),
  sfx('die', 'Polizei', null, 'полиция', 'A2', 'ei', H.ei),
  sfx('die', 'Bücherei', 'Büchereien', 'библиотека', 'B1', 'ei', H.ei),
  sfx('die', 'Partei', 'Parteien', 'партия', 'B2', 'ei', H.ei),
  sfx('die', 'Lehrerin', 'Lehrerinnen', 'учительница', 'A1', 'in', H.in),
  sfx('die', 'Ärztin', 'Ärztinnen', 'врач (женщина)', 'A1', 'in', H.in),
  sfx('die', 'Freundin', 'Freundinnen', 'подруга', 'A1', 'in', H.in),
  sfx('die', 'Verkäuferin', 'Verkäuferinnen', 'продавщица', 'A2', 'in', H.in),
  sfx('die', 'Lampe', 'Lampen', 'лампа', 'A1', 'e', H.e),
  sfx('die', 'Tasche', 'Taschen', 'сумка', 'A1', 'e', H.e),
  sfx('die', 'Straße', 'Straßen', 'улица', 'A1', 'e', H.e),
  sfx('die', 'Blume', 'Blumen', 'цветок', 'A1', 'e', H.e),
  sfx('die', 'Sprache', 'Sprachen', 'язык (речь)', 'A1', 'e', H.e),
  sfx('die', 'Reise', 'Reisen', 'путешествие', 'A2', 'e', H.e),
  sfx('die', 'Brille', 'Brillen', 'очки', 'A2', 'e', H.e),
  sfx('die', 'Ausnahme', 'Ausnahmen', 'исключение', 'B1', 'e', H.e),
  sfx('die', 'Grenze', 'Grenzen', 'граница', 'B1', 'e', H.e),
  sfx('die', 'Ursache', 'Ursachen', 'причина', 'B2', 'e', H.e),
  sfx('die', 'Temperatur', 'Temperaturen', 'температура', 'A2', 'ur', H.ur),

  w('die', 'Mutter', 'Mütter', 'мать', 'A1', 'semantic', { ruleHint: H.female }),
  w('die', 'Schwester', 'Schwestern', 'сестра', 'A1', 'semantic', { ruleHint: H.female }),
  w('die', 'Tochter', 'Töchter', 'дочь', 'A1', 'semantic', { ruleHint: H.female }),
  w('die', 'Eins', 'Einsen', 'единица (цифра, оценка)', 'A2', 'semantic', { ruleHint: H.numbers }),
  w('die', 'Zehn', 'Zehnen', 'десятка (цифра)', 'A2', 'semantic', { ruleHint: H.numbers }),

  w('die', 'Erlaubnis', 'Erlaubnisse', 'разрешение', 'B1', 'exception', {
    highlight: 'nis',
    ruleHint: '-nis обычно das, но die Erlaubnis',
  }),
  w('die', 'Kenntnis', 'Kenntnisse', 'знание', 'B2', 'exception', {
    highlight: 'nis',
    ruleHint: '-nis обычно das, но die Kenntnis',
  }),
  w('die', 'Butter', null, 'сливочное масло', 'A1', 'exception', { ruleHint: 'Запомнить: die Butter' }),
  w('die', 'Bronze', 'Bronzen', 'бронза', 'B2', 'exception', {
    ruleHint: 'Металлы обычно das, но die Bronze',
  }),

  w('die', 'See', 'Seen', 'море', 'B1', 'none', {
    id: 'see-f',
    alwaysShowTranslation: true,
    ruleHint: 'die See = море, der See = озеро',
  }),
  w('die', 'Leiter', 'Leitern', 'лестница (приставная)', 'A2', 'none', {
    id: 'leiter-f',
    alwaysShowTranslation: true,
    ruleHint: 'die Leiter = лестница, der Leiter = руководитель',
  }),
  w('die', 'Band', 'Bands', 'музыкальная группа', 'B1', 'none', {
    id: 'band-f',
    alwaysShowTranslation: true,
    ruleHint: 'die Band = группа, der Band = том, das Band = лента',
  }),

  w('die', 'Nacht', 'Nächte', 'ночь', 'A1', 'none'),
  w('die', 'Angst', 'Ängste', 'страх', 'B1', 'none'),
];

const DAS: WordItem[] = [
  sfx('das', 'Mädchen', 'Mädchen', 'девочка', 'A1', 'chen', 'Все -chen → das, даже Mädchen'),
  sfx('das', 'Brötchen', 'Brötchen', 'булочка', 'A1', 'chen', H.chen),
  sfx('das', 'Hähnchen', 'Hähnchen', 'курица (блюдо)', 'A2', 'chen', H.chen),
  sfx('das', 'Märchen', 'Märchen', 'сказка', 'A2', 'chen', H.chen),
  sfx('das', 'Kaninchen', 'Kaninchen', 'кролик', 'B1', 'chen', H.chen),
  sfx('das', 'Eichhörnchen', 'Eichhörnchen', 'белка', 'B1', 'chen', H.chen),
  sfx('das', 'Fräulein', 'Fräulein', 'барышня (устар.)', 'B2', 'lein', H.lein),
  sfx('das', 'Büchlein', 'Büchlein', 'книжечка', 'B2', 'lein', H.lein),
  sfx('das', 'Vöglein', 'Vöglein', 'птичка', 'B2', 'lein', H.lein),
  sfx('das', 'Dokument', 'Dokumente', 'документ', 'B1', 'ment', H.ment),
  sfx('das', 'Instrument', 'Instrumente', 'музыкальный инструмент', 'B1', 'ment', H.ment),
  sfx('das', 'Medikament', 'Medikamente', 'лекарство', 'A2', 'ment', H.ment),
  sfx('das', 'Apartment', 'Apartments', 'апартаменты', 'A2', 'ment', H.ment),
  sfx('das', 'Parlament', 'Parlamente', 'парламент', 'B2', 'ment', H.ment),
  sfx('das', 'Experiment', 'Experimente', 'эксперимент', 'B2', 'ment', H.ment),
  sfx('das', 'Museum', 'Museen', 'музей', 'A1', 'um', H.um),
  sfx('das', 'Datum', 'Daten', 'дата', 'A1', 'um', H.um),
  sfx('das', 'Zentrum', 'Zentren', 'центр', 'A2', 'um', H.um),
  sfx('das', 'Studium', 'Studien', 'учёба в вузе', 'A2', 'um', H.um),
  sfx('das', 'Gymnasium', 'Gymnasien', 'гимназия', 'A2', 'um', H.um),
  sfx('das', 'Aquarium', 'Aquarien', 'аквариум', 'B2', 'um', H.um),
  sfx('das', 'Publikum', null, 'публика', 'B2', 'um', H.um),
  sfx('das', 'Eigentum', null, 'собственность', 'B2', 'tum', H.tum),
  sfx('das', 'Wachstum', null, 'рост', 'B2', 'tum', H.tum),
  sfx('das', 'Christentum', null, 'христианство', 'B2', 'tum', H.tum),
  sfx('das', 'Heiligtum', 'Heiligtümer', 'святыня', 'B2', 'tum', H.tum),
  sfx('das', 'Ergebnis', 'Ergebnisse', 'результат', 'B1', 'nis', H.nis),
  sfx('das', 'Erlebnis', 'Erlebnisse', 'впечатление, событие', 'B1', 'nis', H.nis),
  sfx('das', 'Zeugnis', 'Zeugnisse', 'аттестат, справка', 'A2', 'nis', H.nis),
  sfx('das', 'Geheimnis', 'Geheimnisse', 'тайна', 'B1', 'nis', H.nis),
  sfx('das', 'Gefängnis', 'Gefängnisse', 'тюрьма', 'B2', 'nis', H.nis),
  sfx('das', 'Hindernis', 'Hindernisse', 'препятствие', 'B2', 'nis', H.nis),
  sfx('das', 'Auto', 'Autos', 'машина', 'A1', 'o', H.o),
  sfx('das', 'Kino', 'Kinos', 'кинотеатр', 'A1', 'o', H.o),
  sfx('das', 'Büro', 'Büros', 'офис', 'A1', 'o', H.o),
  sfx('das', 'Radio', 'Radios', 'радио', 'A1', 'o', H.o),

  w('das', 'Rot', null, 'красный цвет', 'A2', 'semantic', { ruleHint: H.colors }),
  w('das', 'Blau', null, 'синий цвет', 'A2', 'semantic', { ruleHint: H.colors }),
  w('das', 'Gold', null, 'золото', 'A2', 'semantic', { ruleHint: H.metals }),
  w('das', 'Silber', null, 'серебро', 'A2', 'semantic', { ruleHint: H.metals }),
  w('das', 'Eisen', null, 'железо', 'B1', 'semantic', { ruleHint: H.metals }),
  w('das', 'Kupfer', null, 'медь', 'B2', 'semantic', { ruleHint: H.metals }),
  w('das', 'Deutsch', null, 'немецкий язык', 'A1', 'semantic', { ruleHint: H.languages }),
  w('das', 'Englisch', null, 'английский язык', 'A1', 'semantic', { ruleHint: H.languages }),
  w('das', 'Hotel', 'Hotels', 'гостиница', 'A1', 'semantic', { ruleHint: H.places }),
  w('das', 'Café', 'Cafés', 'кафе', 'A1', 'semantic', { ruleHint: H.places }),
  w('das', 'Essen', 'Essen', 'еда', 'A1', 'semantic', { ruleHint: H.infinitive }),
  w('das', 'Schwimmen', null, 'плавание', 'A2', 'semantic', { ruleHint: H.infinitive }),
  w('das', 'Viertel', 'Viertel', 'четверть; квартал', 'A2', 'semantic', { ruleHint: H.fractions }),
  w('das', 'Kalb', 'Kälber', 'телёнок', 'B1', 'semantic', { ruleHint: H.young }),
  w('das', 'Lamm', 'Lämmer', 'ягнёнок', 'B1', 'semantic', { ruleHint: H.young }),
  w('das', 'Gemüse', null, 'овощи', 'A1', 'semantic', { ruleHint: H.ge }),
  w('das', 'Geschenk', 'Geschenke', 'подарок', 'A1', 'semantic', { ruleHint: H.ge }),
  w('das', 'Getränk', 'Getränke', 'напиток', 'A1', 'semantic', { ruleHint: H.ge }),
  w('das', 'Gespräch', 'Gespräche', 'разговор', 'A2', 'semantic', { ruleHint: H.ge }),
  w('das', 'Gebäude', 'Gebäude', 'здание', 'B1', 'semantic', { ruleHint: H.ge }),
  w('das', 'Gebirge', 'Gebirge', 'горы, горный массив', 'B1', 'semantic', { ruleHint: H.ge }),

  w('das', 'Ende', 'Enden', 'конец', 'A1', 'exception', { highlight: 'e', ruleHint: 'На -e, но das Ende' }),
  w('das', 'Auge', 'Augen', 'глаз', 'A1', 'exception', { highlight: 'e', ruleHint: 'На -e, но das Auge' }),
  w('das', 'Interesse', 'Interessen', 'интерес', 'A2', 'exception', {
    highlight: 'e',
    ruleHint: 'На -e, но das Interesse',
  }),
  w('das', 'Labor', 'Labore', 'лаборатория', 'B1', 'exception', {
    highlight: 'or',
    ruleHint: '-or обычно der, но das Labor',
  }),
  w('das', 'Tor', 'Tore', 'ворота; гол', 'A2', 'exception', {
    highlight: 'or',
    ruleHint: '-or обычно der, но das Tor',
  }),
  w('das', 'Benzin', null, 'бензин', 'A2', 'exception', {
    highlight: 'in',
    ruleHint: '-in → die только у женщин; das Benzin',
  }),
  w('das', 'Restaurant', 'Restaurants', 'ресторан', 'A1', 'exception', {
    highlight: 'ant',
    ruleHint: '-ant обычно der, но das Restaurant',
  }),
  w('das', 'Bier', 'Biere', 'пиво', 'A1', 'exception', {
    ruleHint: 'Алкоголь обычно der, но das Bier',
  }),

  w('das', 'Teil', 'Teile', 'деталь', 'B1', 'none', {
    id: 'teil-n',
    alwaysShowTranslation: true,
    ruleHint: 'das Teil = деталь, der Teil = часть целого',
  }),
  w('das', 'Band', 'Bänder', 'лента', 'B2', 'none', {
    id: 'band-n',
    alwaysShowTranslation: true,
    ruleHint: 'das Band = лента, der Band = том, die Band = группа',
  }),

  w('das', 'Haus', 'Häuser', 'дом', 'A1', 'none'),
  w('das', 'Buch', 'Bücher', 'книга', 'A1', 'none'),
  w('das', 'Werkzeug', 'Werkzeuge', 'инструмент (рабочий)', 'B2', 'none'),
];

export const WORDS: readonly WordItem[] = [...DER, ...DIE, ...DAS];
