# Landing — architektura ruchu

Strona marketingowa (`app/[locale]/(marketing)`) jest scrollytellingiem: cztery
sekcje reaguja na przewijanie, w tym trzy przyklejone (`ProductJourney`,
`NumbersStory`, `AutomationShowcase`) i `HeroScene`, ktora oddaje ekran w gore.
Ten dokument opisuje, na czym ten ruch stoi i dlaczego telefon dostaje inny
profil niz desktop.

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
| `ProductJourney` | 5 ekranow na sobie, scroll prowadzi `transform` kazdej warstwy (`opacity` tylko narracji) | scroll wyznacza **indeks sceny**; w DOM 1 ekran (2 na czas przejscia), wjazd 180 ms na CSS |
| `MonthGrid` | wypelnianie **dzien po dniu** — 60 wartosci | wypelnianie **tygodniami** — 5 wartosci |
| `Navbar` | `backdrop-blur-md` po przewinieciu | bez `backdrop-filter`; mocniejsze tlo `rgba(0,0,0,0.92)` |
| `lp-device` | `box-shadow` 120 px | bez cienia |

### Mobilny `ProductJourney`

Scroll → `resolveSceneIndex(progress, 5, current)` → indeks. Funkcja jest czysta
i przetestowana (`__test__/landing/active-scene.test.ts`); ma **histereze**
(`SCENE_DEAD_ZONE`), zeby drgnienie palca na granicy nie przerzucalo ekranu tam
i z powrotem.

`setState` wola sie cztery razy na cala sekcje — w chwili faktycznej zmiany
sceny, nie raz na klatke.

Przejscie robi CSS (`.lp-scene-slide` i `.lp-scene-switch` + `@starting-style`),
a nie Motion: przegladarka dostaje wylacznie wlasciwosci kompozytowalne i zaden
JavaScript nie liczy tu klatek. Zasada jest ta sama, co na desktopie — ekran
wjezdza, narracja zmienia sie sekwencyjnie (sekcja 7).

### Dlaczego telefon nie moze zostac na wariancie desktopowym

Piec zamontowanych replik aplikacji to piec drzew utrzymywanych w kompozycji
przez cala sekcje — na telefonie sam ich rozmiar zjada budzet klatki. To jedyny
powod, ktory zostal: samo **przejscie** oba warianty robia dzis tak samo (patrz
sekcja 7), wiec czarnej klatki nie ma juz zaden z nich.

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
`__test__/landing/scene-motion.test.ts`.

---

## 6. Mierzenie

Metryki, ktore cos znacza dla plynnosci przewijania, w kolejnosci waznosci:

| metryka | jak | dobry wynik |
|---|---|---|
| zapisy stylu na przewiniecie | `MutationObserver` na `attributeFilter: ['style']` | pojedyncze sztuki |
| elementy zmieniajace styl | `Set` celow tego samego obserwatora | jednocyfrowa |
| animacje sterowane scrollem | `document.getAnimations().filter(a => a.timeline !== document.timeline)` | im wiecej tym lepiej — to te, ktore zeszly z main threadu |
| ekrany w DOM | `#product .lp-screens > *` | 5 desktop / 1-2 telefon |
| odslonieta ramka miedzy scenami | suma mnogosciowa pasow `translateX` warstw widocznych, dzielona przez szerokosc ramki | **1,000** na kazdym punkcie toru |
| dwa interfejsy naraz | `opacity` warstw ekranu wzdluz toru | **zawsze 1** — ekran nie animuje jasnosci |

Sam `ScriptDuration` wprowadza w blad: profil CPU sekcji `#product` pokazuje, ze
okolo 70 procent czasu to `(program)`, czyli uklad i malowanie przegladarki, a
nie JavaScript.

---

## 7. `ProductJourney` — sceny 01-05

Sekcja `#product` pokazuje piec scen na JEDNYM, nieruchomym interfejsie: chrome
aplikacji renderuje sie raz, a przewijanie zmienia tylko warstwe tresci,
podswietlenie w sidebarze i breadcrumb. Timeline stoi w `useSceneLayer`
(`motion/scene.ts`), a cala jego arytmetyka — w czystej funkcji
`sceneKeyframes`.

### Dwa przejscia, ktore tu NIE dzialaja

| | co robi | dlaczego odpada |
|---|---|---|
| rozdzielone okna (`useLayerFade`) | scena gasnie do zera tam, gdzie nastepna zaczyna sie pojawiac | miedzy scenami jest punkt, w ktorym OBIE warstwy maja `opacity` 0. Zmierzone: 52 z 201 punktow ponizej progu widocznosci, **minimum 0** — pusta ramka aplikacji |
| przenikanie (okna nasuniete) | obie warstwy zmieniaja `opacity` w tym samym oknie | pustego punktu nie ma, ale w polowie przejscia widac OBA ekrany naraz. Na zrzucie 1440x900: siatka kalendarza i tabela projektow jedna przez druga — na gestym UI czyta sie to jak blad renderowania |

Przenikania nie da sie uratowac zmiana krzywych. Nawet gdy warstwa wchodzaca
niesie nieprzezroczyste tlo i jasnosc zlozenia wynosi rowno 1 na calym torze
(sprawdzone w przegladarce), w polowie przejscia nadal widac dwa interfejsy —
bo tym wlasnie JEST przenikanie.

### Co dziala: ekran WCHODZI

Warstwa ekranu niesie nieprzezroczyste tlo powierzchni (`--lp-s1`) i wjezdza z
prawej na poprzednia, ktora cofa sie o 18% w glab. Przycina je `overflow-clip`
na `.lp-screens`, czyli na kontenerze warstw — nie na wyzszym elemencie z
paddingiem, bo warstwa musi miec DOKLADNIE rozmiar swojego pola przyciecia.

Szczelnosc jest wlasnoscia geometrii, nie doborem liczb. W kazdym punkcie
przejscia lewa krawedz ekranu wchodzacego stoi na `SCREEN_IN · (1 − t)`, a
prawa krawedz schodzacego na `100 − SCREEN_OUT · t`. Przy `SCREEN_OUT (18) <
SCREEN_IN (100)` ta druga jest zawsze na prawo od pierwszej, wiec **miedzy
ekranami nie ma ani jednej klatki z odslonieta ramka** — i nie ma ani jednej z
dwoma ekranami naraz, bo `opacity` ekranu nie zmienia sie nigdy.

Kierunek bierze sie z jednej, MONOTONICZNEJ krzywej, wiec przewijanie w gore to
ten sam ruch odtworzony wstecz. Nie ma osobnej krzywej wejscia i wyjscia do
zestrojenia.

### Narracja i breadcrumb ida inaczej, i to celowo

Tekst nie ma prawa przenikac przez tekst: dwa akapity po 50% to nie przenikanie
filmowe, tylko dwie nieczytelne warstwy liter. Copy dostaje wiec przejscie
**sekwencyjne** — stara mysl gasnie na poczatku przejscia, nowa zapala sie na
jego koncu, z przerwa rowna 10% przejscia (na torze desktopu okolo 34 px
przewijania). Przerwa nie boli, bo ramka obok jest w tym czasie pelna: „brak
tekstu przez chwile" to nie to samo, co „czarny ekran".

Podswietlenie sekcji w sidebarze ma trzecia krzywa (`spotlight`) — zapala sie
na wejsciu sceny, gasnie na wejsciu nastepnej. Nie moze isc pozycja ekranu, bo
ta jest monotoniczna: sidebar zapalalby sie narastajaco i na koncu toru
swiecilaby cala nawigacja.

### Timeline

Zero recznie dobranych okien: wszystko liczy sie z indeksu sceny, wiec szosta
scena nie wymaga przestrajania pozostalych pieciu.

| | |
|---|---|
| takt sceny | `1/n` toru (przy pieciu scenach: 0,20) |
| przejscie | `SWAP` = 0,09 toru, symetrycznie wokol granicy `i/n` |
| krzywa | `smoothstep` (3t² − 2t³) w pieciu klatkach |
| ekran | `translateX` 100% → 0 (wchodzacy), 0 → −18% (schodzacy) |
| narracja | `opacity` 0 → 1 i `translateY` 14 px → 0, w 45% przejscia |

Na torze 520svh (desktop) `SWAP` to okolo 38svh przewijania — 2-3 klikniecia
kolka. Warunek na wartosc: `SWAP < 1/n`, inaczej okna sasiadow zachodza na
siebie i `useTransform` dostaje niemonotoniczny zakres wejsciowy.

**Krzywej nie podajemy jako `ease`.** Motion akceleruje sprzetowo wylacznie pare
tablic (sekcja 2), wiec latwiejsze wejscie i wyjscie robimy dodatkowymi
klatkami. Piec punktow wystarcza: miedzy nimi zostaje odcinek prosty, a
maksymalny blad wzgledem prawdziwego `smoothstep` to okolo 0,02.

### `visibility` — jedyna wartosc, ktora zostaje w JS

Nie jest wlasciwoscia akcelerowalna, wiec liczy ja main thread. Kosztuje tyle,
co jej zmiany — a zmienia sie dwa razy na scene, nie raz na klatke. Bez niej
ekran przykryty przez nastepny nadal malowalby sie pod spodem, a wygaszony
akapit nadal czytalby czytnik ekranu.

Konce zakresu widocznosci skrajnych scen sa **nieskonczone**, a nie zaciete na 0
i 1: postep potrafi wyjsc poza tor (bounce Safari, `scrollRestoration`), a
pierwsza i ostatnia scena nie maja wtedy prawa zniknac.

### Telefon: ta sama zasada, inny silnik

Wariant mobilny nie prowadzi warstw scrollem — trzyma w DOM aktywna scene (i
przez 180 ms poprzednia) i przelacza je atrybutem. Zasade realizuje `landing.css`:

| | |
|---|---|
| `.lp-scene-slide` | ekran: `translateX` 100% → 0, schodzacy → −18% |
| `.lp-scene-switch` | narracja: 90 ms na zgaszenie starej, 90 ms na zapalenie nowej |
| kto lezy wyzej | `z-index` na `[data-active='true']`, a **nie** kolejnosc w DOM |
| kierunek | `data-back` z `previous > active` |

`z-index` jest konieczny, bo warstwy montuja sie rosnaco po indeksie — przy
powrocie „wstecz" schodzaca scena lezalaby wyzej. `data-back` odwraca kierunek
wjazdu, inaczej cofniecie wygladaloby jak kolejne wejscie w przod.

### Zmierzone w przegladarce

Chromium, `/pl`, 81 punktow pomiarowych na torze:

| | desktop 1440x900 | telefon 393x852 |
|---|---|---|
| pokrycie ramki | **1,000** na kazdym punkcie | 1,000 wstecz, 0,997 w przod |
| `opacity` ekranu | 1 zawsze | 1 zawsze |
| ekrany malowane naraz | 1-2 | 1-2 |
| akapity widoczne naraz | 0-1 | 0-1 |
| suma podswietlen sidebara | 1,000 | — |
| animacje poza main threadem | 104 | — |

Te 0,997 na telefonie to jedna klatka na wejsciu w przod (okolo piksela):
warstwa wchodzaca rusza o klatke pozniej niz schodzaca, bo `@starting-style`
potrzebuje jednego przeliczenia stylu. Proba wyrownania tego opoznieniem 16 ms
na warstwie schodzacej pogarsza wynik do 0,983 — nie ma czego wyrownywac.

### Pulapka: tor trzeba domknac jawnie

Klatki kazdej krzywej siegaja **0 i 1**, nawet jesli okno sceny konczy sie na
0,245. Buduje je `closeTrack`.

Powod jest twardy: kiedy Motion odda wartosc przegladarce, lista klatek staje
sie zwyklym `KeyframeEffect`, a WAAPI **dopisuje neutralna klatke o wartosci
wyjsciowej elementu**, jesli skrajna nie stoi na offsecie 0 albo 1. Warstwa
wracalaby wtedy do stanu poczatkowego dokladnie wtedy, gdy uzytkownik na nia
patrzy.

### `prefers-reduced-motion`

`ProductJourney` oddaje wtedy `JourneyStatic`: piec scen jedna pod druga, kazda
z wlasnym interfejsem. Drugi bezpiecznik stoi w CSS — `.lp-layer`,
`.lp-scene-switch` i `.lp-scene-slide` dostaja `opacity: 1 !important`,
`visibility: visible !important` i `transform: none !important`.

### Jak dodac szosta scene

1. Dopisz wpis do `SCENES` w `ProductJourney.tsx` (indeks, segment,
   `highlights`, `copyKey`).
2. Dodaj szoste wywolanie `useSceneLayer` — hooki musza byc bezwarunkowe, wiec
   sa wypisane jawnie. **Okien nie przeliczasz**: timeline liczy sie z indeksu.
3. Dodaj ekran w `product/screens/` i galaz w `screenFor`.
4. Uzupelnij `marketing.journey.scenes.<klucz>` w trzech jezykach.
5. Przejedz `__test__/landing/scene-motion.test.ts` — sprawdza pokrycie ramki na
   calym torze, monotonicznosc, sume podswietlen i domkniecie klatek.

### Czego w tej sekcji nie wolno animowac

`width`, `height`, `top`, `margin`, `padding` — patrz sekcja 5. Nie wolno tez
animowac `opacity` EKRANU (to natychmiast wraca kalka dwoch interfejsow) ani
zdejmowac warstwie nieprzezroczystego tla.
