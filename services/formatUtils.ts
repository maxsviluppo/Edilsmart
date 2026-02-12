
/**
 * Formats a number with dot as thousands separator and comma as decimal separator (Italian style)
 */
export const formatNumber = (value: number | string | undefined, decimals: number = 2): string => {
    if (value === undefined || value === null || value === '') return '0,00';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0,00';

    return new Intl.NumberFormat('it-IT', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};

/**
 * Formats a number as currency (€)
 */
export const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '') return '€ 0,00';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '€ 0,00';

    return '€ ' + formatNumber(num, 2);
};

/**
 * Formats a number for charts (e.g., 1.000k)
 */
export const formatChartValue = (value: number): string => {
    if (value >= 1000) {
        return (value / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + 'k';
    }
    return value.toLocaleString('it-IT');
};
