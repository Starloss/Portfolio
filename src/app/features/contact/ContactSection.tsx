import React, { useEffect, useRef, useState } from 'react';
import { FiGithub, FiLinkedin, FiMail } from 'react-icons/fi';
import { trackContact, trackCvDownload } from '@lib/analytics';
import { useI18n } from '@lib/i18n';
import { cvPath } from '@lib/locale-path';

import { Block } from '../../components/Block';

const button =
    'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors';
const primary = `${button} border-primary bg-primary text-on-primary hover:opacity-90`;
const secondary = `${button} border-line text-ink hover:border-primary`;

// Sin una app de correo registrada, un mailto no hace nada visible y el navegador no lo avisa. Lo
// que sí se nota es que, cuando una app se abre, la página pierde el foco: si no lo pierde en un
// segundo, se avisa que la dirección quedó copiada.
const NO_APP_AFTER_MS = 1000;

function useEmailFallback(email: string) {
    const [copied, setCopied] = useState(false);
    const stopRef = useRef<(() => void) | null>(null);
    useEffect(() => () => stopRef.current?.(), []);

    const onEmailClick = () => {
        stopRef.current?.();
        setCopied(false);
        // Se copia dentro del clic: después, Safari ya no deja escribir en el portapapeles.
        const copy =
            navigator.clipboard?.writeText(email).then(
                () => true,
                () => false,
            ) ?? Promise.resolve(false);
        let left = false;
        let cancelled = false;
        const onLeave = () => {
            left = true;
        };
        const unlisten = () => {
            window.removeEventListener('blur', onLeave);
            document.removeEventListener('visibilitychange', onLeave);
        };
        window.addEventListener('blur', onLeave);
        document.addEventListener('visibilitychange', onLeave);
        // Se sigue escuchando hasta que el portapapeles responda: un foco perdido mientras tanto
        // también indica que se abrió una app.
        const timer = window.setTimeout(async () => {
            const ok = await copy;
            unlisten();
            if (ok && !left && !cancelled) setCopied(true);
        }, NO_APP_AFTER_MS);
        // Un clic nuevo o desmontar anulan este clic, también si su copia sigue pendiente.
        stopRef.current = () => {
            cancelled = true;
            window.clearTimeout(timer);
            unlisten();
        };
    };

    return { copied, onEmailClick };
}

/** Contacto: una frase y botones directos; el correo es el principal. */
export const ContactSection: React.FC = () => {
    const { t, locale, content } = useI18n();
    const { email, linkedin, github } = content.profile;
    const { copied, onEmailClick } = useEmailFallback(email);
    return (
        <Block id="contact" title={t('contact_title')}>
            <p className="text-lg text-ink">{t('contact_phrase')}</p>
            <div className="flex flex-wrap gap-3">
                <a
                    href={`mailto:${email}`}
                    onClick={() => {
                        trackContact('email');
                        onEmailClick();
                    }}
                    className={primary}
                >
                    <FiMail aria-hidden="true" />
                    {email}
                </a>
                <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackContact('linkedin')}
                    className={secondary}
                >
                    <FiLinkedin aria-hidden="true" />
                    LinkedIn
                </a>
                <a href={github} target="_blank" rel="noopener noreferrer" className={secondary}>
                    <FiGithub aria-hidden="true" />
                    GitHub
                </a>
                <a
                    href={cvPath(locale)}
                    download
                    onClick={() => trackCvDownload(locale)}
                    className={secondary}
                >
                    {t('cv_button')}
                </a>
            </div>
            <p aria-live="polite" className="text-sm text-muted">
                {copied ? t('contact_email_copied') : null}
            </p>
        </Block>
    );
};
