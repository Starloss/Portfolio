import React, { useState } from 'react';
import { useI18n } from '@lib/i18n';
import { CONTACT_EMAIL, SOCIAL_LINKS } from '@app/config/site';

export const ContactSection: React.FC = () => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Portfolio Contact: ${name || '(sin nombre)'}`;
    const body = `Nombre: ${name}\nEmail: ${email}\n\n${message}`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // Evitar fallos en tests (jsdom) donde location podría no navegar
    try {
      window.location.href = mailto;
    } catch {
      // noop
    }
  };

  return (
    <section id="contact" className="space-y-6" aria-label={t('contact_title')}>
      <h2 className="text-2xl font-semibold flex items-center gap-3">
        {t('contact_title')} <span className="h-px grow bg-slate-700" />
      </h2>
      <div className="flex flex-col md:flex-row gap-10">
        <form onSubmit={handleSubmit} className="space-y-4 flex-1" aria-label="contact form">
          <div className="flex flex-col gap-1">
            <label htmlFor="contact-name" className="text-xs font-medium text-slate-300">
              {t('contact_name')}
            </label>
            <input
              id="contact-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder={t('contact_name')}
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="contact-email" className="text-xs font-medium text-slate-300">
              {t('contact_email')}
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder={t('contact_email')}
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="contact-message" className="text-xs font-medium text-slate-300">
              {t('contact_message')}
            </label>
            <textarea
              id="contact-message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
              placeholder={t('contact_message')}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition"
          >
            {t('contact_send')}
          </button>
        </form>
        <div className="flex flex-col gap-4 w-full md:max-w-[200px]">
          <div className="flex gap-3" aria-label="social links">
            {SOCIAL_LINKS.linkedin && (
              <a
                href={SOCIAL_LINKS.linkedin}
                aria-label={t('contact_linkedin_label')}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.2h.1c.5-.9 1.8-2.2 3.7-2.2 4 0 4.7 2.6 4.7 6V23h-4v-6.5c0-1.6 0-3.7-2.3-3.7-2.3 0-2.7 1.8-2.7 3.6V23h-4V8z" />
                </svg>
              </a>
            )}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              aria-label={t('contact_email_label')}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M2 4h20c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v.01L12 13 22 6.01V6H2zm0 12h20V8l-10 7L2 8v10z" />
              </svg>
            </a>
            {SOCIAL_LINKS.github && (
              <a
                href={SOCIAL_LINKS.github}
                aria-label={t('contact_github_label')}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.72 1.27 3.39.97.1-.75.41-1.27.75-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.3 1.19-3.11-.12-.3-.52-1.52.11-3.16 0 0 .97-.31 3.18 1.19a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.5 3.17-1.19 3.17-1.19.63 1.64.24 2.86.12 3.16.74.81 1.18 1.85 1.18 3.11 0 4.43-2.7 5.41-5.28 5.69.42.36.8 1.07.8 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
                  />
                </svg>
              </a>
            )}
          </div>
          <p className="text-xs text-slate-400 break-all">{CONTACT_EMAIL}</p>
        </div>
      </div>
    </section>
  );
};
