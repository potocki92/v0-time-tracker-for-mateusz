'use client'

import { useTranslations } from 'next-intl'

import { DEMO_AUTOMATION_TARGET, type DemoClientId, type DemoProjectId } from './demo-data'

/**
 * Nazwy demonstracyjnego konta — jedyne miejsce, w ktorym landing zamienia
 * id z `demo-data.ts` na tekst.
 *
 * Dlaczego nazwy ida za jezykiem, skoro w APLIKACJI nazwa klienta jest DANA
 * i nigdy sie nie tlumaczy (`docs/i18n.md`): tutaj nie ma zadnych danych.
 * Konto demonstracyjne jest fikcja marketingowa, wiec kazda wersja jezykowa
 * dostaje wlasna obsade — polski czytelnik widzi Kowalskiego przy ul.
 * Przykladowej, niemiecki Mustermanna przy Musterstrasse. Reguła z panelu
 * zostaje nietknieta: tam nazwy nadal jada z bazy, nie z `messages/`.
 *
 * Struktura (stawki, kolory, relacje, liczby) zostaje po stronie
 * `demo-data.ts` — jezyk zmienia obsade, nigdy arytmetyke.
 */
export function useDemoNames() {
  const t = useTranslations('marketing.demo')

  return {
    client: (id: DemoClientId) => t(`clients.${id}`),
    project: (id: DemoProjectId) => t(`projects.${id}`),
    /** Adres budowy w trackerze = projekt, na ktory pisze automat. */
    site: t(`projects.${DEMO_AUTOMATION_TARGET.projectId}`),
    seller: { name: t('seller.name'), initials: t('seller.initials') },
  }
}
