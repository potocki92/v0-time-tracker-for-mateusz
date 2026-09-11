'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { m, useMotionValueEvent, type MotionValue } from 'framer-motion'

import { useTranslations } from 'next-intl'

import type { WorkspaceSegment } from '@/lib/workspace/sections'

import type { DemoMonth } from '../demo/demo-data'
import { resolveSceneIndex } from '../motion/active-scene'
import { useMotionProfile, usePrefersReducedMotion } from '../motion/profile'
import { useSceneLayer, useTrackProgress } from '../motion/scene'
import { AppFrame } from '../product/AppFrame'
import { MARKETING_SECTIONS } from '../product/nav'
import { CalendarScreen } from '../product/screens/CalendarScreen'
import { DashboardScreen } from '../product/screens/DashboardScreen'
import { InvoiceScreen } from '../product/screens/InvoiceScreen'
import { ProjectsScreen } from '../product/screens/ProjectsScreen'
import { ReportsScreen } from '../product/screens/ReportsScreen'

/**
 * Sticky product journey — piec scen na jednym, nieruchomym interfejsie.
 *
 * Chrome (sidebar, naglowek, dolny pasek) renderuje sie RAZ i nie znika
 * miedzy scenami; przewijanie zmienia wylacznie warstwe tresci, podswietlona
 * pozycje w sidebarze i breadcrumb. Dzieki temu przejscie Pulpit → Kalendarz
 * czyta sie jak nawigacja w aplikacji, a nie jak przelaczanie zrzutow ekranu.
 *
 * ── Trzy warianty, jeden uklad ──
 *
 * `JourneyDesktop` — pelny scrollytelling. Piec ekranow lezy na sobie, scroll
 * prowadzi `opacity` i `transform` kazdej warstwy. Kosztuje piec zamontowanych
 * drzew i kilkanascie wartosci sterowanych scrollem; na desktopie to sie
 * oplaca, bo tor jest dlugi i efekt jest bohaterem strony.
 *
 * `JourneyMobile` — ten sam uklad, inna mechanika. Scroll wyznacza tylko
 * INDEKS sceny (`resolveSceneIndex`), w DOM stoi jeden ekran, a przelaczenie
 * to 260 ms przenikania na czystym CSS. Powod jest mierzalny: piec ekranow to
 * piec drzew utrzymywanych w kompozycji przez cala sekcje — na telefonie sam
 * ich rozmiar zjada budzet klatki.
 *
 * `JourneyStatic` — `prefers-reduced-motion`. Te same sceny jedna pod druga,
 * kazda z wlasnym interfejsem. Fallback musi rozniac sie DOM-em, bo pieciu
 * nalozonych warstw nie da sie rozsunac sama zmiana CSS.
 *
 * ── Ekran WCHODZI, tekst sie ZMIENIA ──
 *
 * Ekran nie przenika przez ekran. Warstwa wchodzaca niesie nieprzezroczyste
 * tlo powierzchni (`bg-[var(--lp-s1)]` — dokladnie tlo ramki, wiec poza
 * przejsciem nie widac go wcale) i WJEZDZA z prawej na poprzednia, ktora
 * cofa sie o kilkanascie procent w glab. Przycina je `overflow-hidden` ramki.
 * Zadna klatka nie jest przez to ani pusta, ani podwojnie naswietlona.
 *
 * Narracja i breadcrumb ida osobno i sekwencyjnie: stara mysl gasnie, nowa
 * sie zapala. Tekst nie ma prawa przenikac przez tekst. Pelne uzasadnienie i
 * pomiary stoja przy `useSceneLayer` w `../motion/scene`; na telefonie te
 * sama role pelni `z-index` i regula `.lp-scene-switch` w `landing.css`.
 *
 * Klasa `lp-screens` na kontenerze ekranow nie niesie stylu — jest zaczepem
 * dla pomiarow, ktore licza, ile ekranow stoi naraz w DOM.
 */

interface Scene {
  index: string
  segment: WorkspaceSegment
  /**
   * Sekcje podswietlone w sidebarze. Tablica, bo scena moze objac wiecej niz
   * jedna pozycje — wszystkie musza byc widoczne w `MARKETING_SECTIONS`,
   * inaczej podswietlenie nie ma czego zapalic.
   */
  highlights: readonly WorkspaceSegment[]
  /**
   * Klucz tresci sceny w `marketing.journey.scenes.<key>` (title / body /
   * label). Copy nie mieszka w komponencie — jeden komponent, trzy jezyki.
   */
  copyKey: string
}

const SCENES: readonly Scene[] = [
  { index: '01', segment: 'dashboard', highlights: ['dashboard'], copyKey: 'dashboard' },
  { index: '02', segment: 'calendar', highlights: ['calendar'], copyKey: 'calendar' },
  // Ekran pokazuje projekty RAZEM z klientami, ale to jedna scena i jedna
  // pozycja nawigacji — powod stoi w `../product/nav`.
  { index: '03', segment: 'projects', highlights: ['projects'], copyKey: 'projects' },
  { index: '04', segment: 'invoices', highlights: ['invoices'], copyKey: 'invoices' },
  { index: '05', segment: 'reports', highlights: ['reports'], copyKey: 'reports' },
]

/**
 * Czas crossfade'u miedzy scenami na telefonie. Ta sama wartosc stoi w
 * `landing.css` (`.lp-scene-switch`) — tam robi przejscie, tutaj decyduje,
 * jak dlugo poprzednia scena zostaje jeszcze w DOM.
 */
const SWITCH_MS = 260

function screenFor(index: number, month: DemoMonth): ReactNode {
  switch (index) {
    case 0:
      return <DashboardScreen month={month} />
    case 1:
      return <CalendarScreen month={month} />
    case 2:
      return <ProjectsScreen />
    case 3:
      return <InvoiceScreen month={month} />
    default:
      return <ReportsScreen month={month} />
  }
}

export function ProductJourney({ month }: { month: DemoMonth }) {
  const reduceMotion = usePrefersReducedMotion()
  const profile = useMotionProfile()

  if (reduceMotion) return <JourneyStatic month={month} />
  if (profile === 'desktop') return <JourneyDesktop month={month} />
  return <JourneyMobile month={month} />
}

/* ─────────────────────────────── desktop ────────────────────────────── */

function JourneyDesktop({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.journey')
  const trackRef = useRef<HTMLDivElement>(null)
  const progress = useTrackProgress(trackRef)

  // Piec jawnych wywolan zamiast petli: hooki musza byc bezwarunkowe, a scen
  // jest stala piatka. Timeline liczy sie z indeksu — zadnych recznie
  // dobranych okien, wiec dodanie szostej sceny nie wymaga przestrajania
  // pozostalych piec.
  const layer0 = useSceneLayer(progress, 0, SCENES.length)
  const layer1 = useSceneLayer(progress, 1, SCENES.length)
  const layer2 = useSceneLayer(progress, 2, SCENES.length)
  const layer3 = useSceneLayer(progress, 3, SCENES.length)
  const layer4 = useSceneLayer(progress, 4, SCENES.length)
  const layers = [layer0, layer1, layer2, layer3, layer4]

  // Podswietlenie w sidebarze idzie krzywa `spotlight`, a NIE `opacity`
  // warstwy: ta ostatnia zostaje na jedynce po wejsciu sceny, wiec zapalilaby
  // wszystkie sekcje, przez ktore uzytkownik juz przejechal.
  const activeMotion: Partial<Record<WorkspaceSegment, MotionValue<number>>> = {}
  SCENES.forEach((scene, index) => {
    for (const segment of scene.highlights) activeMotion[segment] = layers[index].spotlight
  })

  return (
    <JourneyStage
      trackRef={trackRef}
      heading={t('heading')}
      copy={SCENES.map((scene, index) => (
        <m.div
          key={scene.index}
          className="lp-layer"
          style={{
            opacity: layers[index].copy.opacity,
            transform: layers[index].copy.transform,
            visibility: layers[index].copy.visibility,
          }}
        >
          <SceneCopy scene={scene} />
        </m.div>
      ))}
      frame={
        <AppFrame
          activeMotion={activeMotion}
          label={t('frameLabel')}
          breadcrumb={
            <span className="lp-layers">
              {SCENES.map((scene, index) => (
                <m.span
                  key={scene.index}
                  className="lp-layer flex items-center gap-1.5"
                  style={{
                    opacity: layers[index].copy.opacity,
                    visibility: layers[index].copy.visibility,
                  }}
                >
                  <BreadcrumbLabel segment={scene.segment} />
                </m.span>
              ))}
            </span>
          }
        >
          <div className="lp-screens lp-layers h-full overflow-clip">
            {SCENES.map((scene, index) => (
              <m.div
                key={scene.index}
                /*
                  `opacity: 1` jest tu JAWNIE, bo `.lp-layer` w `landing.css`
                  gasi wszystkie warstwy poza pierwsza — to zabezpieczenie na
                  czas PRZED hydratacja, gdy zadna warstwa nie stoi jeszcze
                  poza ramka. Ekran nie animuje jasnosci ani przez chwile.
                */
                className="lp-layer h-full min-h-0 bg-[var(--lp-s1)]"
                style={{
                  opacity: 1,
                  transform: layers[index].screen.transform,
                  visibility: layers[index].screen.visibility,
                }}
              >
                {screenFor(index, month)}
              </m.div>
            ))}
          </div>
        </AppFrame>
      }
    />
  )
}

/* ─────────────────────────────── mobile ─────────────────────────────── */

/**
 * Scena aktywna + ta, ktora wlasnie schodzi.
 *
 * `previous` zyje dokladnie tyle, co crossfade — dzieki temu w najciezszym
 * momencie w DOM sa DWA ekrany, a nie piec, i nigdy nie ma klatki, w ktorej
 * nie ma zadnego. Postep czytamy z MotionValue, wiec przewijanie nie dotyka
 * stanu Reacta; `setState` wola sie cztery razy na cala sekcje, w chwili
 * faktycznej zmiany sceny.
 */
function useActiveScene(progress: MotionValue<number>, count: number) {
  const [scene, setScene] = useState({ active: 0, previous: -1 })
  const activeRef = useRef(0)

  const sync = useCallback(
    (value: number) => {
      const next = resolveSceneIndex(value, count, activeRef.current)
      if (next === activeRef.current) return

      const from = activeRef.current
      activeRef.current = next

      /*
        Zwykly `setState`, nie `startTransition`. Sprawdzone i zmierzone:
        koszt zmiany sceny to w 70 procentach uklad i malowanie przegladarki
        (profil CPU: `(program)`), a nie render Reacta — dzielenie renderu na
        kawalki nie mialo wiec czego przyspieszyc i doklada tylko wlasny
        narzut (sumarycznie 2,2 s → 2,6 s zadan na dlawionym CPU).
      */
      setScene({ active: next, previous: from })
    },
    [count],
  )

  useMotionValueEvent(progress, 'change', sync)

  // Pierwsze wejscie na sekcje moze zastac tor juz przewiniety (powrot
  // "wstecz", kotwica #product, przywrocona pozycja scrolla). MotionValue nie
  // wysyla wtedy zdarzenia — trzeba odczytac go raz, po zamontowaniu.
  useEffect(() => {
    sync(progress.get())
  }, [progress, sync])

  // Poprzednia scena schodzi z DOM po zakonczeniu przejscia. Odliczanie stoi w
  // efekcie, a nie obok `startTransition`, bo ma sie zaczac od COMMITU nowej
  // sceny — inaczej przy wolnym renderze zdazyloby wygasnac, zanim nowa scena
  // w ogole sie pojawi.
  useEffect(() => {
    if (scene.previous === -1) return
    const timer = setTimeout(
      () => setScene((current) => ({ active: current.active, previous: -1 })),
      SWITCH_MS,
    )
    return () => clearTimeout(timer)
  }, [scene])

  return scene
}

function JourneyMobile({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.journey')
  const trackRef = useRef<HTMLDivElement>(null)
  const progress = useTrackProgress(trackRef)
  const { active, previous } = useActiveScene(progress, SCENES.length)

  // Kolejnosc rosnaca, zeby wejscie i wyjscie ze sceny mialy ten sam porzadek
  // malowania w obie strony przewijania. O tym, ktora warstwa lezy na wierzchu,
  // decyduje `z-index` w `landing.css`, a nie ta kolejnosc.
  const mounted = previous === -1 ? [active] : [active, previous].sort((a, b) => a - b)

  // Kierunek przewijania. CSS sam go nie widzi, a bez niego powrot „wstecz"
  // wygladalby jak kolejne wejscie w przod: ekran wjezdzalby z prawej takze
  // wtedy, gdy uzytkownik sie cofa.
  const back = previous > active

  return (
    <JourneyStage
      trackRef={trackRef}
      heading={t('heading')}
      /*
        Copy WSZYSTKICH scen zostaje w DOM: to kilka akapitow, a strona
        marketingowa nie moze wysylac czytnikom i wyszukiwarkom jednej piatej
        swojej tresci. Przelacza je klasa, nie wartosc sterowana scrollem.
      */
      copy={SCENES.map((scene, index) => (
        <div
          key={scene.index}
          className="lp-scene-switch"
          data-active={index === active}
          data-back={back}
        >
          <SceneCopy scene={scene} />
        </div>
      ))}
      frame={
        <AppFrame
          active={SCENES[active].segment}
          label={t('frameLabel')}
          breadcrumb={<BreadcrumbLabel segment={SCENES[active].segment} />}
        >
          <div className="lp-screens lp-layers h-full overflow-clip">
            {mounted.map((index) => (
              <div
                key={SCENES[index].index}
                className="lp-scene-slide h-full min-h-0 bg-[var(--lp-s1)]"
                data-active={index === active}
                data-back={back}
              >
                {screenFor(index, month)}
              </div>
            ))}
          </div>
        </AppFrame>
      }
    />
  )
}

/* ─────────────────────────────── shared ─────────────────────────────── */

/**
 * Scenografia wspolna dla obu profili.
 *
 * Uklad stoi TUTAJ, a nie w wariantach, bo profil ruchu przelacza sie po
 * hydratacji (patrz `../motion/profile`). Gdyby kazdy wariant trzymal wlasne
 * wymiary, to przelaczenie przesunelo by strone. Wysokosc toru jest w
 * `landing.css` pod media query — poza zasiegiem JavaScriptu.
 */
function JourneyStage({
  trackRef,
  heading,
  copy,
  frame,
}: {
  trackRef: RefObject<HTMLDivElement | null>
  heading: string
  copy: ReactNode
  frame: ReactNode
}) {
  return (
    <section id="product" aria-labelledby="product-heading">
      <h2 id="product-heading" className="sr-only">
        {heading}
      </h2>

      <div ref={trackRef} className="lp-track lp-track-journey relative">
        <div className="lp-stage sticky top-0 flex h-[100svh] items-center py-12">
          {/*
            Narracja bierze wysokosc tresci, ramka cala reszte wiersza.
            Sztywne `46vh` dawalo na wysokim oknie (np. 919x1700) ramke
            prawie kwadratowa, plywajaca posrodku czerni.
          */}
          <div className="mx-auto grid max-h-full w-full max-w-[1560px] gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,32%)_minmax(0,1fr)] lg:items-center lg:gap-8">
            <div className="lp-layers min-h-[112px] self-center">{copy}</div>

            {/*
              Ramka trzyma PROPORCJE okna aplikacji, a nie ulamek viewportu:
              na telefonie pionowa (tam mock pokazuje uklad mobilny z dolnym
              paskiem), od `sm` pozioma jak prawdziwe okno. `max-h-full`
              pilnuje, zeby nigdy nie wyszla poza scene.

              9/14, a nie 3/4: przy 3/4 ramka miala szerokosc telefonu i POLOWE
              jego wysokosci, a w srodku stal uklad zaprojektowany na pelny
              ekran. Ekran Kalendarza nie miescil wtedy miesiaca — na siatke
              zostawalo 72 px zamiast potrzebnych 206. 9/14 to najwyzsza
              proporcja, ktora miesci sie w scenie na wszystkich rozmiarach
              iPhone'a (zmierzone: 390x844, 393x852, 430x932) z zapasem.
            */}
            <div className="aspect-[9/14] max-h-[74svh] min-h-[300px] w-full sm:aspect-[4/3] lg:max-h-[70svh]">
              {frame}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────── static ─────────────────────────────── */

function JourneyStatic({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.journey')

  return (
    <section id="product" aria-labelledby="product-heading" className="mx-auto max-w-[1560px] px-4 py-20 sm:px-6">
      <h2 id="product-heading" className="sr-only">
        {t('heading')}
      </h2>

      <div className="space-y-20">
        {SCENES.map((scene, index) => (
          <article key={scene.index} className="grid gap-6 lg:grid-cols-[minmax(0,30%)_minmax(0,1fr)] lg:gap-8">
            <div className="self-center">
              <SceneCopy scene={scene} />
            </div>
            <div className="h-[70vh] min-h-[420px]">
              <AppFrame active={scene.segment} label={t(`scenes.${scene.copyKey}.label`)}>
                {screenFor(index, month)}
              </AppFrame>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function SceneCopy({ scene }: { scene: Scene }) {
  const t = useTranslations('marketing.journey.scenes')

  return (
    <>
      <span className="lp-mono lp-eyebrow">{scene.index}</span>
      <h3 className="lp-display lp-d3 mt-3">{t(`${scene.copyKey}.title`)}</h3>
      <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-[var(--lp-ink-2)] sm:text-base">
        {t(`${scene.copyKey}.body`)}
      </p>
    </>
  )
}

function BreadcrumbLabel({ segment }: { segment: WorkspaceSegment }) {
  const t = useTranslations('navigation')
  const section = MARKETING_SECTIONS.find((entry) => entry.segment === segment)!

  return (
    <>
      <span className="hidden text-zinc-400 sm:inline">{t(`groups.${section.group}`)}</span>
      <span className="hidden text-zinc-400 sm:inline">›</span>
      <span className="text-zinc-200">{t(`sections.${section.segment}`)}</span>
    </>
  )
}
