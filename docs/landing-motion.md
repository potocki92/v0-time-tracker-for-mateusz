# Landing — architektura ruchu

Strona marketingowa (`app/[locale]/(marketing)`) jest scrollytellingiem: piec
sekcji reaguje na przewijanie, w tym trzy przyklejone (`ProductJourney`,
`NumbersStory`, `AutomationShowcase`) i jedna nieprzyklejona
(`CapabilityCards`, sekcja 7). Ten dokument opisuje, na czym ten ruch stoi i
dlaczego telefon dostaje inny profil niz desktop.

Jesli szukasz konkretnego uzasadnienia liczbowego — stoi w komentarzu przy kodzie.
Tutaj jest mapa.

---

## 1. Biblioteka

| | |
|---|---|
| Pakiet | `framer-motion` **13.2.0** |
| Wejscie | `import { m, useScroll, useTransform } from 'framer-motion'` |
| Shell | `components/common/motion-provider.tsx` — `LazyMotion strict` + `MotionConfig reducedMotion="user"` |
| Zasieg | wylacznie poddrzewo landingu i formularzy; **nigdy** root layout |

### Dlaczego nie `motion/react`

Pakiet `motion` to ta sama biblioteka: jego `./react` jest dokladnie
`export * from 'framer-motion'`. Ten jeden przeskok przez re-eksport wystarcza
jednak, zeby webpack Nexta przestal shakowac graf: leniwy chunk `LazyMotion`
przestaje byc leniwy i `domMax` razem z projekcja laduje w pierwszym ladowaniu
**kazdej** trasy uzywajacej Motion.

Zmierzone na tym repo (First Load JS, gzip):

| trasa | `framer-motion` | `motion/react` |
|---|---|---|
| `(marketing)` | 179,7 kB | 224,3 kB |
| `auth/login` | 173,5 kB | 221,8 kB |
| `(app)/clients` | 361,1 kB | 409,4 kB |

`experimental.optimizePackageImports` tego nie naprawia (sprawdzone).
Migracja dotyczyla wiec **wersji**, nie nazwy pakietu.

### Dlaczego wersja ma znaczenie

Sceny uzywaja `useScroll({ target })`. Do 12.38 Motion budowal `ViewTimeline`
w chwili, gdy `ref.current` byl jeszcze pusty, wpadal wtedy na `ScrollTimeline`
calego dokumentu i **cache'owal go na stale**. Postep liczyl sie wzgledem
strony, nie wzgledem toru sceny: pierwsza warstwa nigdy nie gasla, dwie sceny
zostawaly widoczne naraz.

Motion **12.39** naprawil to wprost — _„useScroll: Fix hardware acceleration
when tracking an element"_ oraz _„Support hydrating target and container refs
from anywhere in the tree"_. Przypiecie timeline'u czeka teraz na hydratacje
refa. Dopiero to pozwolilo usunac obejscie opisane nizej.

---

## 2. Akceleracja sprzetowa

Motion oddaje wartosc sterowana scrollem przegladarce (`ScrollTimeline` /
`ViewTimeline` + Web Animations API) tylko wtedy, gdy spelnione sa **wszystkie**
warunki:

1. zrodlem jest `scrollXProgress` / `scrollYProgress` z `useScroll`,
2. `useTransform` dostal **pare tablic**, nie funkcje,
3. klucz stylu jest na liscie akcelerowalnych: `opacity`, `transform`,
   `filter`, `clipPath`, `backgroundColor`,
4. `offset` da sie zmapowac na nazwany zakres `ViewTimeline`.

Wtedy `bindToMotionValue` **nie subskrybuje** zmian wartosci: styl prowadzi
natywna animacja, a main thread nie robi w klatce przewijania nic. Safari od
26.4 liczy takie animacje na osobnym watku.

### Konsekwencja: transform jako jeden string

Skladowe transformu (`y`, `scale`, `rotateX`) **nie sa** akcelerowalne — Motion
musi je najpierw skleic w JS, wiec kazda z nich placi zapisem stylu w kazdej
klatce. Dlatego sceny skladaja caly transform samodzielnie:

```ts
// zle — trzy zapisy stylu na klatke
style={{ y: shift, scale: zoom, rotateX: tilt }}

// dobrze — jedna animacja na kompozytorze
const transform = useScrollTransform(progress, [0, 1], [
  'translateY(0px) scale(0.94) rotateX(12deg)',
  'translateY(-70px) scale(1.06) rotateX(0deg)',
])
style={{ transform }}
```

Warunek: **kazdy keyframe musi miec identyczna strukture** — te same funkcje CSS
w tej samej kolejnosci. Inaczej przegladarka nie ma czego interpolowac.

### Co zostalo w JS

`visibility` warstwy sceny (nie jest wlasciwoscia akcelerowalna) oraz tlo i obrys
navbara (jada z `scrollY`, ktory nie ma `accelerate`). Obie zmieniaja sie kilka
razy na wizyte, nie raz na klatke.

### Czego juz NIE MA: `useScrollMap`

Do wersji 12.38 w `motion/scene.ts` stal helper, ktory podawal Motion gotowa
funkcje zamiast pary tablic — **wylacznie po to, zeby zablokowac sciezke
akcelerowana** i obejsc blad opisany wyzej. Po migracji na 13.2.0 stracil powod
istnienia i zostal usuniety. Sceny wrocily na standardowe
`useTransform(source, inputRange, outputRange)`.

---

## 3. Profil ruchu: telefon vs desktop

Jedno zrodlo decyzji: `_landing/motion/profile.ts`.

```ts
const profile = useMotionProfile() // 'mobile' | 'desktop', prog 1024 px
const reduce = usePrefersReducedMotion()
```

Oba hooki stoja na `useSyncExternalStore`, a ich snapshot serwerowy to
odpowiednio `'mobile'` i `false`. Dzieki temu **HTML z serwera zgadza sie z
pierwszym renderem klienta** i nie ma bledu hydratacji; prawdziwa wartosc
przychodzi zaraz po hydratacji.

> `useReducedMotion` z Motion czyta media query juz w pierwszym renderze
> (`useState(prefersReducedMotion.current)`), wiec u osob z ograniczonym ruchem
> rozjezdzal hydratacje (React #418). Nie uzywamy go w landingu.

**Od profilu nie moze zalezec zaden rozmiar.** Wysokosci torow przewijania stoja
w `landing.css` pod media query — przelaczenie profilu po hydratacji nie
przesuwa ani jednego piksela.

### Roznice

| sekcja | desktop | telefon |
|---|---|---|
| `HeroScene` | `rotateX 12°→0°`, `scale 0.94→1.06`, `y 0→-70`, `perspective: 1600px` | bez `rotateX` i bez `perspective`; `scale 0.98→1.02`, `y 0→-24` |
| `ProductJourney` | 5 ekranow na sobie, scroll prowadzi `opacity` i `transform` kazdej warstwy | scroll wyznacza **indeks sceny**; w DOM 1 ekran (2 na czas przejscia), crossfade 180 ms na CSS |
| `MonthGrid` | wypelnianie **dzien po dniu** — 60 wartosci | wypelnianie **tygodniami** — 5 wartosci |
| `Navbar` | `backdrop-blur-md` po przewinieciu | bez `backdrop-filter`; mocniejsze tlo `rgba(0,0,0,0.92)` |
| `lp-device` | `box-shadow` 120 px | bez cienia |
| `CapabilityCards` | bento 7+5 / 4+4+4, 5 ramek + 20 wartosci tresci | jedna kolumna, 5 ramek, tresc nieruchoma |

### Mobilny `ProductJourney`

Scroll → `resolveSceneIndex(progress, 5, current)` → indeks. Funkcja jest czysta
i przetestowana (`__test__/landing/active-scene.test.ts`); ma **histereze**
(`SCENE_DEAD_ZONE`), zeby drgnienie palca na granicy nie przerzucalo ekranu tam
i z powrotem.

`setState` wola sie cztery razy na cala sekcje — w chwili faktycznej zmiany
sceny, nie raz na klatke.

Przejscie robi CSS (`.lp-scene-switch` + `@starting-style`), a nie Motion:
przegladarka dostaje dwie wlasciwosci kompozytowalne i zaden JavaScript nie
liczy tu klatek.

### Dlaczego telefon nie moze zostac na wariancie desktopowym

Poza kosztem pieciu zamontowanych replik aplikacji: `useLayerFade` ma **celowo
rozdzielone** okna widocznosci, wiec miedzy scenami istnieje punkt, w ktorym
obie warstwy maja `opacity` 0. Zmierzone na torze `ProductJourney`: 52 z 201
punktow pomiarowych ponizej progu widocznosci, minimum **0** — czyli calkowicie
czarna klatka. Na desktopie to kilkanascie pikseli dlugiego toru. Na telefonie
jeden flick potrafi wyladowac dokladnie w nim.

Wariant mobilny ma tego punktu zero (`minTotalOpacity = 1`).

---

## 4. `prefers-reduced-motion`

Dwa niezalezne bezpieczniki:

1. **CSS** (`landing.css`, blok `@media (prefers-reduced-motion: reduce)`) —
   tory traca sztuczna wysokosc, `sticky` staje sie `static`, warstwy ida w
   normalny przeplyw z `opacity: 1 !important` i `visibility: visible !important`.
   `!important` bije zarowno style inline, jak i animacje WAAPI (w kaskadzie
   animacje leza **ponizej** waznych deklaracji autora).
2. **DOM** — `ProductJourney` oddaje `JourneyStatic`: piec scen jedna pod druga,
   kazda z wlasnym interfejsem. Pieciu nalozonych warstw w jednej ramce nie da
   sie rozsunac sama zmiana CSS.

Wymog: osoba z ograniczonym ruchem dostaje **cala tresc**, normalny przeplyw,
zero sticky i zero elementow niedostepnych przez `visibility`.

---

## 5. Zasady wydajnosci

1. **Nie animuj wlasciwosci ukladu podczas przewijania.** `width`, `height`,
   `top`, `margin` to przeliczanie ukladu w kazdej klatce. Zostaja `transform`
   i `opacity`.
2. **Podawaj `transform` jako jeden string.** Skladowe (`y`, `scale`, `rotate`)
   nie sa akcelerowalne — patrz sekcja 2.
3. **Nie tworz dziesiatek `useTransform` na elementach listy.** Jedna wartosc na
   grupe wystarcza; `MonthGrid` animuje na telefonie tygodniami, nie dniami.
4. **Nie przenos postepu przewijania do stanu Reacta.** `useState` wolno uzyc na
   rzadkie zmiany (indeks sceny: cztery na sekcje), nigdy na sam postep.
5. **Nie uzywaj `backdrop-filter` na duzych i przyklejonych warstwach telefonu.**
   Na elemencie `fixed` kaze rozmyc tlo od nowa w kazdej klatce przewijania.
6. **Nie rozsiewaj `will-change`.** Kazdy to osobna warstwa kompozycji;
   kilkanascie kosztuje wiecej, niz oszczedza. Dodawaj tylko po pomiarze.
7. **Nie dodawaj Lenis ani zadnego silnika smooth-scroll.** Natywny scroll iOS
   zyje na osobnym watku; kazdy silnik w JS przenosi go z powrotem na main
   thread — czyli robi dokladnie to, czego ta architektura unika.
8. **Nie dodawaj drugiego silnika animacji (GSAP / ScrollTrigger) bez pomiaru.**
   Projekt ma Motion i natywne `ScrollTimeline`.
9. **Domykaj tor klatkami na 0 i 1.** Inaczej WAAPI dopisuje wlasna klatke
   neutralna i wartosc wraca do stanu wyjsciowego po ostatnim keyframie —
   szczegoly w sekcji 7.
10. **Mierz przed i po.** Zadna z powyzszych regul nie powstala z intuicji.

Reguly 1-6 pilnuje `__test__/landing/motion.test.ts`, a 9 —
`__test__/landing/capability-motion.test.ts`.

---

## 6. Mierzenie

Metryki, ktore cos znacza dla plynnosci przewijania, w kolejnosci waznosci:

| metryka | jak | dobry wynik |
|---|---|---|
| zapisy stylu na przewiniecie | `MutationObserver` na `attributeFilter: ['style']` | pojedyncze sztuki |
| elementy zmieniajace styl | `Set` celow tego samego obserwatora | jednocyfrowa |
| animacje sterowane scrollem | `document.getAnimations().filter(a => a.timeline !== document.timeline)` | im wiecej tym lepiej — to te, ktore zeszly z main threadu |
| ekrany w DOM | `#product .lp-screens > *` | 5 desktop / 1-2 telefon |
| czarna klatka miedzy scenami | suma `opacity` widocznych warstw wzdluz toru | nigdy ponizej ~0,9 |

Sam `ScriptDuration` wprowadza w blad: profil CPU sekcji `#product` pokazuje, ze
okolo 70 procent czasu to `(program)`, czyli uklad i malowanie przegladarki, a
nie JavaScript.

---

## 7. `CapabilityCards` — piec kart na jednym postepie

Sekcja `#capabilities` (`_landing/sections/capabilities/`) pokazuje piec
mozliwosci produktu: tracker, kalendarz, faktury, raporty i wymiana danych.
Cala jej mechanika stoi w `_landing/motion/capability.ts`.

### Czym rozni sie od pozostalych scen

Trzy starsze sceny stoja na **przyklejonym torze**: strona zatrzymuje sie, a
scena gra na miejscu. Ta sekcja **nie zatrzymuje niczego** — karty leza w
normalnym przeplywie i skladaja sie w miare, jak wjezdzaja na ekran.

To swiadoma roznica. Przyklejenie piatki kart wymagaloby albo zmieszczenia ich
wszystkich na jednym ekranie telefonu (nie mieszcza sie — same karty maja
~1500 px), albo drugiego mechanizmu „jedna karta naraz", czyli przepisania
sekcji na `ProductJourney`. Wspolne z tamtymi scenami zostaje wszystko, co
decyduje o wrazeniu i o koszcie: **jedno** zrodlo postepu na cala sekcje, zero
listenerow `scroll`, zero postepu w stanie Reacta, `opacity` i gotowy
`transform` jako jedyne animowane wlasciwosci.

### Skad bierze sie postep

```ts
const progress = useEntryProgress(gridRef) // offset ['start end', 'end end']
```

`useEntryProgress` (`motion/scene.ts`) mierzy **siatke kart**, nie cala sekcje.
Droga miedzy jego koncami to dokladnie wysokosc siatki, wiec **wysokosc okna
nie wchodzi do wzoru** i `p` ma czytelne znaczenie geometryczne:

> `p` to ulamek siatki, ktory zdazyl przejsc nad dolna krawedzia ekranu.

Karta lezaca na glebokosci `f` staje sie widoczna dokladnie przy `p = f` — na
kazdym telefonie i na kazdym monitorze tak samo. Dzieki temu okna czasowe kart
czyta sie **jak pozycje w ukladzie**, a nie jak liczby dobrane na oko.

`useTrackProgress` by tego nie dal: jego `['start start', 'end end']` opisuje
tor przyklejonej sceny, gdzie zero wypada dopiero wtedy, gdy gora sekcji
dojedzie do gory ekranu — czyli gdy pierwsza karta jest juz dawno widoczna.

### Timeline

Jedno miejsce z liczbami: tablica `ENTER` w `motion/capability.ts`. Kazdy wpis
to `[poczatek wejscia, koniec wejscia]` w ulamku wysokosci siatki.

| karta | desktop (>= 1024 px) | telefon |
|---|---|---|
| tracker | 0,00 → 0,30 | 0,00 → 0,14 |
| kalendarz | 0,05 → 0,35 | 0,22 → 0,35 |
| faktury | 0,49 → 0,79 | 0,42 → 0,58 |
| raporty | 0,54 → 0,84 | 0,68 → 0,79 |
| wymiana | 0,59 → 0,89 | 0,85 → 0,96 |

Wartosci pochodza z **pomiaru** siatki w Chromium (1280x720, 1440x900,
390x844, 393x852, 430x932; jezyk polski, bo ma najdluzsze copy). Zmierzone
glebokosci kart stoja w komentarzu przy `ENTER`.

**Desktop ma DWA takty, nie piec.** Bento uklada karty w dwa wiersze (7+5 /
4+4+4), a karty jednego wiersza maja te sama glebokosc — nie da sie ich
rozsunac w czasie inaczej niz o kilka procent. Rozsuniecie „dla efektu"
znaczyloby animowanie karty, ktora stoi na ekranie od sekundy, czyli dokladnie
te „animacje doganiajaca scroll", ktorej ta sekcja ma nie miec. Pieciu
osobnych taktow dorabia sie dopiero uklad jednokolumnowy, czyli telefon.

### Charakter ruchu

| | |
|---|---|
| wejscie karty | `opacity` 0,30 → 1, `translateY` 22 px → 0, `scale` 0,978 → 1 |
| po takcie | `opacity` przygasa do 0,90 i **tam zostaje** |
| tresc karty | to samo, ale pasmo przesuniete o 35% dlugosci okna i `translateY` 6-10 px |
| slupek raportu | `scaleY(0) → scaleY(1)`, `transform-origin: bottom` |
| poswiata trackera | `translateY` -18 → 18 px na caly tor, tylko desktop |

Karta **nigdy nie schodzi do zera**. Po pierwsze dlatego, ze ma sie wylaniac, a
nie wskakiwac. Po drugie — i wazniejsze — bo dzieki temu zadna klatka toru nie
jest niewidoczna: takze przed hydratacja i takze gdyby JavaScript nigdy nie
wystartowal.

Przygaszanie do 0,90 ma granice od kontrastu: najsciemniejszy tekst w karcie to
`--lp-ink-2` (0,62 alfy na czerni), czyli po przygasnieciu 0,558 — nadal nad
progiem 0,50, ponizej ktorego 11-pikselowy tekst przestaje spelniac WCAG AA.
Dlatego karty uzywaja `lp-cap-label` (`--lp-ink-2`), a nie `lp-eyebrow`
(`--lp-ink-3`, 0,50 alfy).

### Pulapka: tor trzeba domknac jawnie

Klatki kazdej krzywej sieegaja **0 i 1**, nawet jesli okno karty konczy sie na
0,35. Buduje je `holdOutside`.

Powod jest twardy: kiedy Motion odda wartosc przegladarce, lista klatek staje
sie zwyklym `KeyframeEffect`, a WAAPI **dopisuje neutralna klatke o wartosci
wyjsciowej elementu**, jesli skrajna klatka nie stoi na offsecie 0 albo 1.
Zmierzone w Chromium na tej sekcji przed poprawka: karta „Faktury" osiagala
0,99 przy `p = 0,80` i wracala do 0,30 przy `p = 1,00` — gasla dokladnie
wtedy, gdy uzytkownik na nia patrzyl.

Sceny przyklejone tego nie widza, bo przy `p = 1` sa juz za ekranem. Sekcja,
ktora **zostaje na ekranie**, musi domknac tor sama.

### Desktop kontra telefon

| | desktop | telefon |
|---|---|---|
| siatka | bento 7+5 / 4+4+4 | jedna kolumna |
| takty | 2 wiersze + przesuniecie 0,05 w wierszu | 5 osobnych |
| ramki kart na scrollu | 5 | 5 |
| tresc kart na scrollu | 20 wartosci (panel, 5 tygodni, 3 faktury, 6 slupkow, 5 chipow) | **0** |
| poswiata trackera | parallaksa | nieruchoma |

Ponizej `lg` siatka ma jedna kolumne takze na tablecie. To nie jest tylko
zwezenie ukladu: uklad dwukolumnowy w pasmie 640-1023 px dawalby trzy wiersze,
czyli TRZECI timeline do wystrojenia przy dwoch profilach ruchu.

Na telefonie scroll prowadzi wylacznie **ramki** kart — piec wartosci na cala
sekcje. Tresc w srodku stoi gotowa. Powod jest ten sam, dla ktorego `MonthGrid`
animuje tam tygodniami zamiast dniami: druga, zagniezdzona animacja pod palcem
na ekranie o szerokosci 390 px nie dodaje informacji, a mnozy zapisy stylu w
klatce przewijania.

Wariant wybiera sie **komponentem** (`{reveal ? <XReveal /> : <X />}`), nie
warunkiem w hooku — liczba hookow nie moze zalezec od profilu. Ten sam wzorzec
co `DayCellReveal` / `DayCell` w `MonthGrid`.

### `prefers-reduced-motion`

Bez drugiego systemu: kazdy element sterowany scrollem nosi `lp-motion`, a
`landing.css` daje mu w bloku `reduce` `opacity: 1 !important` i `transform:
none !important`. Slupki wracaja przez to do pelnej wysokosci (`--lp-bar` nigdy
nie animuje), a karty do pelnej jasnosci.

Dwa ruchy tej sekcji nie ida z Motion, wiec maja wlasne wylaczniki w tym samym
bloku: mikroskala hovera (`.lp-capability`) i pulsowanie kropki „mierze czas"
(`.lp-cap-dot-live`). Licznik trackera startuje wtedy **zatrzymany** — tresc
zostaje w calosci, a przycisk startu dziala (WCAG 2.2.2).

Dodatkowo sekcja nie MONTUJE wtedy wartosci sterujacych trescia:
`reveal = profile === 'desktop' && !reduceMotion`. CSS i tak by je zneutralizowal,
ale przeliczalyby sie w kazdej klatce — praca za nic dokladnie u osoby, ktora
poprosila o jej mniej.

### Jak dodac szosta karte

1. Dopisz klucz do `CAPABILITY_KEYS` (kolejnosc = kolejnosc opowiesci).
2. Dopisz jej okno w OBU profilach w `ENTER` i **przelicz sasiadow** — okna sa
   pozycjami w ukladzie, wiec nowy wiersz przesuwa wszystko pod soba.
3. Dodaj komponent karty w `sections/capabilities/cards/` z wariantem
   statycznym i wariantem `Reveal`.
4. Uzupelnij `marketing.capabilities.cards.<klucz>` w trzech jezykach.
5. Przejedz `__test__/landing/capabilities.test.ts` i
   `capability-motion.test.ts` — sprawdzaja liczbe kart, kolejnosc, zakresy
   klatek i to, ze zaden punkt toru nie chowa karty.

### Czego w tej sekcji nie wolno animowac

`height` slupka (jest stala, w `--lp-bar`), `width`, `top`, `margin`,
`padding`. Hover nie moze przesuwac karty — scroll jest tu glowna osia ruchu,
hover ma byc potwierdzeniem, ze karta zyje (skala 1,008, wylacznie pod
`(hover: hover) and (pointer: fine)`).
