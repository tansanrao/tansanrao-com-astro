/** @type {import('tailwindcss').Config} */
export default {
    theme: {
        extend: {
            // --- Default Typography Theme (Using Flexoki) ---
            typography: (theme) => ({
                // The 'DEFAULT' key sets the base 'prose' styles
                DEFAULT: {
                    css: {
                        // Light Mode Styles (Applied with just 'prose')
                        '--tw-prose-body': theme('colors.base[950]'),
                        '--tw-prose-headings': theme('colors.black'),
                        '--tw-prose-lead': theme('colors.base[700]'),
                        '--tw-prose-links': theme('colors.blue[600]'),
                        '--tw-prose-bold': theme('colors.black'),
                        '--tw-prose-counters': theme('colors.base[600]'),
                        '--tw-prose-bullets': theme('colors.base[400]'),
                        '--tw-prose-hr': theme('colors.base[200]'),
                        '--tw-prose-quotes': theme('colors.base[800]'),
                        '--tw-prose-quote-borders': theme('colors.base[300]'),
                        '--tw-prose-captions': theme('colors.base[600]'),
                        '--tw-prose-code': theme('colors.base[800]'), // Inline code color
                        '--tw-prose-pre-code': theme('colors.base[800]'), // Code block text color
                        '--tw-prose-pre-bg': theme('colors.base[100]'), // Code block background
                        '--tw-prose-th-borders': theme('colors.base[300]'),
                        '--tw-prose-td-borders': theme('colors.base[200]'),

                        // Dark Mode Styles (Applied with 'dark:prose-invert')
                        '--tw-prose-invert-body': theme('colors.base[200]'),
                        '--tw-prose-invert-headings': theme('colors.paper'),
                        '--tw-prose-invert-lead': theme('colors.base[300]'),
                        '--tw-prose-invert-links': theme('colors.blue[400]'),
                        '--tw-prose-invert-bold': theme('colors.paper'),
                        '--tw-prose-invert-counters': theme('colors.base[400]'),
                        '--tw-prose-invert-bullets': theme('colors.base[600]'),
                        '--tw-prose-invert-hr': theme('colors.base[800]'),
                        '--tw-prose-invert-quotes': theme('colors.base[200]'),
                        '--tw-prose-invert-quote-borders': theme('colors.base[700]'),
                        '--tw-prose-invert-captions': theme('colors.base[400]'),
                        '--tw-prose-invert-code': theme('colors.base[300]'), // Inline code color (dark)
                        '--tw-prose-invert-pre-code': theme('colors.base[300]'), // Code block text color (dark)
                        '--tw-prose-invert-pre-bg': theme('colors.base[900]'), // Code block background (dark)
                        '--tw-prose-invert-th-borders': theme('colors.base[700]'),
                        '--tw-prose-invert-td-borders': theme('colors.base[800]')
                    }
                }
            })
        }
    }
};