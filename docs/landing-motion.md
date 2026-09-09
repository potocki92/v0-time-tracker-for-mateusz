# Landing — architektura ruchu

Strona marketingowa (`app/[locale]/(marketing)`) jest scrollytellingiem: cztery
sekcje reaguja na przewijanie, w tym trzy przyklejone (`ProductJourney`,
`NumbersStory`, `AutomationShowcase`). Ten dokument opisuje, na czym ten ruch
stoi i dlaczego telefon dostaje inny profil niz desktop.

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
9. **Mierz przed i po.** Zadna z powyzszych regul nie powstala z intuicji.

Reguly 1-6 pilnuje `__test__/landing/motion.test.ts`.

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
