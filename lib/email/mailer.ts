import 'server-only'
import nodemailer from 'nodemailer'

/**
 * Wysylka poczty przez SMTP (domyslnie Gmail + haslo aplikacji).
 *
 * Konfiguracja siedzi w zmiennych srodowiskowych:
 *   SMTP_USER — pelny adres skrzynki nadawcy (wymagane),
 *   SMTP_PASS — haslo aplikacji, NIE haslo do konta (wymagane),
 *   SMTP_FROM — nadawca w naglowku From (domyslnie SMTP_USER),
 *   SMTP_HOST — serwer SMTP (domyslnie smtp.gmail.com),
 *   SMTP_PORT — port (domyslnie 465, czyli SMTPS).
 *
 * Brak konfiguracji rzuca wyjatkiem z czytelnym komunikatem — laduje
 * w toascie „Wyslij teraz" i w logu crona.
 */

export type OutgoingMail = {
  to: string
  subject: string
  text: string
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Brak konfiguracji poczty: ustaw ${name}`)
  return value
}

export async function sendMail(mail: OutgoingMail): Promise<void> {
  const user = requireEnv('SMTP_USER')
  const pass = requireEnv('SMTP_PASS')
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT?.trim() || 465)
  const from = process.env.SMTP_FROM?.trim() || user

  const transporter = nodemailer.createTransport({
    host,
    port,
    // 465 to SMTPS (TLS od pierwszego bajtu); 587 startuje jawnie i podnosi
    // szyfrowanie przez STARTTLS.
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({ from, to: mail.to, subject: mail.subject, text: mail.text })
}
