/** Corre `run` con la página ya cargada y el navegador ocioso. Devuelve cómo cancelarlo. */
export function whenIdleAfterLoad(run: () => void): () => void {
    let cancel = () => {};
    const idle = () => {
        if (typeof window.requestIdleCallback === 'function') {
            const id = window.requestIdleCallback(run, { timeout: 3000 });
            cancel = () => window.cancelIdleCallback(id);
        } else {
            const id = window.setTimeout(run, 200);
            cancel = () => window.clearTimeout(id);
        }
    };
    if (document.readyState === 'complete') {
        idle();
        return () => cancel();
    }
    window.addEventListener('load', idle, { once: true });
    return () => {
        window.removeEventListener('load', idle);
        cancel();
    };
}
