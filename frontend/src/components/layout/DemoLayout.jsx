// src/components/layout/DemoLayout.jsx
// Layout des pages publiques (accueil, authentification) : Navbar en
// haut, Footer en bas, sans barre latérale. Extrait de App.jsx (qui
// composait Navbar/{children}/Footer à la main sous ce même nom
// "PublicPage") pour éviter la duplication entre les cinq routes
// publiques qui en ont besoin.

import Navbar from "./navbar";
import Footer from "./Footer";

function DemoLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default DemoLayout;
