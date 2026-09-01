import type {
  Metadata
} from "next";


import Link from "next/link";
import AuthGuard from "./components/auth-guard";

import "./globals.css";


export const metadata: Metadata = {

  title:
    "Trackflow Backoffice",

  description:
    (
      "Panel interno "
      + "de Trackflow"
    ),

};


export default function RootLayout({

  children,

}: Readonly<{

  children:
    React.ReactNode;

}>) {

  return (

    <html lang="es">

      <body>

        <nav className="navbar">

          <div className="navContent">

            <Link
              href="/"
              className="logo"
            >
              Trackflow
            </Link>


            <div className="navLinks">

              <Link href="/">
                Inicio
              </Link>

              <Link href="/incidents">
                Incidencias
              </Link>

              <Link href="/suppliers">
                Proveedores
              </Link>

            </div>

          </div>

        </nav>


        <AuthGuard>{children}</AuthGuard>

      </body>

    </html>

  );

}
