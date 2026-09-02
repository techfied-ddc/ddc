import { Outlet } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useLenis } from '../lib/lenis';

export default function RootLayout() {
  useLenis();

  return (
    <div className="min-h-screen bg-void text-chalk flex flex-col">
      <Nav />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
