import BuyTicketCard from './components/BuyTicketCard'
import CreateEventForm from './components/CreateEventForm'
import EventDashboard from './components/EventDashboard'
import GateEntry from './components/GateEntry'
import ResalePanel from './components/ResalePanel'
import ReviewPanel from './components/ReviewPanel'
import VRFPanel from './components/VRFPanel'
import WalletConnector from './components/WalletConnector.jsx'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="wallet-panel app-stack">
        <p className="eyebrow">ChainPass on Sepolia</p>
        <h1>Basic Wagmi Contract UI</h1>
        <p className="subtitle">
          A simple frontend to connect MetaMask, read event data, buy a ticket,
          and trigger the post-event review flow.
        </p>
        <WalletConnector />
        <CreateEventForm />
        <EventDashboard />
        <BuyTicketCard />
        <ResalePanel />
        <GateEntry />
        <ReviewPanel />
        <VRFPanel />
      </section>
    </main>
  )
}

export default App
