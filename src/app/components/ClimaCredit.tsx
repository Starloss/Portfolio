import React from 'react';
import { CLIMA_SOURCE } from '@lib/clima';
import { useI18n } from '@lib/i18n';

const LINK = 'underline underline-offset-2';

/** La atribución que pide la licencia de los datos: fuente, licencia y que se adaptaron. */
export const ClimaCredit: React.FC = () => {
    const { t } = useI18n();
    return (
        <span>
            {t('clima_credit_data')}{' '}
            <a href={CLIMA_SOURCE.url} target="_blank" rel="noreferrer" className={LINK}>
                {CLIMA_SOURCE.name}
            </a>{' '}
            (
            <a href={CLIMA_SOURCE.licenseUrl} target="_blank" rel="noreferrer" className={LINK}>
                {CLIMA_SOURCE.license}
            </a>
            ), {t('clima_credit_adapted')}
        </span>
    );
};
