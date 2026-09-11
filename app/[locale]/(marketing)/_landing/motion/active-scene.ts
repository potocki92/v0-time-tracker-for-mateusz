/**
 * Wyznaczanie AKTYWNEJ sceny z postepu toru przewijania.
 *
 * Uzywa tego mobilny wariant `ProductJourney`, ktory nie animuje pieciu
 * ekranow naraz, tylko trzyma w DOM jeden — ten, na ktory wskazuje scroll.
 * Postep zamienia sie wiec z krzywej animacji w POJEDYNCZA liczbe calkowita,
 * ktora zmienia sie cztery razy na cala sekcje, a nie raz na klatke.
 *
 * Modul jest czysty i nie dotyka DOM ani Reacta — cala logika progow da sie
 * przetestowac jednostkowo (`__test__/landing/active-scene.test.ts`).
 */

/**
 * Martwa strefa wokol kazdego progu, w ulamku calego toru.
 *
 * Bez niej wystarczy drgnienie palca dokladnie na granicy scen, zeby indeks
 * skakal 2 → 3 → 2 → 3 i ekran migal. 0,006 toru to na typowym telefonie
 * (tor 300svh, viewport 844 px, czyli 1899 px przewijania) okolo 11 px w
 * kazda strone — duzo wiecej niz szum, duzo mniej niz swiadomy ruch.
 *
 * Wartosc jest CELOWO mniejsza niz 0,01: progi sceny leza co 0,2, a ustalone
 * punkty kontrolne (0,21 → 1, 0,41 → 2, 0,61 → 3, 0,81 → 4) sa dokladnie
 * 0,01 za granica. Przy strefie rownej 0,01 wynik zalezalby od bledu
 * zaokraglenia `0.2 + 0.01`, a nie od zamierzonego zachowania.
 */
export const SCENE_DEAD_ZONE = 0.006

/**
 * Zwraca indeks sceny dla podanego postepu.
 *
 * Prog wejscia w kolejna scene lezy `deadZone` ZA granica, a prog powrotu
 * `deadZone` PRZED nia — stad histereza. Wynik zalezy od `current`, wiec
 * funkcja jest deterministyczna w obie strony przewijania: te same progi
 * obowiazuja w gore i w dol, tylko przesuniete o martwa strefe.
 *
 * Postep spoza <0, 1> (bounce Safari, `scrollRestoration`) klamruje sie do
 * skrajnych scen; `NaN` zostawia biezaca scene nietknieta.
 */
export function resolveSceneIndex(
  progress: number,
  count: number,
  current = 0,
  deadZone = SCENE_DEAD_ZONE,
): number {
  const last = Math.max(0, count - 1)
  let index = Math.min(Math.max(Math.trunc(current) || 0, 0), last)

  if (!Number.isFinite(progress)) return index

  const share = 1 / Math.max(1, count)
  while (index < last && progress >= (index + 1) * share + deadZone) index++
  while (index > 0 && progress < index * share - deadZone) index--

  return index
}
