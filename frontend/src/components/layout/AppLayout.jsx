import Sidebar from "./Sidebar";
import Header from "./Header";

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="content-area">
        <Header />

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;