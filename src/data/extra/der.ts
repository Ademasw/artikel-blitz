/**
 * Расширенный словарь: der. Формат строки:
 *   Слово | мн. ч. («-» = нет) | перевод | уровень | метка (необязательно)
 * Метка: «-ung» — правило окончания; «@male» — смысловая группа (ключ подсказки);
 *        «!e:текст» — исключение с подсветкой окончания e; «!текст» — исключение без подсветки.
 */
export const DER_EXTRA = `
Dienstag | Dienstage | вторник | A1 | @days
Donnerstag | Donnerstage | четверг | A1 | @days
Freitag | Freitage | пятница | A1 | @days
Samstag | Samstage | суббота | A1 | @days
Februar | Februare | февраль | A1 | @months
März | Märze | март | A1 | @months
April | Aprile | апрель | A1 | @months
Mai | Maie | май | A1 | @months
Juni | Junis | июнь | A1 | @months
Juli | Julis | июль | A1 | @months
September | September | сентябрь | A1 | @months
Oktober | Oktober | октябрь | A1 | @months
November | November | ноябрь | A1 | @months
Westen | - | запад | A2 | @compass
Wind | Winde | ветер | A2 | @weather
Sturm | Stürme | буря | B1 | @weather
Donner | Donner | гром | B1 | @weather
Blitz | Blitze | молния | B1 | @weather
Frost | Fröste | мороз | B1 | @weather
Schauer | Schauer | ливень | B1 | @weather
Rum | Rums | ром | B1 | @alcohol
Whisky | Whiskys | виски | B1 | @alcohol
Likör | Liköre | ликёр | B2 | @alcohol
Champagner | Champagner | шампанское | B1 | @alcohol
Audi | Audis | «Ауди» (машина) | A2 | @cars
Mercedes | Mercedes | «Мерседес» (машина) | A2 | @cars

Freund | Freunde | друг | A1 | @male
Mann | Männer | мужчина | A1 | @male
Sohn | Söhne | сын | A1 | @male
Onkel | Onkel | дядя | A1 | @male
Opa | Opas | дедушка | A1 | @male
Großvater | Großväter | дедушка | A1 | @male
Lehrer | Lehrer | учитель | A1 | @male
Arzt | Ärzte | врач | A1 | @male
Kellner | Kellner | официант | A1 | @male
Koch | Köche | повар | A1 | @male
Fahrer | Fahrer | водитель | A2 | @male
Nachbar | Nachbarn | сосед | A1 | @male
Kunde | Kunden | клиент | A2 | @male
Chef | Chefs | начальник | A1 | @male
Student | Studenten | студент | A1 | @male
Verkäufer | Verkäufer | продавец | A1 | @male
Mitarbeiter | Mitarbeiter | сотрудник | A2 | @male
Spieler | Spieler | игрок | A2 | @male
Zahnarzt | Zahnärzte | стоматолог | A2 | @male
Enkel | Enkel | внук | A2 | @male
Cousin | Cousins | двоюродный брат | A2 | @male
Ehemann | Ehemänner | муж | A2 | @male
Partner | Partner | партнёр | A2 | @male
Neffe | Neffen | племянник | B1 | @male
Bürger | Bürger | гражданин | B1 | @male
Präsident | Präsidenten | президент | B1 | @male
Kandidat | Kandidaten | кандидат | B1 | @male
Soldat | Soldaten | солдат | B1 | @male
Bauer | Bauern | крестьянин, фермер | B1 | @male
Rentner | Rentner | пенсионер | B1 | @male
Richter | Richter | судья | B1 | @male
Anwalt | Anwälte | адвокат | B1 | @male
Dieb | Diebe | вор | B1 | @male
Gott | Götter | бог | B1 | @male
Held | Helden | герой | B1 | @male
Prinz | Prinzen | принц | B1 | @male
Zeuge | Zeugen | свидетель | B2 | @male
Täter | Täter | преступник | B2 | @male
Gegner | Gegner | противник | B2 | @male
Verbraucher | Verbraucher | потребитель | B2 | @male

Häftling | Häftlinge | заключённый | B2 | -ling
Flüchtling | Flüchtlinge | беженец | B1 | -ling
Säugling | Säuglinge | младенец | B2 | -ling
Feigling | Feiglinge | трус | B2 | -ling
Neuling | Neulinge | новичок | B2 | -ling
Sozialismus | - | социализм | B2 | -ismus
Kapitalismus | - | капитализм | B2 | -ismus
Realismus | - | реализм | B2 | -ismus
Pessimismus | - | пессимизм | B2 | -ismus
Rassismus | - | расизм | B2 | -ismus
Faktor | Faktoren | фактор | B2 | -or
Sektor | Sektoren | сектор | B2 | -or
Moderator | Moderatoren | ведущий (передачи) | B2 | -or
Reaktor | Reaktoren | реактор | B2 | -or
Ventilator | Ventilatoren | вентилятор | B1 | -or
Demonstrant | Demonstranten | демонстрант | B2 | -ant
Emigrant | Emigranten | эмигрант | B2 | -ant
Spezialist | Spezialisten | специалист | B1 | -ist
Optimist | Optimisten | оптимист | B2 | -ist
Komponist | Komponisten | композитор | B2 | -ist
Gitarrist | Gitarristen | гитарист | B1 | -ist
Pfennig | Pfennige | пфенниг | B2 | -ig

Löwe | Löwen | лев | A2 | !e:На -e, но der Löwe (самец)
Hase | Hasen | заяц | A2 | !e:На -e, но der Hase
Gedanke | Gedanken | мысль | B1 | !e:На -e, но der Gedanke
Buchstabe | Buchstaben | буква | A2 | !e:На -e, но der Buchstabe
Glaube | - | вера | B2 | !e:На -e, но der Glaube
Wille | - | воля | B2 | !e:На -e, но der Wille
Papagei | Papageien | попугай | B1 | !ei:-ei обычно die, но der Papagei
Brei | Breie | каша | B2 | !ei:-ei обычно die, но der Brei
Sprung | Sprünge | прыжок | B1 | !ung:-ung обычно die, но der Sprung (односложное)
Ursprung | Ursprünge | происхождение | B2 | !ung:-ung обычно die, но der Ursprung (от Sprung)
Aufschwung | Aufschwünge | подъём (экономики) | B2 | !ung:-ung обычно die, но der Aufschwung (от Schwung)
Kuchen | Kuchen | пирог | A1 | !chen:-chen здесь не уменьшительное: der Kuchen
Knochen | Knochen | кость | B1 | !chen:-chen здесь не уменьшительное: der Knochen
Euro | Euros | евро | A1 | !o:-o обычно das, но der Euro

Tag | Tage | день | A1
Abend | Abende | вечер | A1
Morgen | Morgen | утро | A1
Mittag | Mittage | полдень | A1
Monat | Monate | месяц | A1
Stuhl | Stühle | стул | A1
Schrank | Schränke | шкаф | A1
Kühlschrank | Kühlschränke | холодильник | A1
Löffel | Löffel | ложка | A1
Teller | Teller | тарелка | A1
Apfel | Äpfel | яблоко | A1
Saft | Säfte | сок | A1
Kaffee | Kaffees | кофе | A1
Tee | Tees | чай | A1
Zucker | - | сахар | A1
Reis | - | рис | A1
Salat | Salate | салат | A1
Fisch | Fische | рыба | A1
Hund | Hunde | собака | A1
Vogel | Vögel | птица | A1
Baum | Bäume | дерево | A1
Garten | Gärten | сад | A1
Park | Parks | парк | A1
Platz | Plätze | площадь; место | A1
Weg | Wege | путь, дорога | A1
Bahnhof | Bahnhöfe | вокзал | A1
Flughafen | Flughäfen | аэропорт | A1
Bus | Busse | автобус | A1
Zug | Züge | поезд | A1
Koffer | Koffer | чемодан | A1
Pass | Pässe | паспорт | A1
Schlüssel | Schlüssel | ключ | A1
Computer | Computer | компьютер | A1
Bleistift | Bleistifte | карандаш | A1
Kugelschreiber | Kugelschreiber | шариковая ручка | A1
Brief | Briefe | письмо | A1
Mensch | Menschen | человек | A1
Kopf | Köpfe | голова | A1
Arm | Arme | рука (от плеча) | A1
Fuß | Füße | ступня, нога | A1
Bauch | Bäuche | живот | A1
Mund | Münder | рот | A1
Zahn | Zähne | зуб | A1
Finger | Finger | палец | A1
Mantel | Mäntel | пальто | A1
Rock | Röcke | юбка | A1
Pullover | Pullover | свитер | A1
Schuh | Schuhe | ботинок | A1
Preis | Preise | цена; приз | A1
Markt | Märkte | рынок | A1
Supermarkt | Supermärkte | супермаркет | A1
Beruf | Berufe | профессия | A1
Urlaub | Urlaube | отпуск | A1
Unterricht | - | занятия, уроки | A1
Kurs | Kurse | курс | A1
Satz | Sätze | предложение (фраза) | A1
Text | Texte | текст | A1
Fehler | Fehler | ошибка | A1
Test | Tests | тест | A1
Film | Filme | фильм | A1
Fernseher | Fernseher | телевизор | A1
Sport | - | спорт | A1
Ball | Bälle | мяч | A1
Fußball | - | футбол | A1
Geburtstag | Geburtstage | день рождения | A1
Gast | Gäste | гость | A1
Hunger | - | голод | A1
Durst | - | жажда | A1
Berg | Berge | гора | A1
Wald | Wälder | лес | A1
Strand | Strände | пляж | A1
Balkon | Balkone | балкон | A1
Parkplatz | Parkplätze | парковка | A1
Eingang | Eingänge | вход | A1
Ausgang | Ausgänge | выход | A1
Kalender | Kalender | календарь | A1
Spaß | Späße | удовольствие, веселье | A1

Herd | Herde | плита | A2
Ofen | Öfen | печь | A2
Becher | Becher | кружка, стаканчик | A2
Topf | Töpfe | кастрюля | A2
Wagen | Wagen | машина; вагон | A2
Drucker | Drucker | принтер | A2
Rücken | Rücken | спина | A2
Hals | Hälse | шея, горло | A2
Körper | Körper | тело | A2
Hut | Hüte | шляпа | A2
Stiefel | Stiefel | сапог | A2
Anzug | Anzüge | костюм | A2
Gürtel | Gürtel | ремень | A2
Ring | Ringe | кольцо | A2
Laden | Läden | магазин, лавка | A2
Ausflug | Ausflüge | экскурсия, вылазка | A2
Besuch | Besuche | визит | A2
Schmerz | Schmerzen | боль | A2
Himmel | Himmel | небо | A2
Mond | Monde | луна | A2
Stern | Sterne | звезда | A2
Fluss | Flüsse | река | A2
Stein | Steine | камень | A2
Sand | - | песок | A2
Boden | Böden | пол; почва | A2
Raum | Räume | помещение; пространство | A2
Keller | Keller | подвал | A2
Flur | Flure | коридор | A2
Hof | Höfe | двор | A2
Turm | Türme | башня | A2
Verkehr | - | движение (транспорт) | A2
Unfall | Unfälle | авария | A2
Stau | Staus | пробка (на дороге) | A2
Anfang | Anfänge | начало | A2
Schluss | Schlüsse | конец; вывод | A2
Grund | Gründe | причина | A2
Erfolg | Erfolge | успех | A2
Wunsch | Wünsche | желание | A2
Traum | Träume | сон, мечта | A2
Plan | Pläne | план | A2
Spiegel | Spiegel | зеркало | A2
Sessel | Sessel | кресло | A2
Knopf | Knöpfe | пуговица; кнопка | A2
Akku | Akkus | аккумулятор | A2
Bildschirm | Bildschirme | экран | A2
Ordner | Ordner | папка | A2
Ausweis | Ausweise | удостоверение | A2
Führerschein | Führerscheine | водительские права | A2
Feiertag | Feiertage | праздничный день | A2
Arbeitsplatz | Arbeitsplätze | рабочее место | A2
Bär | Bären | медведь | A2
Wolf | Wölfe | волк | A2
Fuchs | Füchse | лиса | A2
Tiger | Tiger | тигр | A2
Knoblauch | - | чеснок | A2
Pfeffer | - | перец (специя) | A2
Senf | - | горчица | A2
Quark | - | творог | A2
Pilz | Pilze | гриб | A2
Keks | Kekse | печенье | A2
Schinken | Schinken | ветчина | A2
Korb | Körbe | корзина | A2
Rucksack | Rucksäcke | рюкзак | A2
Regenschirm | Regenschirme | зонт | A2
Handschuh | Handschuhe | перчатка | A2
Schal | Schals | шарф | A2
Husten | - | кашель | A2
Schnupfen | - | насморк | A2
Schlaf | - | сон (процесс) | A2
Witz | Witze | анекдот, шутка | A2
Artikel | Artikel | статья; артикль | A2
Kreis | Kreise | круг | A2
Punkt | Punkte | точка; пункт | A2

Zaun | Zäune | забор | B1
Dom | Dome | собор | B1
Hafen | Häfen | порт, гавань | B1
Zweck | Zwecke | цель, назначение | B1
Vorteil | Vorteile | преимущество | B1
Nachteil | Nachteile | недостаток | B1
Krieg | Kriege | война | B1
Frieden | - | мир (не война) | B1
Staat | Staaten | государство | B1
Gewinn | Gewinne | прибыль; выигрыш | B1
Verlust | Verluste | потеря | B1
Lohn | Löhne | заработная плата | B1
Betrag | Beträge | сумма | B1
Antrag | Anträge | заявление | B1
Bericht | Berichte | отчёт, доклад | B1
Beitrag | Beiträge | взнос; статья | B1
Vortrag | Vorträge | доклад, лекция | B1
Begriff | Begriffe | понятие | B1
Zusammenhang | Zusammenhänge | связь, контекст | B1
Zustand | Zustände | состояние | B1
Einfluss | Einflüsse | влияние | B1
Eindruck | Eindrücke | впечатление | B1
Ausdruck | Ausdrücke | выражение | B1
Vorschlag | Vorschläge | предложение (идея) | B1
Versuch | Versuche | попытка; опыт | B1
Bereich | Bereiche | область, сфера | B1
Fortschritt | Fortschritte | прогресс | B1
Aufenthalt | Aufenthalte | пребывание | B1
Abschied | Abschiede | прощание | B1
Ärger | - | досада, неприятности | B1
Zweifel | Zweifel | сомнение | B1
Mut | - | смелость | B1
Geschmack | Geschmäcker | вкус | B1
Geruch | Gerüche | запах | B1
Lärm | - | шум | B1
Schatten | Schatten | тень | B1
Vorhang | Vorhänge | занавеска | B1
Eimer | Eimer | ведро | B1
Kamm | Kämme | расчёска | B1
Pinsel | Pinsel | кисть | B1
Hammer | Hämmer | молоток | B1
Nagel | Nägel | гвоздь; ноготь | B1
Schalter | Schalter | выключатель; окошко (касса) | B1
Stecker | Stecker | штекер, вилка | B1
Lautsprecher | Lautsprecher | динамик | B1
Umschlag | Umschläge | конверт | B1
Stempel | Stempel | печать, штамп | B1
Alltag | - | будни | B1
Lebenslauf | Lebensläufe | резюме | B1
Betrieb | Betriebe | предприятие | B1
Handel | - | торговля | B1
Frosch | Frösche | лягушка | B1
Wurm | Würmer | червь | B1
Hai | Haie | акула | B1
Delfin | Delfine | дельфин | B1
Esel | Esel | осёл | B1
Hahn | Hähne | петух | B1
Igel | Igel | ёж | B1
Kohl | - | капуста | B1
Kürbis | Kürbisse | тыква | B1
Spinat | - | шпинат | B1
Teig | Teige | тесто | B1
Braten | Braten | жаркое | B1
Speck | - | бекон, сало | B1
Deckel | Deckel | крышка | B1
Sack | Säcke | мешок | B1
Schmuck | - | украшения | B1
Puls | - | пульс | B1
Blutdruck | - | кровяное давление | B1
Tod | - | смерть | B1
Sieg | Siege | победа | B1
Roman | Romane | роман | B1
Absatz | Absätze | абзац; каблук | B1
Titel | Titel | заголовок | B1
Inhalt | Inhalte | содержание | B1
Strich | Striche | черта | B1
Pfeil | Pfeile | стрелка | B1
Würfel | Würfel | кубик | B1
Rand | Ränder | край | B1
Gipfel | Gipfel | вершина | B1
Hügel | Hügel | холм | B1
Teich | Teiche | пруд | B1
Ozean | Ozeane | океан | B1
Kontinent | Kontinente | континент | B1
Planet | Planeten | планета | B1
Weltraum | - | космос | B1
Wert | Werte | ценность; значение | B1
Sinn | Sinne | смысл; чувство (зрение и т. п.) | B1

Stier | Stiere | бык | B2
Faden | Fäden | нитка | B2
Draht | Drähte | проволока | B2
Schein | Scheine | купюра; справка | B2
Umstand | Umstände | обстоятельство | B2
Zeitraum | Zeiträume | период | B2
Aufwand | - | затраты (усилий) | B2
Verdacht | - | подозрение | B2
Widerspruch | Widersprüche | противоречие | B2
Rückgang | Rückgänge | спад | B2
Anstieg | Anstiege | рост, подъём | B2
Wettbewerb | Wettbewerbe | конкурс; конкуренция | B2
Stolz | - | гордость | B2
Neid | - | зависть | B2
Hass | - | ненависть | B2
Export | Exporte | экспорт | B2
Krebs | Krebse | рак | B2
Atem | - | дыхание | B2
Rahmen | Rahmen | рамка | B2
Schatz | Schätze | сокровище | B2
Ansatz | Ansätze | подход | B2
Anspruch | Ansprüche | притязание, требование | B2
Beweis | Beweise | доказательство | B2
Verzicht | Verzichte | отказ | B2
Zugang | Zugänge | доступ | B2
Ausgleich | Ausgleiche | компенсация | B2
Überblick | Überblicke | обзор | B2
Vorwurf | Vorwürfe | упрёк | B2
Rückblick | Rückblicke | взгляд в прошлое | B2
Ablauf | Abläufe | ход (процесса) | B2
Verlauf | Verläufe | течение, ход | B2
Kompromiss | Kompromisse | компромисс | B2
Konflikt | Konflikte | конфликт | B2
Prozess | Prozesse | процесс | B2
Kontext | Kontexte | контекст | B2
`;
