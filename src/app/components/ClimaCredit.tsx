import React from 'react';
import { useI18n } from '@lib/i18n';

const LINK = 'underline underline-offset-2';

/** La atribución que pide la licencia de los datos: fuente, licencia y que se adaptaron. */
export const ClimaCredit: React.FC = () => {
    const { t } = useI18n();
    return (
        <span>
            {t('clima_credit_data')}{' '}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className={LINK}>
                Open-Meteo
            </a>{' '}
            (
            <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
                className={LINK}
            >
                CC BY 4.0
            </a>
            ), {t('clima_credit_adapted')}
        </span>
    );
};
