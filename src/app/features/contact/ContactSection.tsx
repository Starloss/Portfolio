import React from 'react';
import { FiGithub, FiLinkedin, FiMail } from 'react-icons/fi';
import { trackContact, trackCvDownload } from '@lib/analytics';
import { useI18n } from '@lib/i18n';
import { cvPath } from '@lib/locale-path';

import { Block } from '../../components/Block';

const button =
    'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors';
const primary = `${button} border-primary bg-primary text-on-primary hover:opacity-90`;
const secondary = `${button} border-line text-ink hover:border-primary`;

/** Contacto: una frase y botones directos; el correo es el principal. */
export const ContactSection: React.FC = () => {
    const { t, locale, content } = useI18n();
    const { email, linkedin, github } = content.profile;
    return (
        <Block id="contact" title={t('contact_title')}>
            <p className="text-lg text-ink">{t('contact_phrase')}</p>
            <div className="flex flex-wrap gap-3">
                <a
                    href={`mailto:${email}`}
                    onClick={() => trackContact('email')}
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
        </Block>
    );
};
