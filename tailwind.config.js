import tailwindAnimate from 'tailwindcss-animate';

export default {
    content: [
        './index.html',
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
        './node_modules/streamdown/dist/**/*.js'
    ],
    prefix: '',
    theme: {
        extend: {
            colors: {
                border: 'hsl(var(--border))',
            },
            keyframes: {
                // 非法移动反馈：目标柱子左右抖动
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '20%': { transform: 'translateX(-6px)' },
                    '40%': { transform: 'translateX(5px)' },
                    '60%': { transform: 'translateX(-4px)' },
                    '80%': { transform: 'translateX(2px)' },
                },
            },
            animation: {
                shake: 'shake 0.4s ease-in-out',
            },
        }
    },
    plugins: [tailwindAnimate]
};
