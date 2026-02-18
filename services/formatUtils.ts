
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

/**
 * Formats bytes to human readable size
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
