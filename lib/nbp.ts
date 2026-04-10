// lib/nbp.ts

/**
 * Pobiera aktualny średni kurs EUR z API NBP (Tabela A)
 */
export async function fetchCurrentEurRate(): Promise<number | null> {
  try {
    // Używamy cache: 'no-store' lub next revalidate, aby zawsze mieć świeży kurs
    const response = await fetch(
      'https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json',
      { next: { revalidate: 3600 } } // Odświeżaj max raz na godzinę
    );

    if (!response.ok) {
      throw new Error('NBP API response was not ok');
    }

    const data = await response.json();
    
    // API NBP zwraca obiekt, gdzie kurs jest w data.rates[0].mid
    return data?.rates?.[0]?.mid || null;
  } catch (error) {
    console.error('Error fetching EUR rate from NBP:', error);
    return null;
  }
}
