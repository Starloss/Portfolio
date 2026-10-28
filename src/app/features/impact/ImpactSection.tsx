import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@lib/i18n';
import { localizedPath, projectPath } from '@lib/locale-path';

import { Block } from '../../components/Block';

import type { ResolvedContent } from '@/content';

type Backing = ResolvedContent['keyFigures'][number]['backing'];

/** Franja de Impacto: cada Cifra clave es una tarjeta que lleva a lo que la respalda. */
export const ImpactSection: React.FC = () => {
    const { t, locale, content } = useI18n();

    const card = (backing: Backing, body: React.ReactNode) => {
        const className =
            'flex h-full flex-col gap-1 rounded-xl border border-line p-4 transition-colors hover:border-primary';
        if (backing.kind === 'project') {
            return (
                <Link to={localizedPath(locale, projectPath(backing.id))} className={className}>
                    {body}
                </Link>
            );
        }
        const anchor = backing.kind === 'experience' ? `#experience-${backing.id}` : '#experience';
        return (
            <a href={anchor} className={className}>
                {body}
            </a>
        );
    };

    return (
        <Block id="impact" title={t('impact_title')}>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {content.keyFigures.map((f) => (
                    <li key={f.label}>
                        {card(
                            f.backing,
                            <>
                                <span className="font-display text-3xl font-bold text-primary">
                                    {f.value}
                                </span>
                                <span className="text-sm text-ink">{f.label}</span>
                                <span className="mt-auto pt-2 text-xs font-semibold text-amber">
                                    {t('impact_see').replace('{backing}', f.backing.label)}
                                </span>
                            </>,
                        )}
                    </li>
                ))}
            </ul>
        </Block>
    );
};
