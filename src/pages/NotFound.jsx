import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../utilities/SEO';
import { useSharedLogic } from '../utilities/shared';

export default function NotFound() {
  const { theme, lang } = useSharedLogic();
  
  // Custom translation helper to support both EN and FR (matching the portfolio's native multi-language system)
  const content = {
    en: {
      title: "Page Not Found",
      description: "The page you are looking for does not exist on Ryan Beland's portfolio website. Return to the home page to find active projects and portals.",
      h2: "Oops! Page Not Found",
      p: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
      btn: "Return Home"
    },
    fr: {
      title: "Page Non Trouvée",
      description: "La page que vous recherchez n'existe pas sur le site de Ryan Beland. Retournez à la page d'accueil pour trouver les projets et portails actifs.",
      h2: "Oups ! Page Non Trouvée",
      p: "La page que vous recherchez a peut-être été supprimée, a changé de nom ou est temporairement indisponible.",
      btn: "Retour à l'accueil"
    }
  };

  const currentLang = ['en', 'fr'].includes(lang) ? lang : 'en';
  const c = content[currentLang];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bgMain)] text-[var(--color-textMain)] p-6 text-center transition-colors duration-300">
      <SEO 
        title={`404 - ${c.title}`} 
        description={c.description} 
        canonicalUrl="https://ryanbeland.ca/404"
      />
      <div className="max-w-md w-full p-8 neu-panel border border-transparent">
        <h1 
          className="font-extrabold tracking-wider text-[var(--color-accent)]"
          style={{
            fontSize: '6rem',
            lineHeight: '1',
            marginBottom: '1rem',
            textShadow: theme === 'light' 
              ? '4px 4px 6px rgba(163, 177, 198, 0.6), -4px -4px 6px rgba(255, 255, 255, 0.8)'
              : '4px 4px 6px rgba(0, 0, 0, 0.5), -4px -4px 6px rgba(255, 255, 255, 0.05)'
          }}
        >
          404
        </h1>
        <h2 className="text-2xl font-bold mb-4 text-[var(--color-textMain)]">{c.h2}</h2>
        <p className="text-[var(--color-textMuted)] mb-8 text-sm leading-relaxed">
          {c.p}
        </p>
        <Link 
          to="/" 
          className="neu-btn px-6 py-3 font-bold inline-block text-decoration-none hover:scale-105 active:scale-95 transition-transform"
        >
          {c.btn}
        </Link>
      </div>
    </div>
  );
}
