import { useEffect } from 'react';


export default function TrailerModal({ open, onClose, youTubeKey, title }) {
    useEffect(() => {
        function onEsc(e) { if (e.key === 'Escape') onClose?.(); }
        if (open) window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [open, onClose]);


    if (!open) return null;


    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
            <div className="w-full max-w-4xl card overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold">{title ?? 'Trailer'}</h3>
                    <button className="btn btn-primary" onClick={onClose}>Close</button>
                </div>
                <div className="aspect-video w-full bg-black">
                    {youTubeKey ? (
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${youTubeKey}`}
                            title="Trailer"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    ) : (
                        <div className="grid place-items-center h-full text-neutral-400">No trailer available</div>
                    )}
                </div>
            </div>
        </div>
    );
}