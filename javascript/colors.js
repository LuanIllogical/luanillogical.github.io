export function setDetailColors(detailColors = null) {
    let css = ':root {\n';
    if (detailColors) {
        for (let i = 0; i <= 4; i++) {
            if (detailColors[i]) {
                const color = detailColors[i];
                css += `  --detail-color-${i}: ${color};\n`;

                if (color.startsWith('rgba')) {
                    const parts = color.match(/[\d.]+/g);
                    if (parts && parts.length === 4) {
                        const opacity = Math.min(parseFloat(parts[3]) + 0.08, 1);
                        css += `  --accent-color-${i}: rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${opacity});\n`;
                    } else {
                        css += `  --accent-color-${i}: ${color};\n`;
                    }
                } else {
                    css += `  --accent-color-${i}: ${color};\n`;
                }
            }
        }
        css += `  --link-color: var(--accent-color-4);\n`;
    } else {
        const defaultFills = [
            'rgba(255, 255, 255, 0.06)',
            'rgba(14, 68, 41, 0.55)',
            'rgba(0, 109, 50, 0.65)',
            'rgba(38, 166, 65, 0.72)',
            'rgba(57, 211, 83, 0.80)'
        ];
        const defaultBorders = [
            'rgba(255, 255, 255, 0.10)',
            'rgba(14, 68, 41, 0.65)',
            'rgba(0, 109, 50, 0.75)',
            'rgba(38, 166, 65, 0.82)',
            'rgba(57, 211, 83, 0.90)'
        ];

        for (let i = 0; i <= 4; i++) {
            css += `  --detail-color-${i}: ${defaultFills[i]};\n`;
            css += `  --accent-color-${i}: ${defaultBorders[i]};\n`;
        }
        css += `  --link-color: #58a6ff;\n`
    }
    css += '}\n';

    let styleElement = document.getElementById('global-color-scheme');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'global-color-scheme';
        document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
}

export function setBackgroundCSS(backgroundCSS = null) {
    if (!backgroundCSS) {
        document.body.style.background = "#050505";
        document.body.style.backgroundAttachment = "";
    }
    else {
        document.body.style.background = backgroundCSS;

        if (backgroundCSS.includes('gradient')) {
            document.body.style.minHeight = "100vh";
            document.body.style.backgroundAttachment = "fixed";
        }
    }
}