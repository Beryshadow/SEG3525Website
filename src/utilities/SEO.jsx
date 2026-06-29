import { useEffect } from 'react';

export default function SEO({ title, description, canonicalUrl }) {
  useEffect(() => {
    // 1. Update title
    if (title) {
      document.title = `${title} | Ryan's Portfolio`;
    } else {
      document.title = "Ryan's Portfolio";
    }

    // 2. Update description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    // 3. Update Canonical Link
    if (canonicalUrl) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonicalUrl);
    }
  }, [title, description, canonicalUrl]);

  return null;
}
